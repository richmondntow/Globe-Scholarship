import { createHash } from 'node:crypto';
import { scholarships, type Scholarship } from './catalog';
import type { WebSearchResult } from './web-search';

// Retain provider content only, never search preferences, account IDs or GPA.
export function canonicalSource(value:string){
 const u=new URL(value);
 if(u.protocol!=='https:'||u.username||u.password||u.port||!u.hostname.includes('.')||/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[)/i.test(u.hostname))throw Error('Invalid source');
 u.hash='';for(const key of [...u.searchParams.keys()])if(/^(utm_|fbclid|gclid)/i.test(key))u.searchParams.delete(key);
 u.searchParams.sort();u.hostname=u.hostname.replace(/^www\./,'');u.pathname=u.pathname.replace(/\/+$/,'')||'/';return u.toString();
}
const normalize=(s:string)=>s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function identityKey(s:Pick<Scholarship,'title'|'provider'|'country'>){return normalize(s.title)+'|'+normalize(s.provider)+'|'+normalize(s.country);}
export function extractDiscovered(result:WebSearchResult):Scholarship[]{
 const records:Scholarship[]=[];
 for(const section of result.sections){
  const starts=[...section.text.matchAll(/^Scholarship:[ \t]*(.+)$/gm)];
  for(let i=0;i<starts.length&&records.length<3;i++){
   const start=starts[i].index!,end=starts[i+1]?.index??section.text.length;
   const text=section.text.slice(start,end);
   const field=(name:string)=>new RegExp('^'+name+':[ \\t]*(.+)$','mi').exec(text)?.[1].trim().slice(0,300)||'';
   const title=field('Scholarship'),provider=field('Provider'),country=field('Destination');
   const citation=section.citations.find(c=>c.start>=start&&c.end<=end);
   if(!title||!provider||!country||!citation||[title,provider,country].some(v=>/not verified|unknown|https?:|@/i.test(v)))continue;
   let url:string;try{url=canonicalSource(citation.url);}catch{continue;}
   const key=identityKey({title,provider,country});
   // Same official page or scholarship identity never replaces a curated record.
   if(scholarships.some(s=>identityKey(s)===key||canonicalSource(s.url)===url))continue;
   const level=field('Study level');const funding=field('Funding');
   records.push({id:'ai-'+createHash('sha256').update(key).digest('hex').slice(0,24),title,provider,country,countryCode:'',
    levels:[...( /undergraduate|bachelor/i.test(level)?['Undergraduate']:[]),...(/master/i.test(level)?['Master’s']:[]),...(/phd|ph\.?d|dphil|doctoral|doctorate/i.test(level)?['PhD']:[])],
    funding:['Full funding','Full tuition','Need-based','Partial funding','Varies'].includes(funding)?funding:'Not verified',
    amount:field('Funding details')||'Not verified',description:(field('Description')||title).replace(/[^]*/g,''),
    eligibility:['Confirm current eligibility requirements on the linked provider page.'],benefits:[],
    deadline:field('Deadline')||'Not verified',deadlineDate:null,url,fields:[],
    note:'AI findings may contain errors. Confirm current details with the provider.',checked:result.searchedAt.slice(0,10),
    provenance:'AI discovered',discoveredAt:result.searchedAt});
  }
 }
 return records;
}
