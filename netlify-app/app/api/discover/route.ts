import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { getSiteUser } from '../../../lib/auth';
import { database } from '../../../db/store';
import { json,validWrite } from '../../../lib/security';
import { discoverScholarships,validateWebInput,WebSearchError } from '../../../lib/web-search';

import { addDiscoveries } from '../../../lib/catalog-store';
export const maxDuration=30;
// Atomic counters remain effective across concurrent serverless instances.
async function consume(key:string,windowMs:number,limit:number){
 const now=Date.now();
 const rows=await database().execute(sql`INSERT INTO auth_rate_limits (id,key,count,last_request)
 VALUES (${randomUUID()},${key},1,${now}) ON CONFLICT (key) DO UPDATE SET
 count=CASE WHEN auth_rate_limits.last_request <= ${now-windowMs} THEN 1 ELSE auth_rate_limits.count+1 END,
 last_request=CASE WHEN auth_rate_limits.last_request <= ${now-windowMs} THEN ${now} ELSE auth_rate_limits.last_request END
 RETURNING count`);
 return Number(rows[0]?.count)<=limit;
}
export async function POST(request:Request){
 const user=await getSiteUser(request.headers);if(!user)return json({error:'Log in to search the web.'},401);
 if(!validWrite(request))return json({error:'Invalid request.'},403);
 let input;try{const text=await request.text();if(text.length>4000)return json({error:'Search request is too long.'},400);input=validateWebInput(JSON.parse(text));}
 catch(e){return json({error:e instanceof Error?e.message:'Invalid search.'},400);}
 if(!process.env.OPENAI_API_KEY)return json({error:'Web search is not connected yet. You can still search the catalog.'},503);
 try{
  if(!await consume('web-minute:'+user.userId,60000,3)||!await consume('web-day:'+user.userId,86400000,10)||!await consume('web-site-day',86400000,100))return json({error:'Web search limit reached. Try again later or search the catalog.'},429);
  const result=await discoverScholarships(input);
  try{result.catalogUpdate=await addDiscoveries(result);}
  catch{console.warn('Catalog discovery persistence failed');result.catalogUpdate={added:0,existing:0,skipped:false,failed:true};}
  return json(result);
 }catch(e){
  if(e instanceof Error&&(e.name==='TimeoutError'||e.name==='AbortError'))return json({error:'The web search took too long. Try a narrower search with one destination and study level.'},504);
  console.warn('Scholarship web discovery failed:',e instanceof WebSearchError?e.code:'internal_or_incomplete');
  return json({error:e instanceof WebSearchError?e.message:'Web search is temporarily unavailable. Try again or search the catalog.'},503);
 }
}
