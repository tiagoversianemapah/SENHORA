import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {ensureLocalMySQL} from './mysql-local.mjs';
if(fs.existsSync('.env'))process.loadEnvFile('.env');
const database=await ensureLocalMySQL();
const app=spawn(process.execPath,['server/index.mjs'],{windowsHide:true,stdio:'inherit',env:process.env});
let stopping=false;
async function stop(){if(stopping)return;stopping=true;app.kill();await database.stop();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
app.on('error',async()=>{console.error('Não foi possível iniciar a YENA.');await stop();process.exitCode=1;});
app.on('exit',async code=>{await database.stop();process.exitCode=code||0;});
