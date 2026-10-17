import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuth} from '../server/auth.mjs';
const credentials={username:'demo-test',password:'FixedTest2026!'};
const request={headers:{},socket:{remoteAddress:'127.0.0.1'}};
test('credenciais fixas continuam válidas ao entrar novamente e reiniciar o servidor',()=>{
 const first=createAuth(credentials);const login=first.login(request,credentials);assert.ok(login.token);
 const cookieRequest={...request,headers:{cookie:'yena_session='+login.token}};
 assert.equal(first.user(cookieRequest).username,credentials.username);first.logout(cookieRequest);assert.equal(first.user(cookieRequest),null);
 assert.ok(first.login(request,credentials).token);
 const restarted=createAuth(credentials);assert.equal(restarted.user(cookieRequest),null);assert.ok(restarted.login(request,credentials).token);
});
test('rejeita usuário e senha incorretos e contas sem configuração',()=>{
 const auth=createAuth(credentials);
 assert.equal(auth.login(request,{...credentials,username:'outro'}).status,401);
 assert.equal(auth.login(request,{...credentials,password:'senhaerrada'}).status,401);
 assert.equal(createAuth({password:''}).login(request,credentials).status,503);
});
test('sessão expira e as mesmas credenciais permitem novo acesso',()=>{
 let time=1000;const auth=createAuth({...credentials,now:()=>time});const token=auth.login(request,credentials).token;
 const cookieRequest={...request,headers:{cookie:'yena_session='+token}};time+=8*60*60*1000;
 assert.equal(auth.user(cookieRequest),null);assert.ok(auth.login(request,credentials).token);
});
test('limita tentativas erradas e libera nova tentativa após um minuto',()=>{
 let time=1000;const auth=createAuth({...credentials,now:()=>time});
 for(let i=0;i<5;i++)assert.equal(auth.login(request,{...credentials,password:'errada'}).status,401);
 assert.equal(auth.login(request,credentials).status,429);time+=60001;assert.ok(auth.login(request,credentials).token);
});
