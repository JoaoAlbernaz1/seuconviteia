// POST /api/gerar-foto — gera/escolhe uma FOTO para um presente a partir do
// título. Autenticado (dono logado).
//
// Protegida por LIMITE de 20 imagens/hora por conta quando a IA esta ligada —
// cada imagem e dinheiro do dono do SaaS (ver `lib/limiteTaxa.ts`).
//
// Dois modos (seam por env):
//   - `OPENAI_API_KEY` presente -> gera por IA (gpt-image-1, qualidade "low",
//     ~US$0,01/imagem), salva no storage e devolve a URL.
//   - sem chave (dev/beta)      -> escolhe a foto TEMÁTICA do catálogo local
//     (public/presentes-demo) por palavra-chave do título. Sempre funciona.
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getStorageProvider } from "@/lib/storage";
import { consumir } from "@/lib/limiteTaxa";
import {
  descricaoSegura,
  instrucoesDoRoteirista,
  pedidoAoRoteirista,
  promptDaImagem,
  promptDeReserva,
} from "@/lib/roteiroImagem";

export const runtime = "nodejs";
// Roteirista + imagem em `medium` passam bem dos 10s padrão.
export const maxDuration = 60;

/** Modelo do roteirista. Trocável por ambiente sem mexer no código. */
const MODELO_TEXTO = process.env.OPENAI_TEXT_MODEL ?? "gpt-4o-mini";

const bodySchema = z.object({
  titulo: z.string().trim().min(2).max(120),
  /**
   * Cor do convite — entra como cor de apoio na cena. Cor estranha é IGNORADA,
   * não recusada: perder a geração inteira por causa de um detalhe estético
   * seria trocar o essencial pelo enfeite.
   */
  cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().catch(undefined),
});

/** Quantas imagens uma conta cria por hora (cada uma custa ~US$0,01). */
const MAX_POR_HORA = 20;
const UMA_HORA = 60 * 60 * 1000;

/** Foto temática local por palavra-chave (fallback sem IA). */
function fotoTematica(titulo: string): string {
  const t = titulo.toLowerCase();
  // O acervo tem OITO fotos: por melhor que fique a lista de palavras, presente
  // fora dela cai na foto genérica de festa. Quem gera imagem DE VERDADE é a
  // IA (basta a OPENAI_API_KEY no ambiente) — isto aqui é o plano B para não
  // deixar o botão sem resposta.
  const REGRAS: [RegExp, string][] = [
    [/viag|lua de mel|passeio|intercâmbio|intercambio|hotel|hosped/, "viagem"],
    [/vestido|roupa|look|traje|terno|smoking/, "vestido"],
    [/maquiagem|make|batom|beleza|unha|manicure|perfume/, "make"],
    [/foto|ensaio|c[âa]mera|filmagem|v[íi]deo|[áa]lbum|drone/, "foto"],
    [/spa|massagem|bem-estar|sal[ãa]o|cabelo|penteado|dia da noiva/, "spa"],
    [/sapato|salto|t[êe]nis|cal[çc]ado|bolsa/, "sapato"],
    [/fone|m[úu]sica|som|show|ingresso|dj|banda|valsa|dan[çc]a|baile|karaok/, "som"],
  ];
  for (const [re, nome] of REGRAS) if (re.test(t)) return `/presentes-demo/${nome}.jpg`;
  return "/presentes-demo/festa.jpg";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Informe o nome do presente." }, { status: 400 });
  }
  const { titulo, cor } = parsed.data;

  const apiKey = process.env.OPENAI_API_KEY;

  // Teto por conta — só quando a IA está ligada, que é quando cada chamada
  // custa dinheiro. Sem chave, a resposta sai do acervo local e limitar seria
  // atrapalhar de graça.
  if (apiKey) {
    const limite = consumir(`gerar-foto:${session.user.id}`, MAX_POR_HORA, UMA_HORA);
    if (!limite.ok) {
      const minutos = Math.ceil(limite.esperarSegundos / 60);
      return NextResponse.json(
        {
          error:
            `Você já criou ${MAX_POR_HORA} imagens nesta hora. ` +
            `Tente de novo em ${minutos} minuto${minutos === 1 ? "" : "s"} — ou envie uma foto sua.`,
        },
        { status: 429 },
      );
    }
  }

  if (!apiKey) {
    // Sem IA configurada: foto temática do catálogo (grátis, instantânea).
    return NextResponse.json({ url: fotoTematica(titulo), origem: "catalogo" });
  }

  // 1) O ROTEIRISTA escreve a cena. Falhou (modelo fora, lentidão, resposta
  //    estranha)? Segue com o pedido de reserva — nunca trava a geração.
  let descricao: string | null = null;
  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(12_000),
      body: JSON.stringify({
        model: MODELO_TEXTO,
        messages: [
          { role: "system", content: instrucoesDoRoteirista() },
          { role: "user", content: pedidoAoRoteirista(titulo, cor) },
        ],
        max_completion_tokens: 160,
      }),
    });
    if (!r.ok) throw new Error(`OpenAI texto ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    descricao = descricaoSegura(data.choices?.[0]?.message?.content);
    if (!descricao) throw new Error("roteirista devolveu resposta vazia");
  } catch (err) {
    console.error("[gerar-foto] roteirista falhou; usando o pedido de reserva:", err);
  }

  // 2) O DESENHISTA. `medium` porque `low` sai visivelmente tosco — decisão do
  //    João, sabendo que quadruplica o custo (~US$0,04 por imagem).
  try {
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt: descricao ? promptDaImagem(descricao) : promptDeReserva(titulo),
        size: "1024x1024",
        quality: "medium",
        n: 1,
      }),
    });
    if (!r.ok) throw new Error(`OpenAI ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const data = (await r.json()) as { data?: { b64_json?: string }[] };
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error("resposta sem imagem");

    const file = new File([Buffer.from(b64, "base64")], "gerada.png", { type: "image/png" });
    const { url } = await getStorageProvider().salvar(file, `eventos/${session.user.id}/geradas`);
    // `roteiro` conta se a cena foi escrita ou se caiu na reserva — é o que
    // permite ver, pelo log e pela resposta, se o roteirista está de pé.
    return NextResponse.json({ url, origem: "ia", roteiro: descricao ? "sim" : "reserva" });
  } catch (err) {
    console.error("[gerar-foto] IA falhou; caindo para o catálogo:", err);
    return NextResponse.json({ url: fotoTematica(titulo), origem: "catalogo" });
  }
}
