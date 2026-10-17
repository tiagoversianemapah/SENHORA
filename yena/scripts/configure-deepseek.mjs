import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export async function verifyPrivateEnvironment(project){
 project=path.resolve(project);
 let repository=null,current=project;
 while(true){
  try{await fs.lstat(path.join(current,'.git'));repository=current;break;}catch(error){if(error.code!=='ENOENT')throw new Error('Não foi possível verificar a pasta Git deste projeto.');}
  const parent=path.dirname(current);if(parent===current)break;current=parent;
 }
 const ensureIgnore=async()=>{
  const filename=path.join(project,'.gitignore');let content='';
  try{content=await fs.readFile(filename,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
  await fs.writeFile(filename,content+(content&&!content.endsWith('\n')?'\n':'')+'.env\n.env.*\n!.env.example\n','utf8');
 };
 // A distribuição ZIP funciona sem instalar Git ou criar um repositório.
 if(!repository){
  let content='';try{content=await fs.readFile(path.join(project,'.gitignore'),'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
  if(!content.split(/\r?\n/).includes('.env'))await ensureIgnore();
  return {gitChecked:false};
 }
 // Confia somente neste checkout nesta chamada, sem alterar a configuração global.
 const git=args=>spawnSync('git',['-c',`safe.directory=${repository}`,'-C',project,...args],{encoding:'utf8',windowsHide:true,stdio:['ignore','pipe','pipe']});
 const tracked=git(['ls-files','--','.env']);
 if(tracked.error?.code==='ENOENT')throw new Error('Git não encontrado. Instale ou habilite o Git no terminal para verificar este repositório.');
 if(tracked.error||tracked.status!==0)throw new Error('Não foi possível executar a verificação do Git. Nenhuma credencial foi alterada. '+(tracked.stderr||'').trim().slice(0,800));
 if(tracked.stdout.trim())throw new Error('O arquivo .env está versionado. Remova somente do índice com git rm --cached -- .env e execute novamente; o arquivo local será mantido.');
 let ignored=git(['check-ignore','--quiet','.env']);
 if(ignored.status===1){await ensureIgnore();ignored=git(['check-ignore','--quiet','.env']);}
 if(ignored.error||ignored.status!==0)throw new Error('Não foi possível confirmar a proteção do .env no .gitignore. Nenhuma credencial foi alterada.');
 return {gitChecked:true};
}

async function configure(){
 const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const target=path.join(project,'.env');
 await verifyPrivateEnvironment(project);
 if(!process.stdin.isTTY)throw new Error('Execute este comando em um terminal interativo para inserir a chave sem exibi-la.');
 process.stdin.setRawMode(true);
 process.stdout.write('Cole a chave do DeepSeek e pressione Enter (entrada oculta).\n');
 let input='';
 const key=await new Promise((resolve,reject)=>{
  process.stdin.setEncoding('utf8');process.stdin.resume();
  function finish(){process.stdin.off('data',read);process.stdin.setRawMode(false);process.stdin.pause();}
  function read(chunk){
   for(const char of chunk){
    if(char==='\u0003'){input='';finish();reject(new Error('Configuração cancelada.'));return;}
    if(char==='\r'||char==='\n'){const value=input.trim();input='';finish();resolve(value);return;}
    if(char==='\u007f'||char==='\b')input=input.slice(0,-1);else input+=char;
   }
  }
  process.stdin.on('data',read);
 });
 if(!/^sk-[a-zA-Z0-9_-]{16,240}$/.test(key))throw new Error('Formato de chave inválido.');
 let env='';try{env=await fs.readFile(target,'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
 const newline=env.includes('\r\n')?'\r\n':'\n';
 const entry='DEEPSEEK_API_KEY='+key;
 env=/^DEEPSEEK_API_KEY=.*$/m.test(env)?env.replace(/^DEEPSEEK_API_KEY=.*$/m,()=>entry):env+(env&&!env.endsWith('\n')?newline:'')+entry+newline;
 if(!/^DEEPSEEK_MODEL=.+$/m.test(env))env=/^DEEPSEEK_MODEL=.*$/m.test(env)?env.replace(/^DEEPSEEK_MODEL=.*$/m,'DEEPSEEK_MODEL=deepseek-flash'):env+newline+'DEEPSEEK_MODEL=deepseek-flash'+newline;
 const temporary=target+'.deepseek-tmp';
 try{await fs.writeFile(temporary,env,{mode:0o600});await fs.rename(temporary,target);}finally{await fs.unlink(temporary).catch(()=>{});}
 console.log('Credencial configurada no .env do servidor. As configurações de MySQL foram preservadas.');
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{await configure();}catch(error){console.error(error.message);process.exitCode=1;}
}
