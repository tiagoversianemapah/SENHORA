import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {ensureLocalMySQL} from '../scripts/mysql-local.mjs';
import {createMySQLRepository} from '../server/database.mjs';
import {createYenaServer} from '../server/index.mjs';
if(fs.existsSync('.env'))process.loadEnvFile('.env');
const instance=await ensureLocalMySQL();let repository,server,clientId,quoteId;
async function start(){repository=createMySQLRepository();server=createYenaServer({repository,apiKey:'',adminPassword:process.env.YENA_ADMIN_PASSWORD});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return `http://127.0.0.1:${server.address().port}`;}
async function stop(){if(server){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));server=null;}if(repository){await repository.close();repository=null;}}
async function login(origin){const response=await fetch(origin+'/api/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({username:process.env.YENA_ADMIN_USER,password:process.env.YENA_ADMIN_PASSWORD})});assert.equal(response.status,200);const cookie=response.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);return cookie.split(';')[0];}
const call=(origin,cookie,route,method='GET',body)=>fetch(origin+route,{method,headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
try{
 let origin=await start();assert.equal((await fetch(origin+'/api/clients')).status,401);console.log('OK MySQL protegido por autenticação');
 const cookie=await login(origin);console.log('OK login real com cookie HttpOnly');
 const id=randomUUID(),input={name:'Validação '+id,institution:'Instituição fictícia',contact:'teste@exemplo.invalid',need:"Texto com aspas ' e tentativa SQL: '; DELETE FROM clients; --",stage:'Novo contato'};
 let response=await call(origin,cookie,'/api/clients','POST',input);assert.equal(response.status,201);clientId=(await response.json()).client.id;console.log('OK cliente criado no MySQL com consulta parametrizada');
 const q={plan:'profissional',cameras:4,badges:20,installation:true,maintenance:true,clientId,initial:1};response=await call(origin,cookie,'/api/quotes','POST',q);assert.equal(response.status,201);const quote=(await response.json()).quote;quoteId=quote.id;assert.equal(quote.snapshot.initial,18600);assert.equal(quote.snapshot.monthly,3000);console.log('OK orçamento recalculado no servidor e salvo no MySQL');
 const [user]=await repository.pool.execute('SELECT CURRENT_USER() AS account');assert.match(user[0].account,/yena_app/);const [grants]=await repository.pool.execute('SHOW GRANTS');assert.ok(!JSON.stringify(grants).includes('ALL PRIVILEGES'));console.log('OK usuário do MySQL com permissões restritas');
 await stop();origin=await start();const newCookie=await login(origin);
 const clients=(await(await call(origin,newCookie,'/api/clients')).json()).clients;assert.equal(clients.find(c=>c.id===clientId).need,input.need);
 const quotes=(await(await call(origin,newCookie,'/api/quotes')).json()).quotes;assert.equal(quotes.find(q=>q.id===quoteId).snapshot.initial,18600);console.log('OK clientes e orçamentos continuam no banco após reiniciar o servidor');
 response=await call(origin,newCookie,'/api/clients/'+clientId,'PUT',{...input,name:'Cliente atualizado',stage:'Em análise'});assert.equal(response.status,200);assert.equal((await response.json()).client.name,'Cliente atualizado');console.log('OK edição persistida');
 assert.equal((await call(origin,newCookie,'/api/quotes/'+quoteId,'DELETE')).status,200);quoteId=null;assert.equal((await call(origin,newCookie,'/api/clients/'+clientId,'DELETE')).status,200);clientId=null;console.log('OK exclusão dos registros de teste');
 assert.equal((await call(origin,newCookie,'/api/session','DELETE')).status,200);assert.equal((await call(origin,newCookie,'/api/clients')).status,401);console.log('OK logout invalida a sessão');
 console.log('SUCESSO: persistência testada em MySQL Community 8.4.11 real.');
}finally{if(repository){if(quoteId)await repository.deleteQuote(quoteId).catch(()=>{});if(clientId)await repository.deleteClient(clientId).catch(()=>{});}await stop();await instance.stop();}
