import fs from 'node:fs/promises';
import {createReadStream,createWriteStream} from 'node:fs';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import path from 'node:path';
if(process.platform!=='win32')throw new Error('Este instalador portátil é para Windows.');
const runtime=path.resolve('.sites-runtime'),version='8.4.11';
const archive=path.join(runtime,'mysql-8.4.11-winx64.zip');
const binary=path.join(runtime,`mysql-${version}-winx64`,'bin','mysqld.exe');
await fs.mkdir(runtime,{recursive:true});
try{await fs.access(binary);console.log('MySQL portátil já disponível.');process.exit(0);}catch{}
try{await fs.access(archive);}catch{
 console.log('Baixando MySQL Community 8.4.11 do servidor oficial (268 MB)…');
 const response=await fetch('https://cdn.mysql.com/Downloads/MySQL-8.4/mysql-8.4.11-winx64.zip');if(!response.ok)throw new Error('Não foi possível baixar o MySQL.');
 await pipeline(Readable.fromWeb(response.body),createWriteStream(archive));
}
const hash=createHash('md5');for await(const chunk of createReadStream(archive))hash.update(chunk);
if(hash.digest('hex')!=='2e833921898a9a030ea6bfe81bd811bc')throw new Error('O arquivo não corresponde ao checksum publicado pelo MySQL.');
console.log('Download verificado. Extraindo MySQL portátil…');
const psQuote=value=>"'"+value.replaceAll("'","''")+"'";
await new Promise((resolve,reject)=>{const child=spawn('powershell.exe',['-NoProfile','-Command',`Expand-Archive -LiteralPath ${psQuote(archive)} -DestinationPath ${psQuote(runtime)} -Force`],{windowsHide:true,stdio:['ignore','pipe','pipe']});let error='';child.stderr.on('data',c=>error+=c);child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error('Falha ao extrair MySQL: '+error.slice(0,300))));});
console.log('MySQL portátil instalado dentro de .sites-runtime. Nenhum serviço do Windows foi instalado.');
