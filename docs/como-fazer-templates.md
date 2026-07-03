# Como fazer os templates do seuconviteia (guia do João)

> O fluxo é o MESMO que funcionou pro painel: **você cola um prompt na IA de
> design → ela gera o mockup HTML → você olha e aprova → me manda o arquivo →
> eu replico FIEL no produto.** Você não precisa desenhar nada nem decidir
> tecnicalidade — só escolher o template, colar o prompt e julgar o resultado.

---

## 1. Entenda em 1 minuto

- **Template = a ROUPA do site.** Muda o desenho: como é a capa, as molduras
  das fotos, as texturas, o jeito das seções.
- **Os DADOS são o corpo** e nunca mudam: nome, data, local, mensagem, fotos,
  presentes, programação… O cliente troca de template e **não perde nada**.
- **Cor e letra NÃO são template.** Paleta (6 opções) e estilo de letra
  (5 duplas) são escolhas separadas do cliente, que funcionam em QUALQUER
  template. Por isso o template novo precisa mudar o **desenho**, não a cor.

## 2. O que o cliente edita (igual em todo template — não mexa nisso)

| Grupo | Campos editáveis |
|---|---|
| Informações | nome do evento · ocasião · data · horário · local · endereço (gera mapa) · traje |
| Textos | mensagem de boas-vindas · texto da lista de presentes · programação (hora + título) |
| Fotos | foto de capa · álbum (galeria) · foto da lista de presentes |
| Presentes | chave Pix · nome de quem recebe · QR Code do Pix · itens com valores |
| Estilo | paleta (Rosé, Dourado, Azul, Lavanda, Verde, Terracota) · dupla de letras (Clássica, Romântica, Moderna, Minimalista, Festiva) |
| Recursos liga/desliga | confirmação de presença · lista de presentes · contador · programação · mural de recados · galeria |

**Páginas fixas do site:** Capa (início) · Evento · Presentes · Galeria ·
Recados · Confirmar presença. Todo template desenha ESSAS páginas — nem mais,
nem menos.

## 3. Passo a passo (5 passos)

1. **Escolha 1 template** da lista da seção 5 (recomendo começar pelo
   Editorial ou pelo Noite — ver seção 6).
2. **Copie o PROMPT MESTRE** (seção 4) + a **FICHA do template** escolhido
   (seção 5) e cole tudo junto na IA de design (a mesma dos outros mockups).
3. **Olhe o resultado.** Se não gostou, peça ajustes lá mesmo ("mais escuro",
   "foto maior", "menos enfeite") até gostar DE VERDADE.
4. **Baixe o HTML** (código completo) e me mande o nome do arquivo.
5. **Eu porto fiel** pro produto: o template entra na galeria, funciona com as
   6 paletas + 5 letras + todos os recursos, e o preview mostra ele de verdade.

## 4. PROMPT MESTRE (copie daqui, cole junto com a ficha do template)

```
Você é um designer de sites de convite premium. Desenhe, em ALTA fidelidade,
o SITE DE EVENTO de um SaaS brasileiro (convite digital que os convidados
abrem pelo link no WhatsApp). NÃO é o painel do SaaS — é o site que o
convidado vê.

REGRAS FIXAS (valem para qualquer template):
- Páginas a desenhar (nesta ordem): 1) CAPA/início, 2) página EVENTO
  (mensagem completa, quando/onde com mapa, contador regressivo, traje,
  programação hora a hora, botão confirmar presença), 3) página PRESENTES
  (texto gentil + lista de presentes com valores + Pix com QR code).
  Se couber, também: galeria de fotos e mural de recados.
- Desktop 1440px E mobile 390px (a maioria dos convidados abre no celular).
- Dados de exemplo reais em português: "Maria Clara", 15 anos, 29 de agosto,
  20h30, Esplendor Hall. Nada de lorem ipsum.
- Navegação no topo: Início · Evento · Presentes · Galeria · Recados ·
  Confirmar.
- IMPORTANTE: a cor e as fontes serão trocáveis pelo cliente depois. Desenhe
  na paleta padrão indicada na ficha, mas a IDENTIDADE do template deve estar
  no DESENHO (composição, molduras, texturas, ritmo), não na cor.
- Fotos: use retângulos/placeholder desenhados em CSS (sem imagens externas).
- Entrega: UM arquivo HTML auto-contido (CSS embutido, sem CDN, sem
  JavaScript obrigatório). É mockup para aprovação visual, não código final.
- Não invente seções novas nem remova as listadas. Capricho de agência: 
  tipografia impecável, espaçamento generoso, zero cara de template genérico.
```

## 5. A ficha de cada template (cole UMA por vez, depois do prompt mestre)

**EDITORIAL** *(casamentos — ar de revista)*
```
TEMPLATE: "Editorial". Personalidade: revista de casamento sofisticada.
Capa SEM foto gigante: tipografia enorme como manchete (nome do casal),
data como linha fina de jornal, uma foto pequena em moldura fina. Fundo
claro (off-white), linhas horizontais finas separando seções, números de
seção pequenos (01, 02…), muito espaço em branco. Paleta padrão: dourado
suave. Sensação: elegante, caro, calmo.
```

**NOITE** *(15 anos — balada elegante)*
```
TEMPLATE: "Noite". Personalidade: festa à noite, glamour. É o ÚNICO template
escuro: fundo quase preto, brilhos discretos (pontos de luz, como estrelas),
nome em destaque luminoso na capa, foto da debutante com vinheta escura,
detalhes que lembram neon SUAVE (sem ficar cyberpunk). Cards internos
escuros com bordas luminosas finas. Paleta padrão: azul profundo.
Sensação: noite inesquecível, energia, moderno.
```

**BOHO** *(casamento/bodas — romântico natural)*
```
TEMPLATE: "Boho". Personalidade: casamento ao ar livre, romântico e leve.
Fotos em moldura de ARCO (janela de capela), textura sutil de papel/linho no
fundo, ornamentos botânicos finos desenhados (raminhos, não florzona),
cantos arredondados orgânicos. Paleta padrão: terracota. Sensação:
acolhedor, artesanal, delicado.
```

**MINIMAL** *(qualquer ocasião — só tipografia)*
```
TEMPLATE: "Minimal". Personalidade: quase só tipografia, luxo silencioso.
Capa: nome em caixa alta espaçada, data pequena, NENHUM enfeite. Preto sobre
branco com UM acento de cor. Foto aparece só nas páginas internas, pequena e
retangular. Grade rígida, alinhamento perfeito. Paleta padrão: lavanda.
Sensação: mínimo, chique, atemporal.
```

**JARDIM** *(aniversários/60 anos — fresco e alegre)*
```
TEMPLATE: "Jardim". Personalidade: festa de dia, ao ar livre. Claro e
ensolarado, ilustrações botânicas leves em SVG nas bordas (folhas, não
infantil), seções como "cartões" sobre fundo verde-claro, foto de capa em
moldura oval suave. Paleta padrão: verde sálvia. Sensação: fresco, afetuoso,
leve.
```

## 6. Por onde começar (minha recomendação)

1. **Editorial** primeiro — casamento é o maior mercado (é onde o iCasei
   ganha dinheiro) e é o template mais "vendável" no seu catálogo.
2. **Noite** em seguida — é o mais diferente do Clássico e vira o queridinho
   dos 15 anos.
3. Boho → Jardim → Minimal, um por vez, sempre: mockup → você aprova → eu porto.

**Regra de ouro: um template de cada vez.** Com o primeiro portado, a
arquitetura fica plugável e os próximos saem rápido.

## 7. O que EU faço quando você me mandar o HTML

- Porto o desenho fiel pro motor (mesmos dados, mesmas seções, todas as
  paletas e letras funcionando nele).
- Ele entra na galeria de templates do wizard e do painel ("trocar não apaga
  nada"), e o preview ao vivo passa a mostrar ele de verdade.
- Os "estilos" provisórios do passo 2 do assistente (combinações de cor+letra
  que EU montei) saem de cena conforme os templates reais chegam.
