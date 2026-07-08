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

## Trabalhar roles e permissões [feito]
- criação de papeis e permissões [feito]

## Trabalhar na tela de Login [parcial]
- permitir que senhas de usuários seja recuperável atraves de um link [feito]
- Tela de bloquio quando passar muito tempo de inactividade [feito]. Deve ser uma tela diverente, não apenas um overlay (pode colocar um relógio, ou algo sobre fatura, etc) [feito]
- Melhorar tela de bloqueio com UI limpa e relógio funcional [feito]

## Recuperação de senha e redefinição [feito]
- permitir que senhas de usuários seja recuperável atraves de um link [feito]

## Trabalhar em Subscrições e Planos para as empresas
- Cada empresa deverá estar subscrita em um determinado plano e consoante a esse plano ter limites de uso;
- Ter telas de bloquio quando os limites forem atingidos

## Trabalhar nas Telas de Auditoria

## Onbording
- No onbording pedir informações mais completas da empresa, como: NUIT, número de telefone, email, morada, moeda oficial, etc
- Deve enviar um email de boas-vindas ao usuário 
- Deve enviar um email de confirmação de cadastro

## Fatura/Cotação [feito]
- Melhorar o documento pdf de fatura e cotação: deixar um pouco mais customizado. [feito]
- Cotação não precisa de colocar desconto [feito]
- Ao criar uma fatura ou cotação, não deve permitir editar o preço, preço é editado noutra secção [feito]


## Ver A Implementação de dark mode

## Relatórios

