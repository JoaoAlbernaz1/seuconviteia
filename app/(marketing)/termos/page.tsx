import type { Metadata } from "next";
import { Clausula, EmDestaque, LegalPage } from "../legal/LegalPage";
import { DIAS_DE_VIGENCIA, EMPRESA } from "../legal/dados-da-empresa";

export const metadata: Metadata = {
  title: "Termos de uso — seuconvite",
  description: "As regras de uso da plataforma seuconvite: planos, cobrança, lista de presentes e responsabilidades.",
};

export default function TermosPage() {
  return (
    <LegalPage
      titulo="Termos de uso"
      resumo="Estas são as regras entre você e a gente. Escrevemos em português claro, sem letra miúda: o que está aqui é o que vale."
    >
      <Clausula n={1} titulo="Quem somos">
        <p>
          A plataforma <strong>{EMPRESA.nomeFantasia}</strong> é operada por {EMPRESA.razaoSocial}, inscrita no CNPJ
          sob o nº {EMPRESA.cnpj}, com sede em {EMPRESA.endereco}. Para qualquer assunto tratado neste documento, o
          contato é {EMPRESA.email}.
        </p>
        <p>
          Ao criar uma conta ou usar a plataforma, você concorda com estes Termos. Se não concordar, não use o
          serviço — e, se já tiver pago, peça o reembolso na forma da cláusula 5.
        </p>
      </Clausula>

      <Clausula n={2} titulo="As palavras que usamos">
        <p>
          <strong>Plataforma</strong> é o software que permite criar e publicar sites de convite.{" "}
          <strong>Contratante</strong> é você, que cria a conta — seja para o próprio evento, seja como profissional
          que atende clientes. <strong>Convite</strong> é o site publicado num endereço próprio.{" "}
          <strong>Convidado</strong> é quem acessa esse site para confirmar presença, deixar recado ou presentear.
        </p>
        <p>
          Quando você usa a plataforma para atender um cliente, <strong>você continua sendo o Contratante</strong>{" "}
          perante nós: a conta, o pagamento e a responsabilidade pelo conteúdo são seus.
        </p>
      </Clausula>

      <Clausula n={3} titulo="Sua conta">
        <p>
          Você precisa ter 18 anos ou mais, ou estar assistido por responsável legal. Os dados do cadastro devem ser
          verdadeiros e atualizados. A senha é pessoal: o que acontece na sua conta é tratado como feito por você,
          então avise imediatamente se suspeitar de acesso indevido.
        </p>
        <p>Uma conta por pessoa ou empresa. Não é permitido revender ou compartilhar acesso a terceiros.</p>
      </Clausula>

      <Clausula n={4} titulo="Planos e o que cada um inclui">
        <p>
          O plano <strong>Básico é gratuito</strong> e permite 1 convite publicado, com convite digital completo,
          contagem regressiva, programação, lista de presentes e endereço próprio.
        </p>
        <p>
          O plano <strong>Clássico custa R$ 59 por mês</strong> e acrescenta convites ilimitados, confirmação de
          presença, mural de recados e álbum de fotos.
        </p>
        <p>
          O plano <strong>Premium custa R$ 149 por mês</strong> e acrescenta a sua marca no lugar da nossa, domínio
          próprio do cliente e suporte prioritário com resposta em até 1 dia útil.
        </p>
        <p>
          Podemos mudar preços e o que cada plano inclui. Se isso acontecer, avisamos com no mínimo 30 dias de
          antecedência e o novo valor só vale na renovação seguinte — você pode cancelar antes disso sem custo.
        </p>
      </Clausula>

      <Clausula n={5} titulo="Cobrança, cancelamento e reembolso">
        <p>
          A assinatura é mensal e se renova automaticamente até você cancelar. O cancelamento pode ser feito a
          qualquer momento pelo painel e passa a valer no fim do período já pago — não há multa nem fidelidade.
        </p>
        <EmDestaque>
          Garantia de 7 dias: se você pagar e não gostar, peça o reembolso em até 7 dias corridos do pagamento e
          devolvemos o valor integral, sem perguntas. Esse prazo também é o seu direito de arrependimento previsto no
          art. 49 do Código de Defesa do Consumidor.
        </EmDestaque>
        <p>
          Após esse prazo, o valor do período em curso não é devolvido, mas o serviço continua disponível até o fim
          do ciclo pago. Se um pagamento falhar, a conta pode ser rebaixada para o plano Básico até a regularização.
        </p>
      </Clausula>

      <Clausula n={6} titulo="Lista de presentes: por onde o dinheiro passa">
        <p>
          Quando um convidado presenteia em dinheiro, ele <strong>paga a plataforma</strong>, e não diretamente você.
          O valor entra na sua carteira dentro da plataforma e fica disponível para resgate via Pix.
        </p>
        <EmDestaque>
          Sobre cada presente recebido incide uma taxa que depende do seu plano: <strong>5,9% no Básico</strong>,{" "}
          <strong>3,4% no Clássico</strong> e <strong>2,6% no Premium</strong>. A taxa é descontada do valor recebido —
          o convidado paga o valor cheio que escolheu, e você recebe o líquido.
        </EmDestaque>
        <p>
          Para resgatar, é preciso ativar a carteira informando os dados exigidos por lei para transferência de
          valores (nome completo, CPF, data de nascimento, telefone, ocupação, endereço e a chave Pix de destino).
          Enquanto a carteira não estiver ativada, o saldo fica retido — sem prazo de validade e sem qualquer desconto
          por isso.
        </p>
        <p>
          Não somos instituição financeira. O processamento do Pix é feito por instituição de pagamento autorizada
          pelo Banco Central, contratada por nós. Estornos, contestações e fraudes seguem as regras dessa instituição:
          se um pagamento for estornado depois de creditado, o valor correspondente é debitado da sua carteira.
        </p>
        <p>
          Presentes que sejam apenas <strong>link para loja externa</strong> não passam por nós: o convidado compra
          direto na loja, nós não recebemos nem intermediamos esse valor e não cobramos taxa sobre ele.
        </p>
      </Clausula>

      <Clausula n={7} titulo="Por quanto tempo o convite fica no ar">
        <p>
          O site do evento fica publicado durante o período de vigência definido no momento da criação — por padrão,{" "}
          {DIAS_DE_VIGENCIA} dias após a data do evento. Depois disso, o endereço deixa de exibir o convite.
        </p>
        <p>
          Os dados continuam na sua conta e podem ser exportados ou republicados enquanto a conta existir. Se você
          encerrar a conta, aplica-se a cláusula 11.
        </p>
      </Clausula>

      <Clausula n={8} titulo="O conteúdo é seu — e a responsabilidade também">
        <p>
          Fotos, textos, listas e qualquer material que você suba continuam sendo seus. Você nos concede apenas a
          licença necessária para hospedar, processar e exibir esse conteúdo no seu convite — nada além disso. Não
          usamos seu material em publicidade sem autorização escrita.
        </p>
        <p>
          Em contrapartida, você garante que tem direito sobre o que publica: fotos de terceiros, música, marcas e
          imagens de pessoas exigem autorização de quem tem o direito. Você é responsável por isso, inclusive perante
          quem se sentir prejudicado.
        </p>
        <EmDestaque>
          Sobre os dados dos convidados: quem decide coletá-los é você, então <strong>você é o controlador</strong>{" "}
          desses dados e nós somos operadores, nos termos da LGPD. Isso significa que cabe a você ter base legal para
          pedir telefone, e-mail ou restrição alimentar, e responder aos convidados sobre esses dados. A gente trata
          esses dados apenas para operar o seu convite. Os detalhes estão na Política de Privacidade.
        </EmDestaque>
      </Clausula>

      <Clausula n={9} titulo="O que não pode">
        <p>
          É proibido usar a plataforma para conteúdo ilegal, discriminatório, violento, sexual envolvendo menores,
          fraude, difamação ou violação de direito de terceiros; para enviar mensagem não solicitada em massa; para
          tentar burlar limites de plano, acessar contas alheias, sobrecarregar a infraestrutura, extrair dados de
          outros usuários ou fazer engenharia reversa do software.
        </p>
        <p>
          Também não é permitido usar a lista de presentes para finalidade diferente de presente de evento — como
          arrecadação disfarçada, venda de produtos ou movimentação de valores de terceiros.
        </p>
      </Clausula>

      <Clausula n={10} titulo="Disponibilidade, suporte e limites">
        <p>
          Trabalhamos para manter a plataforma no ar, mas não prometemos funcionamento ininterrupto: pode haver
          manutenção, falha de fornecedor ou instabilidade fora do nosso controle. No plano Básico, o suporte é feito
          por e-mail sem prazo garantido; no Premium, respondemos em até 1 dia útil.
        </p>
        <p>
          Nossa responsabilidade, quando houver, fica limitada ao valor que você pagou nos 12 meses anteriores ao
          fato. Não respondemos por lucros cessantes nem por danos decorrentes de conteúdo que você publicou, de
          informação errada no convite ou de indisponibilidade de serviços de terceiros. Nada aqui afasta os direitos
          que o Código de Defesa do Consumidor garante quando ele se aplicar.
        </p>
      </Clausula>

      <Clausula n={11} titulo="Suspensão e encerramento">
        <p>
          Você pode encerrar sua conta quando quiser. Nós podemos suspender ou encerrar uma conta que descumpra estes
          Termos, com aviso prévio sempre que possível — e sem aviso quando houver risco a terceiros, fraude ou ordem
          judicial.
        </p>
        <p>
          Encerrada a conta, os convites saem do ar e os dados são excluídos em até 30 dias, exceto o que a lei exigir
          guardar (registros fiscais e de acesso) e o necessário para concluir pagamentos pendentes. Saldo em carteira
          permanece disponível para resgate.
        </p>
      </Clausula>

      <Clausula n={12} titulo="Nosso software">
        <p>
          O código, o design, a marca e os modelos de convite da plataforma são nossos. Você recebe uma licença de uso
          pessoal e intransferível enquanto durar a assinatura, sem direito de copiar, redistribuir ou criar produto
          derivado.
        </p>
      </Clausula>

      <Clausula n={13} titulo="Mudanças nestes Termos">
        <p>
          Podemos atualizar este documento. Mudança relevante é avisada por e-mail ou dentro do painel com pelo menos
          30 dias de antecedência. Continuar usando depois disso significa aceitar a nova versão; se não aceitar, você
          pode cancelar sem custo.
        </p>
      </Clausula>

      <Clausula n={14} titulo="Lei aplicável e foro">
        <p>
          Aplica-se a lei brasileira. Fica eleito o foro do domicílio do consumidor para as questões de consumo, e o
          da sede da empresa para as demais. Antes de qualquer disputa, escreva para {EMPRESA.email} — quase tudo se
          resolve por ali.
        </p>
      </Clausula>
    </LegalPage>
  );
}
