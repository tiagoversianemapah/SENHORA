import mysql from 'mysql2/promise';
import {randomUUID} from 'node:crypto';
import {calculateQuote,validateClient} from '../dist/core.mjs';
export function createMySQLRepository(env=process.env){
 if(!env.MYSQL_HOST||!env.MYSQL_USER||!env.MYSQL_DATABASE)return null;
 const pool=mysql.createPool({host:env.MYSQL_HOST,port:Number(env.MYSQL_PORT||3306),user:env.MYSQL_USER,password:env.MYSQL_PASSWORD||'',database:env.MYSQL_DATABASE,waitForConnections:true,connectionLimit:5,queueLimit:20,connectTimeout:5000,charset:'utf8mb4',multipleStatements:false,...(env.MYSQL_SSL==='true'?{ssl:{rejectUnauthorized:true}}:{})});
 return new MySQLRepository(pool);
}
export class MySQLRepository {
 constructor(pool){this.pool=pool;}
 async check(){await this.pool.execute('SELECT id FROM clients LIMIT 0');await this.pool.execute('SELECT id FROM quotes LIMIT 0');return true;}
 async listClients(){const [rows]=await this.pool.execute('SELECT id, name, institution, contact, need, stage FROM clients ORDER BY created_at DESC, id');return rows;}
 async createClient(input){const c=validateClient(input),id=randomUUID();await this.pool.execute('INSERT INTO clients (id,name,institution,contact,need,stage) VALUES (?,?,?,?,?,?)',[id,c.name,c.institution,c.contact,c.need,c.stage]);return {id,name:c.name,institution:c.institution,contact:c.contact,need:c.need,stage:c.stage};}
 async updateClient(id,input){const c=validateClient(input);const [result]=await this.pool.execute('UPDATE clients SET name=?,institution=?,contact=?,need=?,stage=? WHERE id=?',[c.name,c.institution,c.contact,c.need,c.stage,id]);if(!result.affectedRows){const [rows]=await this.pool.execute('SELECT id FROM clients WHERE id=?',[id]);if(!rows.length)return null;}return {id,name:c.name,institution:c.institution,contact:c.contact,need:c.need,stage:c.stage};}
 async deleteClient(id){const [result]=await this.pool.execute('DELETE FROM clients WHERE id=?',[id]);return result.affectedRows>0;}
 async listQuotes(){const [rows]=await this.pool.execute('SELECT q.id,q.client_id AS clientId,q.snapshot,q.created_at AS createdAt,c.name AS clientName FROM quotes q LEFT JOIN clients c ON c.id=q.client_id ORDER BY q.created_at DESC,q.id LIMIT 200');return rows.map(row=>({...row,snapshot:typeof row.snapshot==='string'?JSON.parse(row.snapshot):row.snapshot}));}
 async createQuote(input){const snapshot=calculateQuote(input),id=randomUUID(),clientId=input.clientId||null;if(clientId){const [clients]=await this.pool.execute('SELECT id FROM clients WHERE id=?',[clientId]);if(!clients.length)throw new Error('Cliente não encontrado.');}await this.pool.execute('INSERT INTO quotes (id,client_id,snapshot) VALUES (?,?,?)',[id,clientId,JSON.stringify(snapshot)]);return {id,clientId,snapshot};}
 async deleteQuote(id){const [result]=await this.pool.execute('DELETE FROM quotes WHERE id=?',[id]);return result.affectedRows>0;}
 async close(){await this.pool.end();}
}
