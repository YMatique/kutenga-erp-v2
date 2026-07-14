# POS - POINT OF SALES

## A tela de POS deve ter um layout próprio
- O layout do POS deve ser diferente, bonito, atraente e fácil de usar

## Deve gerar VD impressa a impressoras térmicas
- A VD é uma espécie de fatura-recibo mas pequena e para impressoras térmicas.

## Gestão de turnos
- Cada venda em um POS é feita durante um turno
- Deve haver um botão para iniciar um novo turno
- Deve haver um botão para fechar o turno
- Deve haver um botão para imprimir o resumo de vendas do turno
- Deve haver um botão para imprimir todas as vendas do turno
- Deve haver um botão para imprimir todas as vendas do dia
- Cada turno pertence a um usuário em particular

## Deve ter forma de pagamento em dinheiro, cartão e transferência
- Deve haver um botão para especificar o método de pagamento

## Deve ter uma tela de resumo de vendas por turno
- Nessa tela deve ter detalhes de um determinado turno: produtos vendidos, caixa, etc

## Cada turno deve ter um histórico de todas as vendas

## Estética
- O POS não precisa ser unicamente dark, pode ser configurável
- Deve aparecer o logo de kutenga ERP.
- Certificar de usar as cores da aplicação
- ver a possibilidade de leitor de código de barra e configuração de teclado
- rever a página de pos/shifts/open: não está a seguir o padrão, não deveria extender o KutengaERP, pois já é carregado por padrão: veja outras páginas como implementaram
 - rever a página pos/reports e pos/shifts : não seguem o padrão da aplicação: as bordas, as tabelas, os cards