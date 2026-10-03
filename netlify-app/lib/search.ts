import model from '../data/search-model.json';
import { scholarships, destinations } from './catalog';
export type SearchInput = {query?:string;country?:string;level?:string;funding?:string};
const aliases: Record<string,string>={usa:'United States',america:'United States',uk:'United Kingdom',britain:'United Kingdom',korea:'South Korea'};
export function inferredCountry(query:string) {
 const lower=query.toLowerCase();
 for(const c of destinations) if(lower.includes(c.toLowerCase()))return c;
 for(const [key,c] of Object.entries(aliases))if(new RegExp('\\b'+key+'\\b','i').test(query))return c;
 return '';
}
function vector(query:string){
 const vocab=model.vocabulary as Record<string,number>;
 const tf=new Map<number,number>();
 for(const token of query.toLowerCase().replaceAll('’',"'").match(/[a-z0-9]+/g)??[]){const i=vocab[token];if(i!==undefined)tf.set(i,(tf.get(i)??0)+1);}
 const latent=model.components.map(c=>{let sum=0;for(const[i,n]of tf)sum+=c[i]*(1+Math.log(n))*model.idf[i];return sum;});
 const norm=Math.sqrt(latent.reduce((n,v)=>n+v*v,0));return norm?latent.map(v=>v/norm):latent;
}
export function searchScholarships(input:SearchInput){
 const query=(input.query??'').trim().slice(0,500),lower=query.toLowerCase();
 const country=input.country || inferredCountry(query);
 const level=input.level || (/\b(undergraduate|bachelor|bachelors)\b/.test(lower)?'Undergraduate':/\b(master|masters|postgraduate)\b/.test(lower)?'Master’s':/\b(phd|doctoral|doctorate)\b/.test(lower)?'PhD':'');
 const funding=input.funding || (/\b(fully funded|full funding|full ride)\b/.test(lower)?'Full funding':'');
 const embedding=vector(query);
 const selected=scholarships.filter(s=>(!country||(s.countries??[s.country]).includes(country))&&(!level||s.levels.includes(level))&&(!funding||s.funding===funding));
 const ranked=selected.map(s=>{
  const index=model.ids.indexOf(s.id);let score=query?model.vectors[index].reduce((v,x,i)=>v+x*embedding[i],0):0;
  const terms=lower.match(/[a-z0-9]+/g)??[];
  const title=(s.title+' '+s.provider).toLowerCase();if(terms.some(t=>t.length>3&&title.includes(t)))score+=0.25;
  const reasons:string[]=[];
  if(country)reasons.push('Study in '+country);
  if(level)reasons.push(level+' opportunity');
  if(funding)reasons.push(funding);
  if(/computer|software|coding|programming|stem|engineering/.test(lower)&&s.fields.some(f=>/Computer|Engineering|Science/.test(f)))reasons.push('Relevant science & technology fields');
  if(query&&!reasons.length)reasons.push('Related to your search');
  return {...s,score,reasons};
 }).filter(s=>!query||country||level||funding||s.score>0.12).sort((a,b)=>b.score-a.score);
 return {results:ranked.map(s=>{const {score,...result}=s;void score;return result;}),interpreted:{country,level,funding},model:'Semantic AI · LSA',query};
}
