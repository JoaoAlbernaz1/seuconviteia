import type { Metadata } from "next";
import { Clausula, EmDestaque, LegalPage } from "../legal/LegalPage";
import { EMPRESA } from "../legal/dados-da-empresa";

export const metadata: Metadata = {
  title: "Política de privacidade — seuconvite",
  description: "Quais dados o seuconvite coleta, por quê, com quem compartilha e como você exerce seus direitos.",
};

export default function PrivacidadePage() {
  return (
    <LegalPage
      titulo="Política de privacidade"
      resumo="O que a gente coleta, por que coleta, com quem divide e como você manda apagar. Escrito para ser entendido, não para se proteger de você."
    >
      <Clausula n={1} titulo="Quem é responsável pelos dados">
        <p>
          Os dados tratados na plataforma {EMPRESA.nomeFantasia} estão sob responsabilidade de {EMPRESA.razaoSocial},
          CNPJ {EMPRESA.cnpj}, com sede em {EMPRESA.endereco}. O encarregado de dados (DPO) é{" "}
          {EMPRESA.encarregado}, e o canal para qualquer assunto de privacidade é {EMPRESA.email}.
        </p>
        <EmDestaque>
          Há dois papéis diferentes aqui, e a distinção importa. Sobre os dados da <strong>sua conta</strong>, nós
          somos o controlador. Sobre os dados dos <strong>convidados</strong> do seu evento, quem decide coletá-los é
          você — então você é o controlador e nós apenas operamos a seu comando, nos termos dos arts. 5º, VI e VII, da
          LGPD.
        </EmDestaque>
      </Clausula>

      <Clausula n={2} titulo="O que coletamos de você (Contratante)">
        <p>
          <strong>Cadastro:</strong> nome, e-mail e senha (guardada apenas como hash, nunca em texto legível).
          Opcionalmente foto de perfil e dados da sua marca.
        </p>
        <p>
          <strong>Para receber dinheiro de presentes:</strong> ao ativar a carteira, coletamos nome completo, CPF,
          data de nascimento, telefone, ocupação, endereço e chave Pix. Esses dados existem porque a legislação de
          prevenção à lavagem de dinheiro exige identificar quem recebe valores — não os usamos para mais nada.
        </p>
        <p>
          <strong>Uso e segurança:</strong> registros de acesso (data, hora e IP), que a lei obriga a guardar por 6
          meses (Marco Civil da Internet, art. 15).
        </p>
      </Clausula>

      <Clausula n={3} titulo="O que é coletado dos convidados">
        <p>
          Depende do que você habilitar no seu convite. Pode incluir nome, confirmação de presença, número de
          acompanhantes, telefone, e-mail, restrição alimentar e o recado deixado no mural. Em presentes, o nome de
          quem presenteou, o valor e a mensagem.
        </p>
        <p>
          Nós não usamos esses dados para nada além de fazer o seu convite funcionar. Não vendemos, não cruzamos com
          outras bases e não mandamos publicidade para os seus convidados.
        </p>
        <EmDestaque>
          Restrição alimentar pode revelar religião ou condição de saúde — o que a LGPD classifica como{" "}
          <strong>dado sensível</strong> (art. 5º, II). Se você habilitar esse campo, peça só o necessário e deixe
          claro ao convidado para que serve.
        </EmDestaque>
      </Clausula>

      <Clausula n={4} titulo="Por que podemos tratar esses dados">
        <p>
          <strong>Execução do contrato</strong> (art. 7º, V): criar sua conta, publicar o convite, processar
          pagamentos e dar suporte. <strong>Obrigação legal</strong> (art. 7º, II): guardar registros de acesso e
          documentos fiscais, e identificar quem recebe valores.{" "}
          <strong>Legítimo interesse</strong> (art. 7º, IX): segurança, prevenção a fraude e melhoria do produto,
          sempre com dados mínimos. <strong>Consentimento</strong> (art. 7º, I): apenas para o que for opcional, como
          comunicação de novidades — e você pode retirar quando quiser.
        </p>
      </Clausula>

      <Clausula n={5} titulo="Com quem compartilhamos">
        <p>Só com quem é necessário para o serviço funcionar, e cada um vê apenas o que precisa:</p>
        <p>
          <strong>Supabase</strong> — banco de dados, hospedado na região de São Paulo.{" "}
          <strong>Vercel</strong> — hospedagem da aplicação e armazenamento de imagens; o processamento das
          requisições ocorre em servidores nos Estados Unidos. <strong>Mercado Pago</strong> — processamento do Pix
          dos presentes. <strong>Resend</strong> — envio dos e-mails do sistema.
        </p>
        <p>
          Também podemos compartilhar dados para cumprir ordem judicial ou obrigação legal. Fora isso, não repassamos
          dados a ninguém — e em nenhuma hipótese vendemos.
        </p>
        <EmDestaque>
          Como parte do processamento acontece fora do Brasil, existe transferência internacional de dados. Ela é
          feita com base no art. 33 da LGPD, para execução do contrato, e com fornecedores que oferecem cláusulas
          contratuais de proteção equivalentes.
        </EmDestaque>
      </Clausula>

      <Clausula n={6} titulo="Cookies">
        <p>
          Usamos apenas cookies essenciais: o que mantém você logado no painel e o que protege formulários contra
          fraude de envio. <strong>Não usamos cookie de publicidade nem rastreador de terceiros</strong> — não há
          Google Analytics, pixel de rede social ou ferramenta de mapa de calor na plataforma. Por isso não existe
          banner de cookies aqui: não há nada opcional para você recusar.
        </p>
      </Clausula>

      <Clausula n={7} titulo="Por quanto tempo guardamos">
        <p>
          Dados da conta e dos convites: enquanto a conta existir. Após o encerramento, excluímos em até 30 dias,
          exceto registros de acesso (6 meses, por obrigação legal), documentos fiscais (5 anos) e dados necessários
          para concluir pagamentos ou defender direitos em processo.
        </p>
        <p>
          Dados de convidados: enquanto o convite existir na sua conta. Você pode apagá-los a qualquer momento pelo
          painel — e, quando você apaga, apagamos de verdade.
        </p>
      </Clausula>

      <Clausula n={8} titulo="Seus direitos">
        <p>
          A LGPD (art. 18) garante que você peça: confirmação de que tratamos seus dados, acesso a eles, correção do
          que estiver errado, anonimização ou exclusão do que for desnecessário, portabilidade, informação sobre com
          quem compartilhamos, e revogação de consentimento.
        </p>
        <p>
          Para exercer qualquer um deles, escreva para {EMPRESA.email}. Respondemos em até 15 dias. Se precisarmos
          confirmar sua identidade antes, pedimos o mínimo necessário para isso.
        </p>
        <p>
          Se você é convidado de um evento e quer que seus dados sejam apagados, pode falar tanto com quem te convidou
          (o controlador) quanto conosco — nós encaminhamos e acompanhamos.
        </p>
      </Clausula>

      <Clausula n={9} titulo="Segurança">
        <p>
          Senhas são guardadas com hash, o tráfego é criptografado, o acesso ao banco é restrito e cada conta só
          enxerga os próprios dados. Nenhum sistema é 100% seguro: se acontecer incidente com risco relevante,
          avisamos você e a Autoridade Nacional de Proteção de Dados, como manda o art. 48 da LGPD.
        </p>
      </Clausula>

      <Clausula n={10} titulo="Menores de idade">
        <p>
          A conta é para maiores de 18 anos. Convites de festa de 15 anos frequentemente envolvem dados de
          adolescentes: nesse caso, cabe a você, como controlador, ter o consentimento de quem detém a guarda, na
          forma do art. 14 da LGPD.
        </p>
      </Clausula>

      <Clausula n={11} titulo="Mudanças nesta política">
        <p>
          Quando alterarmos este documento, atualizamos a data no topo e avisamos por e-mail se a mudança for
          relevante. Versões anteriores ficam disponíveis mediante pedido.
        </p>
      </Clausula>
    </LegalPage>
  );
}
