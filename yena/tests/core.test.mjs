import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateQuote,parseQuote,quoteText,validateClient,escapeHtml,seedClients} from '../dist/core.mjs';
const base={plan:'profissional',cameras:4,badges:20,installation:true,maintenance:true};
test('separa equipamentos e instalação da recorrência mensal',()=>{
 const q=calculateQuote(base);assert.equal(q.cameraCost,12000);assert.equal(q.badgeCost,1600);assert.equal(q.initial,18600);assert.equal(q.monthly,3000);
});
test('todos os planos sem opcionais ou equipamentos',()=>{
 for(const [plan,cost] of [['basico',1500],['profissional',2500],['premium',4000]]){const q=calculateQuote({...base,plan,cameras:0,badges:0,installation:false,maintenance:false});assert.equal(q.initial,0);assert.equal(q.monthly,cost);}
});
test('rejeita quantidades negativas, fracionárias, ausentes e excessivas',()=>{
 for(const cameras of [-1,1.5,NaN,Infinity,10001,'2'])assert.throws(()=>calculateQuote({...base,cameras}));
 assert.throws(()=>calculateQuote({...base,plan:'toString'}));assert.throws(()=>calculateQuote({...base,maintenance:'false'}));
});
test('assistente interpreta planos, unidades e serviços em português',()=>{
 const q=parseQuote('Orçamento Profissional, 4 câmeras, 20 crachás, com instalação e manutenção.').quote;
 assert.equal(q.initial,18600);assert.equal(q.monthly,3000);
 const q2=parseQuote('Básico 1 câmera 1 crachá sem instalação e com manutenção').quote;
 assert.equal(q2.initial,3080);assert.equal(q2.monthly,2000);
 const q3=parseQuote('Premium 0 câmeras 0 crachás sem instalação e manutenção').quote;
 assert.equal(q3.initial,0);assert.equal(q3.monthly,4000);
});
test('assistente pede plano e recusa quantidades ambíguas',()=>{
 for(const t of ['2 câmeras e 3 crachás','Básico -2 câmeras','Básico 2,5 câmeras','Premium 2 mil câmeras','Profissional 10001 crachás','Básico quatro câmeras'])assert.ok(parseQuote(t).error,t);
});
test('resumo contém totais e identifica referência acadêmica',()=>{
 const text=quoteText(calculateQuote(base));assert.match(text,/18\.600,00/);assert.match(text,/3\.000,00/);assert.match(text,/21\.600,00/);assert.match(text,/ESTIMATIVA ACADÊMICA/);
});
test('clientes exigem campos limitados e removem espaços',()=>{
 const c=seedClients()[0];assert.equal(validateClient({...c,name:' Ana Exemplo '}).name,'Ana Exemplo');
 for(const field of ['name','institution','contact','need'])assert.throws(()=>validateClient({...c,[field]:'  '}));
 assert.throws(()=>validateClient({...c,need:'a'.repeat(1001)}));assert.throws(()=>validateClient({...c,stage:'inválida'}));
});
test('texto livre é escapado para impedir injeção de HTML',()=>{
 assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
