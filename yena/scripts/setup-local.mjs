import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {runtime,mysqlHome,mysqlData,localPort,launchMySQL,connectWhenReady,delay} from './mysql-local.mjs';
const environment=path.resolve('.env');
try{await fs.access(environment);console.log('A configuração .env já existe. Ela foi preservada.');process.exit(0);}catch{}
await fs.mkdir(runtime,{recursive:true});
try{await fs.access(path.join(mysqlData,'mysql'));throw new Error('Já existe um banco local sem configuração .env. Preserve os dados e recupere a configuração antes de continuar.');}catch(error){if(error.code!=='ENOENT')throw error;}
console.log('Inicializando MySQL local com credencial temporária protegida…');
let initialization='';
await new Promise((resolve,reject)=>{const child=spawn(path.join(mysqlHome,'bin','mysqld.exe'),['--no-defaults','--initialize',`--basedir=${mysqlHome}`,`--datadir=${mysqlData}`,'--console'],{windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.on('data',c=>initialization+=c);child.stderr.on('data',c=>initialization+=c);child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('Não foi possível inicializar o MySQL portátil.')));});
const temporaryPassword=initialization.match(/temporary password[^\r\n]*?: (.+)/)?.[1]?.trim();
initialization='';if(!temporaryPassword)throw new Error('Não foi possível obter a credencial temporária do MySQL.');
const rootPassword=randomBytes(30).toString('base64url'),appPassword=randomBytes(30).toString('base64url'),loginPassword=randomBytes(15).toString('base64url');
const instance=launchMySQL();let connection;
try{
 connection=await connectWhenReady({user:'root',password:temporaryPassword,flags:['CAN_HANDLE_EXPIRED_PASSWORDS']},instance);
 await connection.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?",[rootPassword]);
 await connection.query('CREATE DATABASE IF NOT EXISTS yena CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
 await connection.query('USE yena');
 for(const statement of (await fs.readFile('database/schema.sql','utf8')).split(';').map(s=>s.trim()).filter(Boolean))await connection.query(statement);
 await connection.query("CREATE USER 'yena_app'@'localhost' IDENTIFIED BY ?",[appPassword]);
 await connection.query("GRANT SELECT,INSERT,UPDATE,DELETE ON yena.* TO 'yena_app'@'localhost'");
 await fs.writeFile(path.join(runtime,'mysql-admin.json'),JSON.stringify({password:rootPassword}),{flag:'wx',mode:0o600});
 await fs.writeFile(environment,`MYSQL_LOCAL=true\nMYSQL_HOST=127.0.0.1\nMYSQL_PORT=${localPort}\nMYSQL_DATABASE=yena\nMYSQL_USER=yena_app\nMYSQL_PASSWORD=${appPassword}\nYENA_ADMIN_USER=admin\nYENA_ADMIN_PASSWORD=${loginPassword}\nDEEPSEEK_API_KEY=\nDEEPSEEK_MODEL=deepseek-flash\nPORT=4173\n`,{flag:'wx',mode:0o600});
 await fs.writeFile(path.join(runtime,'ACESSO-LOCAL.txt'),`ACESSO LOCAL DA YENA\nAbra http://127.0.0.1:4173 e clique em Entrar.\nUsuário: admin\nSenha: ${loginPassword}\n\nArquivo privado: não compartilhe nem publique.\nPara alterar a senha administrativa, edite YENA_ADMIN_PASSWORD no .env e reinicie a aplicação.\n`,{flag:'wx',mode:0o600});
 console.log('Banco yena criado. Usuário da aplicação restrito a leitura e alteração dos dados.');
 console.log('Acesso administrativo gerado em .sites-runtime/ACESSO-LOCAL.txt. Nenhuma senha foi exibida.');
}finally{if(connection){try{await connection.query('SHUTDOWN');}catch{}await connection.end().catch(()=>{});}for(let i=0;i<30&&instance.child.exitCode===null;i++)await delay(100);if(instance.child.exitCode===null)instance.child.kill();}
