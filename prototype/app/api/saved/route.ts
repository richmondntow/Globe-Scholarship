import { getChatGPTUser } from '../../chatgpt-auth';
import { database } from '../../../db/store';
import { scholarships } from '../../../lib/catalog';
import { validWrite,json } from '../../../lib/security';
export async function GET() {
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in to see your saved scholarships.'},401);
 try{const data=await database().prepare('SELECT scholarship_id,saved_at FROM saved_scholarships WHERE user_id = ? ORDER BY saved_at DESC').bind(user.userId).all();return json({saved:data.results});}
 catch(e){console.error(e);return json({error:'Saved scholarships are temporarily unavailable.'},503);}
}
async function mutate(request:Request,remove:boolean){
 const user=await getChatGPTUser();if(!user)return json({error:'Sign in to save scholarships.'},401);
 if(!validWrite(request))return json({error:'Invalid request.'},403);
 let id:unknown;try{id=(await request.json() as {id:unknown}).id;}catch{return json({error:'Invalid scholarship.'},400);}
 if(typeof id!=='string'||!scholarships.some(x=>x.id===id))return json({error:'Scholarship not found.'},404);
 try{
  const db=database();
  if(remove)await db.prepare('DELETE FROM saved_scholarships WHERE user_id = ? AND scholarship_id = ?').bind(user.userId,id).run();
  else await db.prepare('INSERT INTO saved_scholarships (user_id,scholarship_id,saved_at) VALUES (?,?,?) ON CONFLICT(user_id,scholarship_id) DO NOTHING').bind(user.userId,id,new Date().toISOString()).run();
  return json({id,saved:!remove});
 }catch(e){console.error('save unavailable',e);return json({error:'Could not update your saved list. Please try again.'},503);}
}
export const POST=(r:Request)=>mutate(r,false);
export const DELETE=(r:Request)=>mutate(r,true);
