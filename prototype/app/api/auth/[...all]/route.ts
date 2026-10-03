import {siteAuth} from '../../../../lib/auth';
import {json,validWrite,noStore} from '../../../../lib/security';

async function handle(request:Request){
 const path=new URL(request.url).pathname.replace(/^\/api\/auth/,'');
 if(!['/sign-up/email','/sign-in/email','/sign-out','/get-session'].includes(path))return json({error:'Not found.'},404);
 if(request.method==='GET'&&path!=='/get-session')return json({error:'Method not allowed.'},405);
 if(request.method==='POST'){
  if(!validWrite(request)||request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Invalid request origin.'},403);
  try{
   const text=await request.clone().text();
   if(text.length>4096)return json({error:'Request is too large.'},413);
   const body=JSON.parse(text);
   if(path!=='/sign-out'&&(typeof body.email!=='string'||body.email.length>254||typeof body.password!=='string'||body.password.length>128))return json({error:'Enter a valid email and password.'},400);
   if(path==='/sign-up/email'&&(typeof body.name!=='string'||!body.name.trim()||body.name.trim().length>80))return json({error:'Enter your name (up to 80 characters).'},400);
  }catch{return json({error:'Invalid request.'},400);}
 }
 try{
  const result=await siteAuth().handler(request);
  const h=new Headers(result.headers);h.set('Cache-Control',noStore['Cache-Control']);
  return new Response(result.body,{status:result.status,headers:h});
 }catch{console.error('Authentication service is temporarily unavailable.');return json({error:'Sign-in is temporarily unavailable. Please try again.'},503);}
}
export const GET=handle;
export const POST=handle;
