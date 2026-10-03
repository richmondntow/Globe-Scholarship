import { getSiteUser } from '../../../lib/auth';
import { and,eq,desc } from 'drizzle-orm';
import { savedScholarships } from '../../../db/schema';
import { database } from '../../../db/store';
import { scholarships } from '../../../lib/catalog';
import { validWrite,json } from '../../../lib/security';
export async function GET(request:Request) {
 const user=await getSiteUser(request.headers);if(!user)return json({error:'Sign in to see your saved scholarships.'},401);
 try{const saved=await database().select({scholarship_id:savedScholarships.scholarshipId,saved_at:savedScholarships.savedAt}).from(savedScholarships).where(eq(savedScholarships.userId,user.userId)).orderBy(desc(savedScholarships.savedAt));return json({saved});}
 catch(e){console.error(e);return json({error:'Saved scholarships are temporarily unavailable.'},503);}
}
async function mutate(request:Request,remove:boolean){
 const user=await getSiteUser(request.headers);if(!user)return json({error:'Sign in to save scholarships.'},401);
 if(!validWrite(request))return json({error:'Invalid request.'},403);
 let id:unknown;try{id=(await request.json() as {id:unknown}).id;}catch{return json({error:'Invalid scholarship.'},400);}
 if(typeof id!=='string'||!scholarships.some(x=>x.id===id))return json({error:'Scholarship not found.'},404);
 try{
  const db=database();
  if(remove)await db.delete(savedScholarships).where(and(eq(savedScholarships.userId,user.userId),eq(savedScholarships.scholarshipId,id)));
  else await db.insert(savedScholarships).values({userId:user.userId,scholarshipId:id,savedAt:new Date().toISOString()}).onConflictDoNothing();
  return json({id,saved:!remove});
 }catch(e){console.error('save unavailable',e);return json({error:'Could not update your saved list. Please try again.'},503);}
}
export const POST=(r:Request)=>mutate(r,false);
export const DELETE=(r:Request)=>mutate(r,true);
