# Manual de Utilizador e Apresentação do Sistema - Kutenga ERP v2

## 1. Introdução ao Sistema
O **Kutenga ERP v2** é uma plataforma avançada e integrada, concebida para transformar a gestão empresarial e de retalho. Desenvolvido com base nas tecnologias mais recentes do mercado, oferece uma interface moderna, responsiva e altamente intuitiva.
Mais do que um simples software de faturação, o Kutenga atua como o sistema nervoso central do seu negócio, permitindo o controlo total sobre as vendas, o inventário, os recursos humanos e a gestão de multilocais (filiais), tudo a partir de um único ambiente de trabalho.

**Principais Benefícios:**
- **Centralização:** Toda a informação num só lugar, acessível a qualquer momento.
- **Eficiência:** Redução de tarefas manuais e redundantes, focando a equipa no que realmente importa: vender e servir o cliente.
- **Tomada de Decisão:** Dados em tempo real para decisões estratégicas mais rápidas e acertadas.

*[Sugestão de Imagem: Colocar aqui uma visão geral/mockup do sistema ou logotipo da empresa/software]*

---

## 2. Acesso ao Sistema e Segurança
A segurança da informação é um pilar do Kutenga ERP. O acesso aos dados críticos da sua empresa está rigorosamente protegido.

- **Autenticação Segura**: Acesso através de credenciais únicas e palavra-passe encriptada, garantindo que apenas pessoal autorizado acede à plataforma.
- **Onboarding Guiado (Primeiros Passos)**: Ao aceder pela primeira vez, um assistente virtual guia o gestor na configuração dos dados base da empresa, preferências de idioma, moeda e criação da primeira filial, facilitando a adoção do sistema.
- **Bloqueio por Inatividade (Inactivity Lock)**: Ideal para terminais partilhados. Se o utilizador se ausentar do computador, o sistema deteta a inatividade e bloqueia o ecrã automaticamente. Para voltar ao trabalho, exige-se uma reautenticação rápida (PIN ou Password), protegendo os dados de olhares curiosos sem fechar o software completamente.

*[Sugestão de Imagem: Captura de ecrã da página de Login ou da tela de Bloqueio de Inatividade]*

---

## 3. Dashboard Principal (Visão Geral)
O painel central de comando. Assim que entra no sistema, o gestor é recebido com os dados mais importantes para o dia a dia.

- **Indicadores de Performance (KPIs)**: Gráficos intuitivos e métricas em tempo real sobre vendas do dia, evolução de receitas da semana/mês e estado geral do inventário.
- **Notificações e Alertas Inteligentes**: Um centro de avisos que o notifica automaticamente sobre ruturas de stock (stock baixo), fechos de turno pendentes ou faturas de clientes por liquidar.
- **Navegação Ergonómica**: Um menu lateral colapsável que maximiza o espaço de trabalho, garantindo acesso direto e organizado a todos os módulos sem confusão visual.

*[Sugestão de Imagem: Captura de ecrã do Dashboard Principal mostrando os gráficos e menu lateral]*

---

## 4. Módulo de Inventário e Produtos
A gestão eficiente do inventário é o coração de qualquer negócio de retalho. Este módulo garante que nunca vende um produto que não tem e nunca acumula stock desnecessário.

- **Estruturação de Catálogo (Categorias e Marcas)**: Organização hierárquica e limpa dos artigos. Facilita a filtragem, a pesquisa no POS e a extração de relatórios analíticos precisos (ex: "Qual foi a marca que mais faturou este mês?").
- **Unidades de Medida Múltiplas**: O sistema adapta-se ao que vende, quer sejam produtos à unidade (caixas, garrafas) ou a peso/volume (Kg, Litros, Metros).
- **Ficha de Produto Completa**:
  - Inserção de imagens ilustrativas.
  - Associação de um ou múltiplos Códigos de Barras (EAN, UPC) por produto.
  - Alertas parametrizáveis de stock mínimo para reposição atempada.
- **Gestão de Movimentos e Transferências de Stock**:
  - Registo minucioso de entradas (compras a fornecedores) e saídas (quebras, consumo interno).
  - **Transferências entre Filiais**: Permite enviar stock do Armazém Central para uma Loja com guias de transporte internas, garantindo a rastreabilidade total das mercadorias.

*[Sugestão de Imagem: Captura de ecrã da lista de Produtos ou de criação de Transferência de Stock]*

---

## 5. Módulo de Preçário dos Produtos
O controlo inteligente das políticas financeiras e comerciais dos seus artigos.

- **Gestão de Custos e PVP**: Definição clara do preço de custo (quanto custou adquirir/produzir) e do preço final de venda ao público (PVP).
- **Controlo de Margens de Lucro**: O sistema calcula automaticamente a margem de lucro em percentagem e em valor absoluto com base no custo, ajudando o gestor a garantir a viabilidade do negócio em cada venda.

*[Sugestão de Imagem: Captura de ecrã da zona de configuração de preços na ficha do produto]*

---

## 6. Ponto de Venda (POS - Frente de Loja)
Uma interface desenhada especificamente para os operadores de caixa, onde a velocidade e a facilidade de uso são críticas.

- **Layout Dedicado e Otimizado**: Interface sem distrações, focada apenas na venda. Possui temas configuráveis (*Light* e *Dark Mode*).
- **Rapidez Máxima**: Preparado nativamente para leitura rápida com scanner de código de barras e otimizado com atalhos de teclado.
- **Controlo Rigoroso de Caixas e Turnos**:
  - Obrigatoriedade de abertura de turno (informando o fundo de maneio).
  - Operações associadas unicamente ao operador ativo, prevenindo fraudes.
  - **Fecho de Turno Cego/Informado**: Emissão de relatório de fecho detalhando o valor esperado no final do dia (vendas efetuadas vs dinheiro na gaveta).
- **Múltiplos Métodos de Pagamento**: Permite dividir a conta (ex: Dinheiro + Multibanco).
- **Emissão Instantânea de VD (Talão Térmico)**: Geração ultrarrápida da Venda a Dinheiro, perfeitamente formatada impressoras térmicas (papel de rolo).

*[Sugestão de Imagem: Captura de ecrã da tela do POS]*

---

## 7. Vendas e Faturação (Backoffice)
Módulo administrativo de faturação ideal para vendas a crédito ou a outras empresas (B2B).

- **Gestão de Documentos Comerciais**: Criação de Faturas, Faturas-Recibo, Orçamentos, Guias e Notas de Crédito.
- **Gestão de Clientes e Contas Correntes**: Registo detalhado da ficha do cliente e acompanhamento de valores em dívida.
- **Envio Automático e Alertas (Avisos de Vencimento)**: Possibilidade de enviar documentos diretamente por email e alertas automáticos para faturas vencidas.

*[Sugestão de Imagem: Captura de ecrã da grelha de documentos (Document List) ou de uma fatura emitida]*

---

## 8. Gestão de Filiais e Utilizadores
O Kutenga ERP foi construído com suporte nativo para múltiplos locais. Uma única licença permite gerir um império.

- **Arquitetura Multi-Filial (Branches)**: Crie várias filiais (lojas/armazéns), mantendo os dados separados e organizados por local, com a gestão centralizada.
- **Perfis, Utilizadores e Permissões**: Acesso baseado em perfis (Administrador, Gerente, Operador de Caixa), garantindo que cada colaborador apenas acede ao que lhe compete.

*[Sugestão de Imagem: Captura de ecrã da lista de Filiais (Branches)]*

---

## 9. Relatórios e Inteligência de Negócio (BI)
Os dados da sua empresa transformados em conhecimento acionável.

- **Análises e Estatísticas**: Avalie o volume de vendas, os produtos com maior margem e os picos horários.
- **Fluxos de Caixa (Turnos)**: Auditoria completa de todas as aberturas e fechos de caixa ao longo do tempo.
- **Exportação de Dados**: Grelhas interativas com possibilidade de exportação externa.

---

## 10. Configurações Globais
Onde a plataforma se adapta a si.

- **Identidade Corporativa**: Inserção do logótipo da marca, NIF, nome e morada (refletidos nos documentos).
- **Auditoria de Sistema (Activity Log)**: Registo de atividades para o administrador auditar ações dentro do software (transparência total).

---

## 11. Planos de Adesão (Preçário do Software)
O Kutenga ERP cresce à medida que o seu negócio cresce. Dispomos de planos desenhados para se ajustarem à fase atual da sua empresa.

### Plano Starter (Micro e Pequenas Empresas)
Ideal para empresas em fase inicial que necessitam de controlo e organização com um investimento baixo.
- **1 Filial**
- **Até 2 Utilizadores**
- Módulo de Inventário Base
- Módulo de Faturação Simplificado
- 1 Ponto de Venda (POS)
- Suporte Técnico (Email)

### Plano Pro (Médias Empresas)
O nosso plano mais popular. Para empresas estabelecidas que procuram otimização máxima.
- **Até 3 Filiais**
- **Até 10 Utilizadores**
- Gestão de Inventário Avançado (Transferências Multi-loja)
- Múltiplos Pontos de Venda (POS)
- Faturação Completa com Envios Automáticos e Alertas
- Relatórios Avançados (BI) e Dashboard Completo
- Suporte Técnico Prioritário (Email + Chat)

### Plano Corporate (Grandes Operações)
Desenhado para empresas que não têm limites e exigem o máximo de performance.
- **Filiais Ilimitadas**
- **Utilizadores Ilimitados**
- Todos os Módulos Atuais e Acesso a Novos Módulos Base
- Integração Avançada (Via API)
- Servidor Privado Virtual (VPS) Opcional para Máxima Velocidade
- Gestor de Conta Dedicado
- Suporte 24/7 (Telefone e Email)

*(Nota: Os valores de cada plano serão orçamentados consoante a necessidade técnica e o número de postos de venda efetivos da sua empresa.)*

---

## 12. Módulos Futuros (Roadmap de Evolução)
O Kutenga ERP é uma plataforma viva, em constante evolução. Os seguintes módulos encontram-se em fase de planeamento/desenvolvimento e poderão ser ativados em futuras atualizações:

- **Gestão Avançada de Compras e Fornecedores**
- **Recursos Humanos (RH) e Processamento Salarial**
- **Gestão de Tesouraria e Contas Bancárias**
- **Módulo de Fidelização de Clientes (CRM Integrado)**
- **Integração Omnicanal (E-commerce - Shopify, WooCommerce)**

*(A prioridade de desenvolvimento destes módulos poderá ser ajustada mediante necessidades específicas da sua empresa.)*
