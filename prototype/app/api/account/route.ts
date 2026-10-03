import { getSiteUser } from '../../../lib/auth';
import { database } from '../../../db/store';
import { validWrite, json } from '../../../lib/security';
export async function GET(request:Request) {
 const user = await getSiteUser(request.headers); if (!user) return json({error:'Sign in to access your profile.'},401);
 try {
  const db=database();
  const profile=await db.prepare('SELECT name, nationality, level, field FROM profiles WHERE user_id = ?').bind(user.userId).first();
  const saved=await db.prepare('SELECT scholarship_id FROM saved_scholarships WHERE user_id = ? ORDER BY saved_at DESC').bind(user.userId).all();
  return json({user:{displayName:user.displayName,email:user.email},profile:profile ?? {name:user.fullName ?? '',nationality:'',level:'',field:''},saved:saved.results.map(x=>x.scholarship_id)});
 } catch(e) {console.error('account unavailable',e);return json({error:'Your profile could not be loaded. Please try again.'},503);}
}
export async function PUT(request:Request) {
 const user=await getSiteUser(request.headers);if(!user)return json({error:'Sign in to update your profile.'},401);
 if(!validWrite(request))return json({error:'Invalid request.'},403);
 try {
  const body=await request.json() as Record<string,unknown>;
  const clean=(key:string,max:number)=>typeof body[key]==='string' ? (body[key] as string).trim().slice(0,max):'';
  const name=clean('name',80),nationality=clean('nationality',80),level=clean('level',30),field=clean('field',100);
  if(!name || !['','Undergraduate','Master’s','PhD'].includes(level)) return json({error:'Add your name and choose a valid study level.'},400);
  await database().prepare('INSERT INTO profiles (user_id,name,nationality,level,field,updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,nationality=excluded.nationality,level=excluded.level,field=excluded.field,updated_at=excluded.updated_at').bind(user.userId,name,nationality,level,field,new Date().toISOString()).run();
  return json({profile:{name,nationality,level,field}});
 }catch(e){console.error('profile save failed',e);return json({error:'Your profile could not be saved. Please try again.'},503);}
}
