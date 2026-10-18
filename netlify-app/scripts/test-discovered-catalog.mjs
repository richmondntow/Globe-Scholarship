import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync,readFileSync } from 'node:fs';
import ts from 'typescript';
// Resolve application TypeScript imports for tests without changing runtime code.
// The in-process PostgreSQL emulator uses one backend, so serialize its wire connection.
registerHooks({resolve(specifier,context,next){
 if(specifier.startsWith('.')&&context.parentURL){const url=new URL(specifier,context.parentURL);if(!existsSync(url)&&existsSync(new URL(url+'.ts')))return next(url+'.ts',context);}
 return next(specifier,context);
},load(url,context,next){
 if(url.endsWith('.json')&&url.includes('/netlify-app/data/'))return {format:'module',source:'export default '+readFileSync(new URL(url),'utf8'),shortCircuit:true};
 if(url.endsWith('.ts')&&!url.includes('/node_modules/'))return {format:'module',source:ts.transpileModule(url.endsWith('/db/store.ts')?readFileSync(new URL(url),'utf8').replace('max: 2','max: 1'):readFileSync(new URL(url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,shortCircuit:true};
 return next(url,context);
}});
// Provider mock tests run separately to keep their global fetch stub isolated.
const {extractDiscovered,canonicalSource}=await import('../lib/discovered-records.ts');
const {searchScholarships}=await import('../lib/search.ts');
const {scholarships}=await import('../lib/catalog.ts');
const text=`Scholarship: Example Engineering Award
Provider: Example University
Destination: Ghana
Study level: Undergraduate
Funding: Full funding
Funding details: Tuition and living costs
Description: Supports engineering study.
Deadline: Not verified
Source: [source]`;
const result={searchedAt:'2026-10-18T12:00:00Z',sections:[{text,citations:[{start:text.indexOf('[source]'),end:text.length,url:'https://university.example/award/?utm_source=test#details',title:'University'}]}]};
const [record]=extractDiscovered(result);
assert.deepEqual(extractDiscovered({...result,sections:[{...result.sections[0],text:text.replace('Undergraduate',"Master's, DPhil")}]} )[0].levels,['Master’s','PhD']);
assert.equal(record.provenance,'AI discovered');assert.equal(record.url,'https://university.example/award');assert.equal(record.deadlineDate,null);
assert.equal(extractDiscovered({...result,sections:[{...result.sections[0],citations:[]}]}).length,0);
assert.equal(extractDiscovered({...result,sections:[{...result.sections[0],text:text.replace('Provider: Example University','Provider: Not verified')}]}).length,0);
assert.equal(extractDiscovered({...result,sections:[{...result.sections[0],citations:[{...result.sections[0].citations[0],url:scholarships[0].url}]}]}).length,0);
for(const url of ['http://university.example','https://localhost/','https://127.0.0.1/','https://user:pass@university.example'])assert.throws(()=>canonicalSource(url));
assert.equal(searchScholarships({query:'engineering in Ghana'},[...scholarships,record]).results[0].id,record.id);
assert.equal(searchScholarships({query:'zzqvzzz'},[...scholarships,record]).results.length,0);
console.log('Discovery extraction, source normalization, validation, curated deduplication and dynamic ranking passed.');

// Exercise the actual persistence function against a disposable PostgreSQL database.
const {NetlifyDB}=await import('@netlify/database-dev');
const postgres=(await import('postgres')).default;
const db=new NetlifyDB({logger:()=>{}});let connection;
try{
 process.env.NETLIFY_DB_URL=await db.start();await db.applyMigrations('./netlify/database/migrations');
 const {addDiscoveries,loadCatalog}=await import('../lib/catalog-store.ts');
 const responses=await Promise.all([addDiscoveries(result),addDiscoveries(result),addDiscoveries(result)]);
 assert.equal(responses.reduce((n,r)=>n+r.added,0),1);
 const catalog=await loadCatalog();assert.equal(catalog.length,15);assert.equal(catalog.find(s=>s.id===record.id).provenance,'AI discovered');
 connection=postgres(process.env.NETLIFY_DB_URL,{max:1});
 const [row]=await connection`SELECT * FROM discovered_catalog`;
 assert.deepEqual(Object.keys(row).sort(),['discovered_at','id','identity_key','record','source_url']);
 assert.equal(searchScholarships({query:'',country:'Ghana'},catalog).results.length,1);
 await connection`UPDATE discovered_catalog SET record = ${JSON.stringify({...record,levels:[]})} WHERE id = ${record.id}`;
 const refresh=await addDiscoveries(result);assert.equal(refresh.added,0);
 const updated=(await loadCatalog()).find(s=>s.id===record.id);
 assert.deepEqual(updated.levels,['Undergraduate']);assert.equal(updated.discoveredAt,record.discoveredAt);
 console.log('Real database migration, concurrent duplicate prevention, persistence, shared catalog and search passed.');
}finally{if(connection)await connection.end();await db.stop();}
