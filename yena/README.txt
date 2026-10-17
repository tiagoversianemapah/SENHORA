YENA Healthcare Technology — protótipo acadêmico v1.2

INICIAR NESTE COMPUTADOR

O MySQL Community 8.4.11 já foi preparado dentro de .sites-runtime.
Não foi instalado um serviço do Windows. Os dados ficam em
.sites-runtime/mysql-data e são preservados ao encerrar a aplicação.

Na pasta yena, execute no terminal:
  npm.cmd start
Depois abra http://127.0.0.1:4173.
A tela de login aparece antes do painel. O usuário e a senha fixos desta instalação estão no arquivo local
.sites-runtime/ACESSO-LOCAL.txt. Não compartilhe esse arquivo nem o .env.
Pressione Ctrl+C no terminal para encerrar a aplicação e seu MySQL local.

Usuário e senha são verificados no servidor. Credenciais incorretas não abrem
a plataforma; URLs internas e APIs também exigem uma sessão autenticada.
O acesso permanece igual ao reiniciar: a inicialização preserva o .env.
O botão Sair encerra a sessão. Para entrar novamente, use as mesmas credenciais.
Após alterar as credenciais no .env, reinicie npm.cmd start para aplicá-las.

Cliente e orçamento só são confirmados como salvos após resposta do MySQL.
É possível editar/excluir clientes, vincular um orçamento a um cliente,
consultar o histórico de orçamentos e excluir estimativas antigas.
O botão Restaurar exemplos da interface preserva os registros do MySQL.
Os exemplos fictícios foram inseridos uma vez; não voltam após exclusão.

EM OUTRO COMPUTADOR WINDOWS

1. Instale Node.js 22.9 ou superior.
2. Extraia todo o pacote e abra o terminal na pasta do projeto.
3. Instale as dependências com npm.cmd ci.
4. Rode npm.cmd run mysql:install (download oficial de aproximadamente 268 MB).
5. Rode npm.cmd run mysql:setup para criar o banco e as credenciais locais.
6. Opcional: npm.cmd run mysql:seed para inserir três clientes fictícios.
7. Rode npm.cmd start e use o acesso gerado em .sites-runtime/ACESSO-LOCAL.txt.

Alternativamente, execute Preparar-YENA.ps1 e depois Iniciar-YENA.ps1.
A instalação existente e qualquer configuração .env são preservadas.
O banco é independente do código. Não apague .sites-runtime/mysql-data.
O pacote ZIP de código não contém seu banco nem credenciais.

DEEPSEEK

A credencial é configurada somente no .env do servidor, ignorado pelo Git e
excluído do pacote ZIP. Ela não é incluída no HTML ou no JavaScript público.
Para configurar ou substituir a chave com entrada oculta no terminal:
  node scripts/configure-deepseek.mjs
Para verificar a credencial com uma consulta real ao DeepSeek:
  node scripts/check-deepseek.mjs
Também é possível usar Iniciar-YENA.ps1 com uma credencial apenas na memória.
Reinicie a aplicação após alterar a configuração no .env.

YENA AI distingue respostas locais, respostas do DeepSeek e falhas de consulta.
A configuração presente não comprova validade da chave ou saldo da conta.
Os testes do DeepSeek usam respostas controladas e não geram cobranças.
O navegador nunca recebe a chave. A API é consultada somente pelo servidor.
As últimas 10 mensagens do modo DeepSeek, limitadas a 16.000 caracteres,
seguem para o provedor; cadastros não são enviados automaticamente.
Cálculos e fichas continuam locais. Não envie dados reais de saúde ou chaves
na conversa. A integração não realiza análise clínica nem de imagens.

ARMAZENAMENTO E ACESSO

Clientes e orçamentos: MySQL. Conversa, filtros e revisões de alertas: sessão.
O usuário yena_app tem apenas SELECT, INSERT, UPDATE e DELETE no banco yena.
SQL usa parâmetros. A credencial administrativa do MySQL é separada.
O login da aplicação usa verificação de senha com scrypt, cookie HttpOnly,
SameSite=Strict, expiração de sessão e limite de tentativas.
Não há senha fixa no código, login fictício ou segredo enviado ao navegador.

Para um MySQL externo, copie .env.example e configure MYSQL_HOST, MYSQL_PORT,
MYSQL_DATABASE, MYSQL_USER e MYSQL_PASSWORD, com MYSQL_LOCAL=false.
Crie as tabelas de database/schema.sql com um usuário de instalação e conceda
ao usuário da aplicação só os privilégios necessários nos registros.
MYSQL_SSL=true exige TLS com certificado validado para bancos remotos.
YENA_ADMIN_PASSWORD deve ter de 12 a 256 caracteres.

HOSPEDAGEM

O envio/publicação foi autorizado. Ainda não há hospedagem Node.js nem MySQL
externo configurados. O Sites não oferece TCP direto para este MySQL.
Não foi publicada uma versão que fingisse persistência em MySQL.
Para publicar a aplicação completa, use um servidor Node.js com acesso ao
MySQL, HTTPS e secrets no servidor. Configure HOST e APP_ORIGIN HTTPS.
As rotas de dados exigem autenticação; consultas DeepSeek hospedadas também.
O código não deve ser usado como servidor HTTP público sem HTTPS.

DEMONSTRAÇÃO EM HTML

YENA-demonstracao.html permite visualizar a tela de acesso diretamente no
navegador e oferece um link para a aplicação local. A autenticação é feita
pelo servidor; o arquivo isolado não libera a plataforma nem simula login.
Para entrar e usar o sistema, abra a aplicação com npm.cmd start.

IDENTIDADE VISUAL

Adaptada à referência enviada: roxo #443966, laranja #f59e0b,
azul-escuro #0f172a, cinza-claro #e2e8f0; wordmark serifado e símbolo orbital
vetorial inspirado no material fornecido. Interface em português brasileiro.

VERIFICAÇÕES

  npm.cmd test
  npm.cmd run test:mysql
  node tests/browser.mjs
  $env:YENA_QA_DEEPSEEK='1'; node tests/browser.mjs
  $env:YENA_QA_MYSQL='1'; node tests/browser.mjs
  npm.cmd run export

test:mysql usa o MySQL real e remove apenas os registros que cria para testar.
Os testes verificam persistência após reiniciar o servidor e consultas
autenticadas, além de criação, edição, exclusão e cálculos no servidor.

Referências oficiais de implementação:
https://api-docs.deepseek.com/
https://sidorares.github.io/node-mysql2/docs
https://dev.mysql.com/doc/refman/8.4/en/windows-install-archive.html
