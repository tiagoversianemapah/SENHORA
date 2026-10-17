import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import mysql from 'mysql2/promise';
export const runtime=path.resolve('.sites-runtime');
export const mysqlHome=path.join(runtime,'mysql-8.4.11-winx64');
export const mysqlData=path.join(runtime,'mysql-data');
export const localPort=3307;
export const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function launchMySQL(){
 const child=spawn(path.join(mysqlHome,'bin','mysqld.exe'),['--no-defaults',`--basedir=${mysqlHome}`,`--datadir=${mysqlData}`,`--port=${localPort}`,'--bind-address=127.0.0.1','--mysqlx=0','--console'],{windowsHide:true,stdio:['ignore','pipe','pipe']});
 let output='';child.stdout.on('data',c=>output=(output+c).slice(-10000));child.stderr.on('data',c=>output=(output+c).slice(-10000));child.on('error',()=>{});
 return {child,output:()=>output};
}
export async function connectWhenReady(options,instance){
 for(let i=0;i<120;i++){
  if(instance?.child.exitCode!==null&&instance?.child.exitCode!==undefined)throw new Error('O MySQL não conseguiu iniciar. Consulte o log local da instalação.');
  try{return await mysql.createConnection({host:'127.0.0.1',port:localPort,connectTimeout:500,...options});}catch(error){if(error.code==='ER_ACCESS_DENIED_ERROR')throw new Error('O MySQL está disponível, mas recusou a credencial configurada.');await delay(250);}
 }
 throw new Error('O MySQL não ficou disponível no tempo esperado.');
}
export async function ensureLocalMySQL(){
 if(process.env.MYSQL_LOCAL!=='true')return {stop:async()=>{}};
 const options={user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE};
 try{const existing=await mysql.createConnection({host:'127.0.0.1',port:localPort,connectTimeout:500,...options});await existing.end();return {stop:async()=>{}};}catch{}
 const instance=launchMySQL();
 try{const connection=await connectWhenReady(options,instance);await connection.end();}catch(error){instance.child.kill();throw error;}
 return {stop:async()=>{try{const admin=JSON.parse(await fs.readFile(path.join(runtime,'mysql-admin.json'),'utf8'));const conn=await mysql.createConnection({host:'127.0.0.1',port:localPort,user:'root',password:admin.password,connectTimeout:1000});await conn.query('SHUTDOWN');await conn.end();}catch{}for(let i=0;i<20&&instance.child.exitCode===null;i++)await delay(100);if(instance.child.exitCode===null)instance.child.kill();}};
}
