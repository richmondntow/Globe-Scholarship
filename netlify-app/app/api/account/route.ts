import { getSiteUser } from '../../../lib/auth';
import { eq,desc } from 'drizzle-orm';
import { profiles,savedScholarships } from '../../../db/schema';
import { database } from '../../../db/store';
import { validWrite, json } from '../../../lib/security';
export async function GET(request:Request) {
 const user = await getSiteUser(request.headers); if (!user) return json({error:'Sign in to access your profile.'},401);
 try {
  const db=database();
  const [profile]=await db.select({name:profiles.name,nationality:profiles.nationality,level:profiles.level,field:profiles.field}).from(profiles).where(eq(profiles.userId,user.userId));
  const saved=await db.select({id:savedScholarships.scholarshipId}).from(savedScholarships).where(eq(savedScholarships.userId,user.userId)).orderBy(desc(savedScholarships.savedAt));
  return json({user:{displayName:user.displayName,email:user.email},profile:profile ?? {name:user.fullName ?? '',nationality:'',level:'',field:''},saved:saved.map(x=>x.id)});
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
  const value={userId:user.userId,name,nationality,level,field,updatedAt:new Date().toISOString()};
  await database().insert(profiles).values(value).onConflictDoUpdate({target:profiles.userId,set:value});
  return json({profile:{name,nationality,level,field}});
 }catch(e){console.error('profile save failed',e);return json({error:'Your profile could not be saved. Please try again.'},503);}
}
