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
 return {added:inserted.length,existing:candidates.length-inserted.length,skipped:false};
}
