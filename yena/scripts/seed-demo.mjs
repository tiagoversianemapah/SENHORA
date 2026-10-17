import fs from 'node:fs';
import {createMySQLRepository} from '../server/database.mjs';
import {seedClients} from '../dist/core.mjs';
import {ensureLocalMySQL} from './mysql-local.mjs';
if(fs.existsSync('.env'))process.loadEnvFile('.env');
const instance=await ensureLocalMySQL(),repository=createMySQLRepository();
if(!repository)throw new Error('Configure o MySQL antes de carregar os exemplos.');
try{if((await repository.listClients()).length)console.log('O banco já tem clientes. Os registros foram preservados.');else{for(const client of seedClients())await repository.createClient(client);console.log('Três clientes fictícios de demonstração salvos no MySQL.');}}finally{await repository.close();await instance.stop();}
