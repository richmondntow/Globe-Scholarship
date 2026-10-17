'use client';
import { useRef,useState } from 'react';
import type { WebSearchInput,WebSearchResult } from '../lib/web-search';

export default function WebDiscovery({preferences}:{preferences:Omit<WebSearchInput,'query'>}){
 const [query,setQuery]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [result,setResult]=useState<WebSearchResult|null>(null),[submitted,setSubmitted]=useState('');
 const inFlight=useRef(false);
 return <section className="web-discovery" aria-labelledby="web-search-heading">
  <h3 id="web-search-heading">Find scholarships on the web</h3>
  <p>Discover opportunities beyond our catalog with AI and linked sources. Only your search and selected study filters are sent to OpenAI. Avoid including names, contact details, or other private information.</p>
  <form onSubmit={async e=>{e.preventDefault();if(inFlight.current)return;inFlight.current=true;setBusy(true);setError('');setResult(null);setSubmitted(query.trim());try{
   const r=await fetch('/api/discover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,...preferences})});
   const data=await r.json();if(!r.ok)throw Error(data.error||'Web search is unavailable.');setResult(data);
  }catch(e){setError(e instanceof Error?e.message:'Web search is unavailable.');}finally{setBusy(false);inFlight.current=false;}}}>
   <label htmlFor="web-query">What would you like to study, and where?</label>
   <textarea id="web-query" required maxLength={500} rows={3} value={query} onChange={e=>setQuery(e.target.value)} placeholder="e.g. Fully funded computer science master’s scholarships in Germany for Ghanaian students"/>
   <button className="primary" disabled={busy||!query.trim()}>{busy?'Searching the web…':'Search the web'}</button>
  </form>
  <div aria-live="polite" aria-busy={busy}>{busy&&<p role="status">Checking web sources. This may take up to 45 seconds.</p>}{error&&<p role="alert">{error}</p>}
   {result&&<div className="web-findings"><h4>Findings for “{submitted}”</h4><p>Researched {new Date(result.searchedAt).toLocaleDateString()}. AI findings may contain errors. Confirm deadlines and requirements with the provider before applying. Web findings are separate from saved catalog scholarships.</p>
    {result.sections.map((section,i)=>{let cursor=0;const fragments=[];for(const [j,c] of section.citations.entries()){fragments.push(<span key={'text-'+j}>{section.text.slice(cursor,c.start)}</span>);fragments.push(<a key={'cite-'+j} href={c.url} target="_blank" rel="noopener noreferrer" title={c.title}>[{j+1}: {c.title}]</a>);cursor=c.end;}fragments.push(<span key="rest">{section.text.slice(cursor)}</span>);return <div className="web-answer" key={i}>{fragments}</div>;})}
   </div>}
  </div>
 </section>;
}
