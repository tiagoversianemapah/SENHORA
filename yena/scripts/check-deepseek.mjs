import fs from 'node:fs';
import {completeWithDeepSeek} from '../server/deepseek.mjs';
if(fs.existsSync('.env'))process.loadEnvFile('.env');
try{
 const result=await completeWithDeepSeek({apiKey:process.env.DEEPSEEK_API_KEY,model:process.env.DEEPSEEK_MODEL||'deepseek-flash',messages:[{role:'user',content:'Confirme a integração em uma frase curta sobre a YENA.'}]});
 console.log(JSON.stringify({ok:true,provider:result.provider,model:result.model,responseReceived:true,responseLength:result.text.length}));
}catch(error){console.log(JSON.stringify({ok:false,code:error.code||'connection_failed',message:error.code?error.message:'Não foi possível verificar a API.'}));process.exitCode=1;}
