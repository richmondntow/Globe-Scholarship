import { getSiteUser } from '../../../lib/auth';
import { searchScholarships } from '../../../lib/search';
import { json,validWrite } from '../../../lib/security';
import { loadCatalog } from '../../../lib/catalog-store';
import { recordOperationalMetric } from '../../../lib/ops-metrics';
export async function POST(request:Request){
 if(!await getSiteUser(request.headers))return json({error:'Log in to search scholarships.'},401);
 if(!validWrite(request))return json({error:'Invalid request.'},403);
 const startedAt=performance.now();
 try{
 const body=await request.json() as Record<string,unknown>;
 if(Object.values(body).some(v=>typeof v!=='string'))return json({error:'Search fields must be text.'},400);
 if(typeof body.query==='string'&&body.query.length>500)return json({error:'Keep your search under 500 characters.'},400);
 const catalog=await loadCatalog();
 const result={...searchScholarships(body,catalog),catalog};
 await recordOperationalMetric('catalog_search',startedAt,true);
 return json(result);
 }catch{
 await recordOperationalMetric('catalog_search',startedAt,false);
 return json({error:'Search could not be completed. Please try again.'},400);
 }
}
