(function(){ const token=localStorage.getItem('token'); if(!token){location.href='login.html'; return;} document.getElementById('welcome').textContent='Welcome, '+(localStorage.getItem('first_name')||'Member'); document.getElementById('logout-btn').addEventListener('click',()=>{localStorage.clear(); location.href='login.html';}); })();
(async function(){
  const list=document.getElementById('list'); list.innerHTML='Loading...';
  try{ const data=await api.get('/scholarships/saved'); if(!data.length){ list.innerHTML='<p class="muted">No saved scholarships yet.</p>'; return;}
    list.innerHTML='<ul class="rows">'+data.map(s=>`<li class="row"><div class="col"><div class="title">${(s.name||'').replace(/</g,'&lt;')}</div><div class="meta">${(s.provider||'').replace(/</g,'&lt;')} • Deadline: ${(s.deadline||'unknown').replace(/</g,'&lt;')}</div><a class="link" target="_blank" href="${s.url}">Open</a></div></li>`).join('')+'</ul>';
  }catch(e){ list.innerHTML='<p class="error">Error: '+e.message+'</p>'; }
})();