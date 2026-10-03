import { searchScholarships } from '../../../lib/search';
import { json,validWrite } from '../../../lib/security';
export async function POST(request:Request){
 if(!validWrite(request))return json({error:'Invalid request.'},403);
 try{
 const body=await request.json() as Record<string,unknown>;
 if(Object.values(body).some(v=>typeof v!=='string'))return json({error:'Search fields must be text.'},400);
 if(typeof body.query==='string'&&body.query.length>500)return json({error:'Keep your search under 500 characters.'},400);
 return json(searchScholarships(body));
 }catch{return json({error:'Search could not be completed. Please try again.'},400);}
}
