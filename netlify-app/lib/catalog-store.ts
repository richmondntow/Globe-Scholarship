import { eq } from 'drizzle-orm';
import { database } from '../db/store';
import { discoveredCatalog } from '../db/schema';
import { scholarships, type Scholarship } from './catalog';
import { canonicalSource,extractDiscovered,identityKey } from './discovered-records';
import type { WebSearchResult } from './web-search';

export async function loadCatalog():Promise<Scholarship[]>{
 const rows=await database().select().from(discoveredCatalog);
 return [...scholarships,...rows.map(row=>JSON.parse(row.record) as Scholarship)];
}
export async function addDiscoveries(result:WebSearchResult){
 const candidates=extractDiscovered(result);
 if(!candidates.length)return {added:0,existing:0,skipped:true};
 const inserted=await database().insert(discoveredCatalog).values(candidates.map(record=>({
  id:record.id,identityKey:identityKey(record),sourceUrl:canonicalSource(record.url),record:JSON.stringify(record),discoveredAt:result.searchedAt,
 }))).onConflictDoNothing().returning({id:discoveredCatalog.id});
 // Refresh incomplete AI metadata on repeated findings without replacing curated data
 // or changing the stable ID / original discovery date used by personal saves.
 for(const candidate of candidates){
  if(inserted.some(row=>row.id===candidate.id))continue;
  const [existing]=await database().select().from(discoveredCatalog).where(eq(discoveredCatalog.id,candidate.id));
  if(!existing)continue;
  const previous=JSON.parse(existing.record) as Scholarship;
  if(!previous.levels.length&&candidate.levels.length)await database().update(discoveredCatalog).set({record:JSON.stringify({...previous,levels:candidate.levels})}).where(eq(discoveredCatalog.id,candidate.id));
 }
 return {added:inserted.length,existing:candidates.length-inserted.length,skipped:false};
}
