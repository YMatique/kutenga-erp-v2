# Pontos por melhorar no sistema

## Produtos/Serviços [feito]
- verificar a tela de criação e edição de produtos/serviços: se escolher serviço, geralmente, não tem stock, marca e nem unidade [feito]

## Inventário [feito]
- Garantir que apenas produtos rastreáveis apareçam no stock [feito]
- Ao faturar ou vender, garantir que apenas que tem stock sofra abate, pois pode se dar o caso de ser usado por uma empresa de consultoria e tem apenas serviços, isso não tem a ver com o estoque. [feito]

## Notificações [feito]
- Trabalhar nas notificações do sistema [feito]
- alerta de estoque quanto atingir a quantidade mínima para alerta [feito]
- alerta de faturas prestes a expirar, expiradas e pagas [feito]
- entre outras alertas [feito]

## Jobs e Workers [feito]
- Trabalhar em tarefas em segundo plano: como envio de emails [feito]
- Trabalhar em Schedules para verificação de faturas, cotações, entre outros: verificando os que estão a expirar, os expirados [feito]

## Alertas [feito]
- Ao criar, editar, remover deve mostrar notificação toast [feito]

## Modal de delete [feito]
- antes de eliminar algo, deve primeiramente mostrar uma caixa de diálogo para confirmação [feito]
- Não usar alerta padrão do navegador [feito]

## Diferenciar produto e serviço ao gerar factura, cotação, pois um serviço não tem stock [feito]
- Ao gerar factura, cotação ou qualquer outro documento comercial deve diferenciar o produto do serviço; serviço não sofre abate no stock. [feito]

## Colocar os breadcrumb em todas as páginas [feito]
- Verificar as páginas internas sem o breadcrum [feito]


## Criação de Usuários: CRUD [feito]
- criação de usuários da empresa e seus níveis de permissões [feito]

## Configuração de Sistema: Configuração de empresa: [feito]
- Dados, logo, impostos, smtp (personalizado), carimbo, etc [feito]
- Detalhes adicionais (ex: Contas Bancárias, Prefixos de Documentos, Prazos de Vencimento Padrão, Moeda Padrão) [feito]
- Os dados da empresa devem ser únicos por empresa, por exemplo, o email, NUIT, telefone, etc [feito]
- Esses dados podem ser usados por exemplo para envio de emails, etc. [feito]
- Colocar algo de notificação onde especifica se quer também receber notificação por email (stock baixo, subscrição, etc) [feito]

## Trabalhar roles e permissões [feito]
- criação de papeis e permissões [feito]

## Trabalhar na tela de Login [parcial]
- permitir que senhas de usuários seja recuperável atraves de um link [feito]
- Tela de bloquio quando passar muito tempo de inactividade [feito]. Deve ser uma tela diverente, não apenas um overlay (pode colocar um relógio, ou algo sobre fatura, etc) [feito]
- Melhorar tela de bloqueio com UI limpa e relógio funcional [feito]

## Recuperação de senha e redefinição [feito]
- permitir que senhas de usuários seja recuperável atraves de um link [feito]

## Trabalhar em Subscrições e Planos para as empresas [feito]
- Cada empresa deverá estar subscrita em um determinado plano e consoante a esse plano ter limites de uso; [feito]
- Ter telas de bloquio quando os limites forem atingidos [feito]

## Trabalhar nas Telas de Auditoria [feito]
- Mapear bem os registos alterados (os atributos ainda não são apresentados na página: antigo e o novo valor) [feito]

## Onbording [feito]
- No onbording pedir informações mais completas da empresa, como: NUIT, número de telefone, email, morada, moeda oficial, etc [feito]
- Deve enviar um email de boas-vindas ao usuário [feito]
- Deve enviar um email de confirmação de cadastro [feito]
- **[Feito]** Melhorar o UI para usar o logo real da aplicação em vez de ícones genéricos.
- **[Feito]** Transformar o Onboarding num fluxo por etapas (Step-by-step Wizard), incluindo a recolha de configurações opcionais da empresa.

## Fatura/Cotação [feito]
- Melhorar o documento pdf de fatura e cotação: deixar um pouco mais customizado. [feito]
- Cotação não precisa de colocar desconto [feito]
- Ao criar uma fatura ou cotação, não deve permitir editar o preço, preço é editado noutra secção [feito]


## Ver A Implementação de dark mode 
- A lógica de dark mode está completamente operacional a nível de CSS (ficheiro `resources/css/app.css` com variáveis sob `.dark`) e React (usando o custom hook `useAppearance`).
- Para facilitar a experiência do utilizador, adicionámos um botão alternador (Toggle de Sol/Lua) no cabeçalho global (`AppHeader`) ao lado das notificações para poder alternar rapidamente entre modo claro e escuro a partir de qualquer página, além das configurações já existentes nas definições de aparência. [feito]
- Todas as páginas deve aplicar o conceito de dark mode, os componentes, etc [feito]

## Relatórios
- deve conter uma página de relatório [feito]
- baixar relatório [feito]

## Quanto às Imagens [feito]
- Na página de produtos, deve especificar o tamanho recomendável de imagem [feito]
- Para logotipos, carimbos, etc, deve especificar tambem o tamanho da imagem para o usuário fazer upload de imagens que não quebrarão o layout [feito]
 
 ## Criar uma página de documentação do sistema [feito]
- Manual de utilizador
- Documentação na optica de desenvolvedor (readme.md)

 ## Padrão de Telas de Produtos, Faturação [feito]
 - Deve conter cards estatísticos no topo, com informações relevantes para a página em causa, por exemplo, na página de produtos, deve mostrar o número de produtos cadastrados, o número de produtos com estoque baixo, o número de produtos com estoque zerado, etc [feito]
 - Algumas delas deve conter por exemplo filtros [feito]
 - rever a página inventory/adjustment/show [feito]
 - rever a página de pos/shifts/open: não está a seguir o padrão, não deveria extender o KutengaERP, pois já é carregado por padrão: veja outras páginas como implementaram [feito]
 - rever a página pos/reports e pos/shifts : não seguem o padrão da aplicação: as bordas, as tabelas, os cards [feito]

 ## Tabelas [feito]
 - Todas as tabelas devem usar paginação [feito]

 ## Customização de código [feito]
 - Evitar um controller lord: separação de responsabilidade da aplicação [feito]
 - Organizar o código em dominio, em vez de todos controllers, models estarem na raíz, pode se criar diretórios por exemplo: Inventory/models/, Inventory/controllers/, Inventory/requests/, etc.
 
## Melhorar notificações [feito]
- Stock fica quase baixo e até acabar mas o sistema não mostra isso; [feito]
- O sistema de notificações interna do APP deve ser customizada para cobrir todos os possiveis cenários da aplicação [feito]
- O stock não deveria emitir alerta apenas com o comando check-low-stock, deve ser emitido de forma automático em uso e não esperar um comando. [feito]
- as notificações, não podem ser apenas de stock, não. Há muitos cenários que devem haver notificações: criação de usuário, novo produto cadastrado, entrada de stock, fatura expirada, entre outras possibilidades que precisam ser mapeadas. [feito]

## Dashboard [feito]
- customizar o dashboard [feito]

## ROLES E PERMISSÕES [feito]
- aplicar as roles e permissões nas rotas, criar uma página que diz: você não tem permissão ou algo do género. [feito]

## PÁGINA DE NOTIFICAÇÕES PARA LISTAR E VER DETALHES DAS NOTIFICAÇÕES [feito]
- Deverá haver uma página de listar as notificações do sistema [feito]

## APLICAR CONCEITOS DE DARK-MODE NO INDEX DA APLICAÇÃO
- O dark mode precisar ser revisto na página index da aplicação (A landing page) [feito]

## MAPEAMENTO DE STATUS NA VIEW
- adjustment: na tabela, na coluna MOTIVO, não pode aparecer o status da base de dados, mas sim o status já mapeado. o total de itens não aparece, o tipo também; e há um erro no filtro, quando clico em all, ele não carrega porque na base de dados não tem o estado all. [feito]
- adjustment/show: o motivo ainda continua sendo mapeado de forma não apropriada [feito]
- Um problema no stocks/show: há um produto que fiz ajuste de stock, mas na lista aparece: -19, enquanto aumentou a quantidade de estoque. E nas notas, deve estar muito bem claro, não apenas Ajuste #2; tanto quanto no warehouses/show na tabela de movimentações recentes. Não pode ser apenas Ajuste #2, Tranferência #3, etc. [feito]
- Nas transferências: o mesmo problema de filtro com o de adjustment; também não mostra o total de itens [feito]
- A página de movimentos precisa ser customizada: deve haver filtros, cards e a tabela deve ser paginada. [feito]
- Os cards da tela billing/customers/show|edit|create; billing/quotes|invoice|receipts/edit|create'; billing/series não seguem o padrão das bordas; na mesma billing/series a página deve seguir o padrão das demais páginas, tabelas, etc. Incluir Séries no sidebar. [feito]
- Rever o link payments: não está abrir
- Telas de faturação (cotação, faturas, notas, etc) devem ter cards estatísticos, filtros organizados. [feito]
- A tela de categoria, o parente é opcional (A categoria pai não é obrigatória) [feito]
- Em muitas páginas o toast notification aparece muitas vezes (por cima e baixo), deve ser padronizado, aparecer apenas no canto superior direito [feito]


## POLIMENTOS [feito]
- Verificar se as configuração são de facto carregadas ou não. [feito]
- logs gerados pelo sistema não devem ser listados em nenhum user (mesmo o admin da empresa), mas pode haver um super-user para questões de configuração (este não deve pertencer a nenhuma empresa). [feito]
- O lockscreen parece ter bugs, quando refresco, já não pede senha. [feito]
- Verificar questões de emails (Se usa as configurações de SMPT próprio ou não, caso esteja configurado) e notificações (mapear as possiveis categorias). Nem todos usuários têm permissão de ver notificações. [feito]
- Remover auditoria de dentro de configurações. [feito]
- Por ser ainda uma MPV, não estamos a trabalhar com mult-empresa, pouco menos o filiais. [feito]
- Rever vendas: o que vem de POS como mapear e diferenciar doque é gerado da parte de fatura-recibo; [feito]
- Pagamento de Fatura, como ficará? Gerará um recibo ou etc. [feito]
- Na parte de configurações, no dark-mode o sidebar interno que contem Perfil, Segurança, etc, o hover não está muito amigável. [feito]
- O Admin pode ver todos as sessões, mas um user normal, ou o seller, só pode ver o que ele vendeu, seus turnos, etc. [feito]
- Expandir as Permissões e Roles: [feito]
- Ver assunto de fechamento de Inventário (não sei se isso existe, para certificar que no dia anterior ou semana, o inventário culminou com, coisa xyz) [feito]