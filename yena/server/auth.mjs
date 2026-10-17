import {scryptSync,randomBytes,createHash,timingSafeEqual} from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest('hex');
export function createAuth({username=process.env.YENA_ADMIN_USER||'admin',password=process.env.YENA_ADMIN_PASSWORD,now=Date.now}={}){
 const configured=typeof password==='string'&&password.length>=12&&password.length<=256;
 const salt=randomBytes(16),passwordHash=scryptSync(configured?password:'disabled-account',salt,64),sessions=new Map(),attempts=new Map();
 const sessionKey=req=>{const match=(req.headers.cookie||'').match(/(?:^|;\s*)yena_session=([a-f0-9]{64})(?:;|$)/);return match?digest(match[1]):null;};
 return {
  configured,
  user(req){const key=sessionKey(req),session=key?sessions.get(key):null;if(!session)return null;if(session.expires<=now()){sessions.delete(key);return null;}return {username:session.username};},
  login(req,input){
   const key=req.socket.remoteAddress||'local',recent=(attempts.get(key)||[]).filter(time=>now()-time<60000);attempts.set(key,recent);
   if(recent.length>=5)return {error:'Aguarde um minuto antes de tentar novamente.',status:429};
   recent.push(now());
   if(!configured)return {error:'Configure o acesso administrativo no servidor.',status:503};
   if(typeof input?.username!=='string'||typeof input?.password!=='string'||input.password.length>256)return {error:'Usuário ou senha inválidos.',status:401};
   const valid=timingSafeEqual(scryptSync(input.password,salt,64),passwordHash)&&timingSafeEqual(Buffer.from(digest(input.username)),Buffer.from(digest(username)));
   if(!valid)return {error:'Usuário ou senha inválidos.',status:401};
   if(sessions.size>=1000){for(const [id,session]of sessions)if(session.expires<=now())sessions.delete(id);if(sessions.size>=1000)return {error:'Limite de sessões atingido. Tente novamente mais tarde.',status:429};}
   const previous=sessionKey(req);if(previous)sessions.delete(previous);
   const token=randomBytes(32).toString('hex');sessions.set(digest(token),{username,expires:now()+8*60*60*1000});attempts.delete(key);return {token,user:{username}};
  },
  logout(req){const key=sessionKey(req);if(key)sessions.delete(key);},
  cookie(token,secure=false){return `yena_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${token?28800:0}${secure?'; Secure':''}`;}
 };
}
