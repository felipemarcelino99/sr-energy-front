stack: React, TypeScript, Tailwind, DaisyUI, Zustand, TipTap, Cypress, Jest, Zod, Axios.

Criar um sistema role based para uma empresa que presta serviço de engenharia elétrica para outras empresas: realizando manutenções e implementações de painéis elétricos, relés de proteção, estudos de caso e testes. Aonde o manager consiga acessar as finanças, lançar entradas e saídas, criar/agendar trabalhos de forma simples e intuitiva, gerenciar contratos, gerenciar equipamentos, adicionar máquinas que realizam e vão realizar trabalhos , e por fim adicionar e gerenciar empregados.

Os empregados conseguem acessar os calendários com as tarefas, recebem notificações quando um novo trabalho é agendado ou algo muda pelo sistema e pelo whatsapp. Conseguem acessar histórico de trabalhos feitos e também um chat (RAG) baseado somente nos manuais fornecidos no cadastro de cada máquina.

Especificação de telas:

Tela inicial para manager e admin:

- Dashboards: Financeiros, status de trabalhos com filtros por funcionários, calendário com agendas dos funcionários, contratos próximos ao vencimento e notificações .

Tela inicial para employee:

- Dashboards: Status de trabalhos dele, calendário com agendas dele e notificações.

1 - Tela de criação de trabalho para manager e admin (CRUD):

- Seleção de funcionário;
- Definição no calendário;
- Cidade/Estado
- Hospedagem / Endereço
- Carro / Endereço + horário para retirada e devolução
- Descrição do trabalho
- Tipo de máquina que vai atuar;
- Tipo do trabalho (Manutenção ou implantação)

2 - Tela de leitura de trabalho para employee:

- Lista as informações acima:
- Mostra o manual da máquina em que vai atuar;
- Se for manutenção, exibir breve histórico do que foi feito anteriormente e por quem. Se for implementação, mostrar boas práticas e pontos de atenção máxima.
- Sugestões de roteiro baseado na localização para fazer depois do trabalho.
- Botão para finalizar redireciona para tela de finalização:
	- Campo para escrever relatório e com formatação de texto;
	- Anexo de evidências do tabalho feito (Imagens, PDF, vídeo e áudio);

1.1 - Tela de leitura de trabalho finalizado para manager e admin:

Nova aba de finalizado com os campos acima e possibilidade de GERAR PDF do relatório e fazer download das evidências.

3 - Cadastro de máquinas para manager e admin (CRUD):

- Nome
- Modelo
- Marca
- Ano
- Adição de manual
- Aba com todos trabalhos já realizados que tinha essa máquina, por quem, quando e onde.

4 - Cadastro de contratos para manager e admin (CRUD):

- Empresa
- CNPJ
- Valor
- PDF do contrato
- Tempo de duração
- Tipo do contrato (Fixo, temporário)

4 - Cadastro de funcionários para manager e admin (CRUD):

- Nome completo
- Contrato (CLT ou PJ)
- Salário
- Data de contração
- Data de aniversário

Aba com todos trabalhos realizados
Aba com todos reajustes de salários

5 - Chat para funcionários tirar dúvidas sobre as máquinas com IA

6 - Tela de finanças para admin e manager (CRUD):

Tela que lista todas as entradas e saídas, datas e para onde, podendo filtrar por mês, para onde foi, tipo de ação (Débito ou crédito) etc e também gráficos de linha e pizza.