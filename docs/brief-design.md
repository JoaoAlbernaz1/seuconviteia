# SeuConvite IA — brief de produto e design

## 1. O que é
Plataforma B2B, multi-tenant, onde profissionais de eventos (cerimonialistas, ateliês,
buffets/casas de festa, decoradores, assessores e designers de convite) criam sites de
evento para os clientes deles. Multi-nicho: casamento, 15 anos, 60 anos, bodas e aniversário.
Cada evento vira um site próprio num subdomínio automático (ex.: mariaclara.seuconviteia.com).

## 2. MODELO DE NEGÓCIO — ASSINATURA
O profissional ASSINA um plano mensal e cria eventos sem precisar pagar por site.
- Planos: Básico, Clássico e Premium (white-label). Clássico é o mais popular.
- Eventos ilimitados a partir do Clássico.
- Recursos por nível de plano (não são compras avulsas): convite, RSVP, lista de
  presentes, álbum, mural de recados, save the date. Domínio próprio/white-label é Premium.
- Receita = mensalidade do plano + uma pequena taxa sobre a lista de presentes (Pix).
- Fluxo do site: rascunho → publicar (incluído no plano, sem cobrança extra).
  Sem marca d'água, sem pagamento por publicação.

## 3. Personas
- Profissional (assinante): usa o PAINEL para criar/personalizar/publicar/gerenciar os
  sites e gerenciar o plano. Não é técnico.
- Cliente final (noiva/noivo, debutante, família): recebe o SITE; sem login.
- Convidado: navega o site, confirma presença, deixa recado, vê álbum, presenteia (Pix).

## 4. Jornada
1. Profissional cria conta e assina um plano. 2. No painel, Criar evento → formulário rico
(nicho, paleta, dados, local, programação, presentes, fotos). 3. Edita como rascunho com
preview ao vivo. 4. Publica (incluído no plano) → site no ar no subdomínio.
5. Acompanha RSVP, recados e presentes pelo painel.

## 5. Superfícies a desenhar
- Landing (vende o ASSINE → crie eventos ilimitados → recursos por plano).
- Cadastro / Login (com escolha de plano).
- Painel: visão geral, lista de eventos, criar/editar evento, perfil, gerenciar plano.
- Formulário criar/editar evento: nicho, paleta, dados, local, programação, presentes (Pix),
  fotos, com sugestões de texto e preview ao vivo.
- Perfil: foto/avatar, nome, marca (crédito no rodapé), senha, plano.
- Site do evento (produto final): capa cinematográfica + convite + evento
  (quando/onde/programação/mapa/contador) + lista de presentes (Pix) + RSVP + recados + álbum.

## 6. Recursos por plano
- Básico: templates essenciais, convite digital, RSVP, subdomínio automático, lista de
  presentes (Pix).
- Clássico (popular): tudo do Básico + todos os templates/nichos + álbum + mural de recados
  + save the date + eventos ilimitados + taxa reduzida na lista de presentes.
- Premium: tudo do Clássico + white-label (marca própria) + domínio personalizado + suporte
  prioritário.
Quando um recurso não está no plano do profissional, mostrar estado de upgrade (não compra avulsa).

## 7. Identidade visual (DUAS identidades, não misturar)
a) Plataforma (landing, painel, cadastro, perfil) — turquesa + roxo:
- Cores: ink #0F172A (texto), turquesa #2DE2E6 (acento), teal #0EA5A6 (apoio),
  violeta #6D28D9 (CTA), névoa #F1F5F9 (fundo), lilás #EDE9FE (superfícies),
  texto-suave #64748B.
- Gradientes: texto = teal→violeta (90°); acentos/ícones/badges = turquesa→teal→violeta (135°).
- Fontes: Fraunces (serif, títulos) + Sora (sans, UI). Wordmark: seuconvite + "ia"
  (gradiente teal→violeta). Ícones: Bootstrap Icons. Clima: premium, claro, CTA roxo.
b) Site do evento — editorial, cinematográfico, themeable:
- Paletas prontas (rosé/dourado/azul/lavanda/verde/terracota) re-tingem o site.
- Capa escura cinematográfica com foto, nome em fonte de destaque/cursiva, seções calmas,
  muito respiro. Fontes display + script + Cormorant.

## 8. Tom e referências
Premium e específico, NUNCA genérico/"cara de IA". Painel: referência Horizon UI
(sidebar + cards limpos). Site do evento: editorial/cinematográfico rosé (festa 15 anos).
Simples de entender (o profissional não é técnico).

## 9. Stack (caso gere código)
Next.js (App Router, React) + Tailwind CSS + Bootstrap Icons. Multi-tenant por subdomínio.

## 10. Regras de ouro
- Comunicar o modelo de ASSINATURA: assine um plano → eventos ilimitados → recursos por nível.
  + taxa sobre a lista de presentes. Nada de pagamento por site ou marca d'água.
- Duas identidades (turquesa/roxo plataforma vs. rosé editorial site do evento) — não misturar.
- Premium, não genérico. Replicar referências com fidelidade.
