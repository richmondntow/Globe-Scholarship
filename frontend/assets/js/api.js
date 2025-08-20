const API_BASE='http://127.0.0.1:5000';
const api={
 async request(path,opt={}){
  const token=localStorage.getItem('token'); const headers=Object.assign({'Content-Type':'application/json'},opt.headers||{});
  if(token) headers['Authorization']='Bearer '+token;
  const res=await fetch(API_BASE+path,{...opt,headers}); if(!res.ok){let msg=res.status+' '+res.statusText; try{const j=await res.json(); msg=j.detail||j.message||msg;}catch{} throw new Error(msg);}
  const ct=res.headers.get('content-type')||''; return ct.includes('application/json')?res.json():res.text();
 },
 get(p){return this.request(p)}, post(p,b){return this.request(p,{method:'POST',body:JSON.stringify(b)})}, del(p){return this.request(p,{method:'DELETE'})}
}; window.api=api;