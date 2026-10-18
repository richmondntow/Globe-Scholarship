// Used only by the disposable local validation process via --import.
const original=globalThis.fetch;
globalThis.fetch=async function(url,options){
 if(String(url)!=='https://api.openai.com/v1/responses')return original(url,options);
 const text=`Scholarship: Example Engineering Award
Provider: Example University
Destination: Ghana
Study level: Undergraduate
Funding: Full funding
Funding details: Tuition and living costs
Description: Supports engineering study.
Deadline: Not verified
Source: [source]`;
 return Response.json({status:'completed',output:[{type:'web_search_call',status:'completed'},{type:'message',content:[{type:'output_text',text,annotations:[{type:'url_citation',start_index:text.indexOf('[source]'),end_index:text.length,url:'https://university.example/award/?utm_source=fixture',title:'Example University'}]}]}]});
};
