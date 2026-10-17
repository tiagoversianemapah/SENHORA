# YENA Healthcare Technology

Protótipo acadêmico em português com monitoramento demonstrativo, YENA AI,
cadastro de clientes, orçamentos e login verificado no servidor.
Clientes e orçamentos são armazenados em MySQL. Câmeras e alertas são simulados.

## Instalar em outro computador

Estas instruções usam Windows de 64 bits. Instale o
[Node.js 24 LTS](https://nodejs.org/en/download). O MySQL pode precisar do
[Visual C++ Redistributable x64](https://aka.ms/vc14/vc_redist.x64.exe).
O script baixa e prepara o MySQL local; não é necessário instalar XAMPP ou Workbench.

Baixe este repositório em **Code → Download ZIP**, extraia todos os arquivos
e abra o PowerShell na pasta extraída que contém este README. Execute um comando por vez:

```powershell
cd yena
npm.cmd ci
npm.cmd run mysql:install
npm.cmd run mysql:setup
npm.cmd run mysql:seed
npm.cmd start
```

O primeiro preparo precisa de internet; o download do MySQL tem aproximadamente 268 MB.
Após iniciar, abra **http://127.0.0.1:4173** no navegador.
O usuário e a senha gerados para esta instalação ficam em
`yena/.sites-runtime/ACESSO-LOCAL.txt`. Eles são preservados ao reiniciar.

Nas próximas vezes, basta abrir o terminal na pasta `yena` e executar
`npm.cmd start`. Mantenha o terminal aberto durante o uso; pressione **Ctrl+C**
para encerrar. O comando inicia a aplicação e seu MySQL local.

## Dados e configuração

Cada instalação tem seu próprio banco de dados e suas próprias credenciais.
Os dados existentes em outro computador não são transferidos pelo Git.
Não apague `yena/.sites-runtime/mysql-data`, onde ficam os dados locais.
O projeto inclui um cadastro inicial opcional de três clientes fictícios.

A YENA AI funciona em modo de demonstração sem chave externa. Para configurar
uma chave válida do DeepSeek, execute na pasta `yena`:

```powershell
node scripts/configure-deepseek.mjs
```

Depois reinicie a aplicação. A chave fica no servidor, no arquivo `.env`.
Não publique `.env`, `ACESSO-LOCAL.txt` ou a pasta `.sites-runtime`.

## Verificação

Na pasta `yena`, execute `npm.cmd test`. Para testar com o MySQL local preparado,
execute também `npm.cmd run test:mysql`.

Mais detalhes estão em [yena/README.txt](yena/README.txt).
Publicar o código no GitHub não hospeda a aplicação: o sistema completo
precisa de um servidor Node.js e MySQL para funcionar online.
