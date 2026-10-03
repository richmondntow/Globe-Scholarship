import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { headers } from 'next/headers';
import { localDevelopment,siteOrigin,trustedOrigins } from './server-origin';
import { database } from '../db/store';
import { authUsers,authSessions,authAccounts,authVerifications,authRateLimits } from '../db/schema';

export function siteAuth(){
 const secret=process.env.BETTER_AUTH_SECRET;
 if(!secret||secret.length<32)throw new Error('Authentication is unavailable.');
 const local=localDevelopment();
 return betterAuth({
  appName:'GlobeScholarship AI',secret,
  baseURL:siteOrigin(),
  trustedOrigins:trustedOrigins(),
  database:drizzleAdapter(database(),{provider:'pg',schema:{user:authUsers,session:authSessions,account:authAccounts,verification:authVerifications,rateLimit:authRateLimits}}),
  emailAndPassword:{enabled:true,minPasswordLength:12,maxPasswordLength:128,autoSignIn:true},
  session:{expiresIn:60*60*24*7,updateAge:60*60*24,cookieCache:{enabled:false}},
  advanced:{cookiePrefix:'globescholarship',useSecureCookies:!local,defaultCookieAttributes:{httpOnly:true,sameSite:'lax',path:'/'},ipAddress:{ipAddressHeaders:['x-nf-client-connection-ip']}},
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
