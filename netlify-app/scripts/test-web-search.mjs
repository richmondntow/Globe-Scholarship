import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWebInput,parseWebResponse,discoverScholarships} from '../lib/web-search.ts';
const fixture={status:'completed',output:[{type:'web_search_call',status:'completed'},{type:'message',content:[{type:'output_text',text:'Funding [source]',annotations:[{type:'url_citation',start_index:8,end_index:16,url:'https://university.example/scholarship',title:'Provider'}]}]}]};
test('requires a bounded query and valid GPA',()=>{
 for(const input of [null,[],{}, {query:''},{query:'x'.repeat(501)},{query:'funding',gpa:'4.1'},{query:'funding',gpa:'abc'},{query:'funding',apiKey:'secret'}])assert.throws(()=>validateWebInput(input));
 assert.deepEqual(validateWebInput({query:'Masters in Germany',gpa:'3.50'}),{query:'Masters in Germany',gpa:'3.50'});
});
test('requires completed web search and cited evidence',()=>{
 assert.equal(parseWebResponse(fixture).sections[0].citations[0].url,'https://university.example/scholarship');
 for(const payload of [{...fixture,status:'incomplete'},{...fixture,output:fixture.output.slice(1)},{status:'completed',output:[fixture.output[0]]}])assert.throws(()=>parseWebResponse(payload));
});
test('rejects unsafe URLs and invalid citation offsets',()=>{
 for(const annotation of [{url:'javascript:alert(1)'},{url:'https://user:password@example.com'},{start_index:-1},{end_index:999},{start_index:12,end_index:8}]){
  const payload=structuredClone(fixture);Object.assign(payload.output[1].content[0].annotations[0],annotation);assert.throws(()=>parseWebResponse(payload));
 }
});
test('requires web search, disables response storage and handles provider failures',async()=>{
 const oldKey=process.env.OPENAI_API_KEY,oldFetch=globalThis.fetch;
 try{
  process.env.OPENAI_API_KEY='fixture-only-not-a-real-key';
  globalThis.fetch=async(url,init)=>{assert.equal(url,'https://api.openai.com/v1/responses');const body=JSON.parse(init.body);assert.equal(body.store,false);assert.equal(body.tool_choice,'required');assert.equal(body.tools[0].type,'web_search');assert.equal(body.max_tool_calls,3);assert.equal(JSON.parse(body.input).preferences.query,'funding');return Response.json(fixture);};
  assert.equal((await discoverScholarships({query:'funding'})).sections.length,1);
  globalThis.fetch=async()=>new Response('private provider details',{status:401});await assert.rejects(discoverScholarships({query:'funding'}),/could not authenticate/);
  globalThis.fetch=async()=>Response.json({error:{code:'insufficient_quota',message:'sensitive upstream details'}},{status:429});await assert.rejects(discoverScholarships({query:'funding'}),/no available quota/);
  globalThis.fetch=async()=>Response.json({error:{code:'invalid_request_error',param:'max_tool_calls'}},{status:400});await assert.rejects(discoverScholarships({query:'funding'}),e=>e.code==='configuration_max_tool_calls'&&!e.message.includes('sensitive'));
  delete process.env.OPENAI_API_KEY;await assert.rejects(discoverScholarships({query:'funding'}),/not configured/);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});
