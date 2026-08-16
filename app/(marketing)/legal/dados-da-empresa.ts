/**
 * Identificacao juridica usada nos Termos de Uso e na Politica de Privacidade.
 *
 * ⚠️ OS CAMPOS ABAIXO PRECISAM SER PREENCHIDOS ANTES DE VALER JURIDICAMENTE.
 * Enquanto estiverem com "[PREENCHER: ...]", o texto aparece literalmente assim
 * nas paginas publicas — e de proposito: contrato com dado inventado e pior que
 * contrato incompleto. O Codigo de Defesa do Consumidor (art. 46) so vincula o
 * consumidor ao que ele pode conhecer previamente, e a LGPD (art. 9, I) exige
 * identificacao clara do controlador.
 */
export const EMPRESA = {
  /** Razao social completa, como no cartao CNPJ. */
  razaoSocial: "[PREENCHER: razão social]",
  /** Nome fantasia / marca usada no site. */
  nomeFantasia: "seuconvite",
  /** CNPJ com pontuacao. Se ainda for CPF (MEI nao constituido), use o CPF. */
  cnpj: "[PREENCHER: CNPJ]",
  /** Endereco completo com CEP — precisa ser um endereco real de correspondencia. */
  endereco: "[PREENCHER: endereço completo com CEP]",
  /** E-mail de contato que FUNCIONA. Hoje o dominio seuconviteia.com nao existe. */
  email: "[PREENCHER: e-mail de contato]",
  /** Encarregado de dados (LGPD, art. 41). Pode ser o proprio dono. */
  encarregado: "[PREENCHER: nome do encarregado de dados]",
} as const;

/** Data da ultima revisao dos documentos legais. Atualize ao mudar o texto. */
export const ATUALIZADO_EM = "16 de agosto de 2026";

/** Vigencia padrao do site do evento, em dias, contados da publicacao. */
export const DIAS_DE_VIGENCIA = 30;
