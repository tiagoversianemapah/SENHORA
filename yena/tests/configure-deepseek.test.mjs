import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {verifyPrivateEnvironment} from '../scripts/configure-deepseek.mjs';

async function fixture(fn){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'yena-config-test-'));
 try{await fn(dir);}finally{
  const resolved=path.resolve(dir);
  if(!resolved.startsWith(path.resolve(os.tmpdir())+path.sep)||!path.basename(resolved).startsWith('yena-config-test-'))throw new Error('Diretório temporário inválido.');
  await fs.rm(resolved,{recursive:true,force:true});
 }
}
const git=(dir,args,options={})=>spawnSync('git',['-c',`safe.directory=${dir}`,'-C',dir,...args],{encoding:'utf8',windowsHide:true,...options});
test('configuração local funciona sem repositório e prepara a exclusão do segredo',async()=>fixture(async dir=>{
 await fs.writeFile(path.join(dir,'.env'),'MYSQL_DATABASE=preservado\n');
 assert.equal((await verifyPrivateEnvironment(dir)).gitChecked,false);
 assert.match(await fs.readFile(path.join(dir,'.gitignore'),'utf8'),/^\.env$/m);
 assert.equal(await fs.readFile(path.join(dir,'.env'),'utf8'),'MYSQL_DATABASE=preservado\n');
}));
test('checkout de outro proprietário é verificado sem alterar safe.directory global',async()=>fixture(async dir=>{
 assert.equal(git(dir,['init']).status,0);await fs.writeFile(path.join(dir,'.gitignore'),'.env\n');
 const previous=process.env.GIT_TEST_ASSUME_DIFFERENT_OWNER;process.env.GIT_TEST_ASSUME_DIFFERENT_OWNER='1';
 try{
  const rejected=spawnSync('git',['-c','safe.directory=','-C',dir,'ls-files','--','.env'],{encoding:'utf8'});
  assert.notEqual(rejected.status,0);
  assert.equal((await verifyPrivateEnvironment(dir)).gitChecked,true);
 }finally{if(previous===undefined)delete process.env.GIT_TEST_ASSUME_DIFFERENT_OWNER;else process.env.GIT_TEST_ASSUME_DIFFERENT_OWNER=previous;}
}));
test('arquivo realmente versionado é bloqueado, sem apagar ou alterar o .env',async()=>fixture(async dir=>{
 assert.equal(git(dir,['init']).status,0);await fs.writeFile(path.join(dir,'.env'),'MYSQL_DATABASE=preservado\n');
 assert.equal(git(dir,['add','--','.env']).status,0);
 await assert.rejects(()=>verifyPrivateEnvironment(dir),/está versionado/);
 assert.equal(await fs.readFile(path.join(dir,'.env'),'utf8'),'MYSQL_DATABASE=preservado\n');
}));
test('acrescenta a exclusão que falta em um repositório existente',async()=>fixture(async dir=>{
 assert.equal(git(dir,['init']).status,0);await fs.writeFile(path.join(dir,'.gitignore'),'node_modules/\n');
 await verifyPrivateEnvironment(dir);
 assert.equal(git(dir,['check-ignore','--quiet','.env']).status,0);
 assert.match(await fs.readFile(path.join(dir,'.gitignore'),'utf8'),/^node_modules\/$/m);
}));
