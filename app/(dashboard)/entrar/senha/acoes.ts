"use server";

// REDEFINIÇÃO DE SENHA — as duas portas: pedir o link e usar o link.
//
// Regras que valem mais que a comodidade:
//
//  1. **A resposta do pedido é SEMPRE a mesma**, exista a conta ou não. Se a tela
//     dissesse "não achamos esse e-mail", qualquer pessoa poderia usar este
//     formulário para descobrir quem tem conta aqui — e a lista de clientes de
//     uma plataforma de festas é justamente o que um concorrente quer.
//  2. **Limite de tentativas** por e-mail e por origem: sem isso, o formulário é
//     um canhão de e-mail apontado para a caixa de outra pessoa (e a nossa
//     reputação de remetente vai junto).
//  3. **Pedido novo invalida os anteriores.** Dois links vivos ao mesmo tempo
//     dobram a janela de ataque sem dar nada em troca.
//  4. **Trocar a senha derruba os links restantes.** Quem trocou a senha porque
//     desconfiou de acesso indevido não pode continuar com um link válido na
//     caixa de entrada de quem invadiu.
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { emailConfigurado, enviarEmail } from "@/lib/email";
import { consumir } from "@/lib/limiteTaxa";
import { protocoloDe, rootDomain } from "@/lib/tenant";
import {
  SENHA_MINIMA,
  avaliarPedido,
  emailDeRedefinicao,
  expiraEm,
  gerarToken,
  hashDoToken,
  linkDeRedefinicao,
  textoDaRecusa,
} from "@/lib/senhaReset";

/** A mesma frase para conta existente e inexistente (ver regra 1). */
const RESPOSTA_NEUTRA =
  "Se existe uma conta com esse e-mail, o link para criar uma senha nova acabou de sair.";

export type PedidoState = {
  ok?: boolean;
  aviso?: string;
  erro?: string;
  /** O e-mail não saiu porque o envio não está configurado (problema NOSSO). */
  semEmail?: boolean;
};

const pedidoSchema = z.object({ email: z.string().trim().toLowerCase().email() });

/** Base pública do painel — é de lá que o link do e-mail tem de sair. */
function baseDoPainel(): string {
  const root = rootDomain();
  return `${protocoloDe(root)}://app.${root}`;
}

export async function pedirRedefinicao(
  _prev: PedidoState,
  formData: FormData,
): Promise<PedidoState> {
  const parsed = pedidoSchema.safeParse({ email: formData.get("email") });
  // E-mail malformado é o único erro que a tela pode apontar sem vazar nada.
  if (!parsed.success) return { erro: "Informe um e-mail válido." };
  const email = parsed.data.email;

  // 3 pedidos por e-mail a cada 15 minutos. O limite é POR E-MAIL de propósito:
  // proteger a caixa de entrada de quem talvez nem pediu.
  const limite = consumir(`reset:${email}`, 3, 15 * 60_000);
  if (!limite.ok) {
    // Mesmo aqui a resposta não confirma se a conta existe.
    return { ok: true, aviso: RESPOSTA_NEUTRA };
  }

  const conta = await prisma.professional.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (conta) {
    const { token, tokenHash } = gerarToken();
    const agora = new Date();
    await prisma.$transaction([
      // Regra 3: o link novo é o único vivo.
      prisma.passwordReset.updateMany({
        where: { professionalId: conta.id, usedAt: null },
        data: { usedAt: agora },
      }),
      prisma.passwordReset.create({
        data: { professionalId: conta.id, tokenHash, expiresAt: expiraEm(agora) },
      }),
    ]);

    const { subject, html } = emailDeRedefinicao(
      conta.name,
      linkDeRedefinicao(baseDoPainel(), token),
    );
    await enviarEmail({ to: conta.email, subject, html, fromName: "seuconvite" });

    // `enviarEmail` engole erro de propósito (nenhum fluxo pode quebrar por
    // causa de e-mail) — e sem `RESEND_API_KEY` o provider é um STUB que só
    // loga. Aqui isso seria cruel: a pessoa está trancada fora da conta e a tela
    // diria "enviamos" para sempre. Então avisamos que o problema é nosso.
    if (!emailConfigurado()) {
      console.error(
        "[senha] RESEND_API_KEY ausente: o link de redefinicao NAO foi enviado " +
          `para ${conta.email}. Configure o envio de e-mail em producao.`,
      );
      return { ok: true, semEmail: true, aviso: RESPOSTA_NEUTRA };
    }
  }

  return { ok: true, aviso: RESPOSTA_NEUTRA };
}

export type NovaSenhaState = {
  ok?: boolean;
  erro?: string;
};

const novaSenhaSchema = z
  .object({
    token: z.string().trim().min(10).max(200),
    senha: z.string().min(SENHA_MINIMA, `A senha precisa ter ao menos ${SENHA_MINIMA} caracteres.`),
    confirmacao: z.string(),
  })
  .refine((d) => d.senha === d.confirmacao, {
    message: "As duas senhas precisam ser iguais.",
    path: ["confirmacao"],
  });

export async function redefinirSenha(
  _prev: NovaSenhaState,
  formData: FormData,
): Promise<NovaSenhaState> {
  const parsed = novaSenhaSchema.safeParse({
    token: formData.get("token"),
    senha: formData.get("senha"),
    confirmacao: formData.get("confirmacao"),
  });
  if (!parsed.success) {
    return { erro: parsed.error.issues[0]?.message ?? "Confira os dados e tente de novo." };
  }

  const agora = new Date();
  const pedido = await prisma.passwordReset.findUnique({
    where: { tokenHash: hashDoToken(parsed.data.token) },
    select: { id: true, professionalId: true, expiresAt: true, usedAt: true },
  });
  const veredito = avaliarPedido(pedido, agora);
  if (!veredito.ok) return { erro: textoDaRecusa(veredito.motivo) };

  const senhaHash = await bcrypt.hash(parsed.data.senha, 10);
  await prisma.$transaction([
    // Compare-and-set no `usedAt`: dois envios do mesmo formulário (duplo clique,
    // ou o link aberto em duas abas) não podem trocar a senha duas vezes.
    prisma.passwordReset.updateMany({
      where: { id: pedido!.id, usedAt: null },
      data: { usedAt: agora },
    }),
    prisma.professional.update({
      where: { id: pedido!.professionalId },
      data: { passwordHash: senhaHash },
    }),
    // Regra 4: qualquer outro link vivo desta conta morre agora.
    prisma.passwordReset.updateMany({
      where: { professionalId: pedido!.professionalId, usedAt: null },
      data: { usedAt: agora },
    }),
  ]);

  return { ok: true };
}
