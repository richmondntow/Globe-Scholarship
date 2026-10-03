import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { drizzle } from 'drizzle-orm/d1';
import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
import { database } from '../db/store';
import { authUsers,authSessions,authAccounts,authVerifications,authRateLimits } from '../db/schema';

const productionHosts=['globescholarship-ai.richmondntow303.chatgpt.site','globescholarship-ai.richmondntow303.site'];
export function siteAuth(){
 const secret=env.BETTER_AUTH_SECRET;
 if(!secret||secret.length<32)throw new Error('Authentication is unavailable.');
 const local=env.BETTER_AUTH_ALLOW_LOCAL==='true';
 const allowedHosts=[...productionHosts,...(local?['terminal.local:4173','127.0.0.1:8788','localhost:5173']:[])];
 return betterAuth({
  appName:'GlobeScholarship AI',secret,
  baseURL:{allowedHosts,protocol:local?'auto':'https',fallback:'https://'+productionHosts[0]},
  trustedOrigins:local?['http://terminal.local:4173','http://127.0.0.1:8788','http://localhost:5173']:[],
  database:drizzleAdapter(drizzle(database()),{provider:'sqlite',schema:{user:authUsers,session:authSessions,account:authAccounts,verification:authVerifications,rateLimit:authRateLimits}}),
  emailAndPassword:{enabled:true,minPasswordLength:12,maxPasswordLength:128,autoSignIn:true},
  session:{expiresIn:60*60*24*7,updateAge:60*60*24,cookieCache:{enabled:false}},
  advanced:{cookiePrefix:'globescholarship',useSecureCookies:!local,defaultCookieAttributes:{httpOnly:true,sameSite:'lax',path:'/'},ipAddress:{ipAddressHeaders:['cf-connecting-ip']}},
  rateLimit:{enabled:true,storage:'database',window:60,max:60,customRules:{'/sign-in/email':{window:60,max:10},'/sign-up/email':{window:60,max:5},'/get-session':false}},
  logger:{level:'error'},
 });
}

export async function getSiteUser(requestHeaders?:Headers){
 const h=requestHeaders??await headers();
 if(!(h.get('cookie')??'').includes('globescholarship.session_token='))return null;
 try{
  const session=await siteAuth().api.getSession({headers:h});
  return session?{userId:session.user.id,displayName:session.user.name,email:session.user.email,fullName:session.user.name}:null;
 }catch{console.error('Account session is temporarily unavailable.');return null;}
}
