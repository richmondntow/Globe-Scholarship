(function(){
  const token=localStorage.getItem('token'); if(!token){location.href='login.html'; return;}
  document.getElementById('welcome').textContent='Welcome, '+(localStorage.getItem('first_name')||'Member');
  document.getElementById('logout-btn').addEventListener('click',()=>{localStorage.clear(); location.href='login.html';});
})();

const width=innerWidth, height=innerHeight-56;
const svg=d3.select('#globe').attr('width',width).attr('height',height);
const projection=d3.geoOrthographic().scale(height/2.2).translate([width/2,height/2]).clipAngle(90);
const path=d3.geoPath(projection); const graticule=d3.geoGraticule(); const globe=svg.append('g'); const tooltip=d3.select('#tooltip'); const list=document.getElementById('scholarship-list');

d3.json('https://unpkg.com/world-atlas@2/countries-110m.json').then(world=>{
  const countries=topojson.feature(world, world.objects.countries);
  globe.append('path').datum({type:'Sphere'}).attr('fill','#0f162a').attr('stroke','#fff').attr('stroke-width',0.3).attr('d',path);
  globe.append('path').datum(graticule).attr('fill','none').attr('stroke','#444').attr('stroke-width',0.5).attr('d',path);
  globe.selectAll('.country').data(countries.features).enter().append('path').attr('class','country').attr('fill','#4caf50').attr('stroke','#333').attr('stroke-width',0.3).attr('d',path)
    .on('mouseover',(e,d)=>{tooltip.transition().duration(150).style('opacity',.95); tooltip.html('Country ID: '+d.id).style('left',(e.pageX+10)+'px').style('top',(e.pageY-20)+'px');})
    .on('mouseout',()=>tooltip.transition().duration(150).style('opacity',0))
    .on('click',(e,d)=> fetchScholarships(d.id));
});

async function fetchScholarships(country){
  list.classList.remove('hidden'); list.innerHTML='<h3>Scholarships for '+country+'</h3><p>Loading...</p>';
  try{
    const data=await api.post('/fetch-scholarships',{country});
    if(!data.length){ list.innerHTML='<h3>Scholarships for '+country+'</h3><p>No results.</p>'; return; }
    list.innerHTML='<h3>Scholarships for '+country+'</h3><ul class="rows">'+data.map(s=>`
      <li class="row"><div class="col">
        <div class="title">${(s.name||'').replace(/</g,'&lt;')}</div>
        <div class="meta">${(s.provider||'').replace(/</g,'&lt;')} • Deadline: ${(s.deadline||'unknown').replace(/</g,'&lt;')}</div>
        <a class="link" target="_blank" href="${s.url}">View</a>
      </div>
      <button class="btn small" data-save='${JSON.stringify({name:s.name,provider:s.provider,deadline:s.deadline,url:s.url}).replace(/"/g,"&quot;")}'>Save</button></li>`).join('')+'</ul>';
    list.querySelectorAll('button[data-save]').forEach(btn=>btn.addEventListener('click', async ()=>{ try{ await api.post('/scholarships/save', JSON.parse(btn.getAttribute('data-save'))); btn.textContent='Saved ✓'; btn.disabled=true;}catch(e){ alert('Save failed: '+e.message);} }));
  }catch(e){ list.innerHTML='<h3>Scholarships for '+country+'</h3><p class="error">Error: '+e.message+'</p>'; }
}

let rotation=[0,0], last=[0,0], dragging=false, autoRotate=true;
svg.call(d3.drag().on('start',e=>{dragging=true; last=[e.x,e.y];}).on('drag',e=>{
  rotation[0]+=(e.x-last[0])*0.5; rotation[1]-=(e.y-last[1])*0.5; rotation[1]=Math.max(-90,Math.min(90,rotation[1]));
  projection.rotate(rotation); svg.selectAll('path').attr('d',path); last=[e.x,e.y];
}).on('end',()=>dragging=false));
d3.timer(()=>{ if(autoRotate&&!dragging){ rotation[0]+=0.2; projection.rotate(rotation); svg.selectAll('path').attr('d',path);} });
document.getElementById('toggle-rotation').addEventListener('click',()=>{ autoRotate=!autoRotate; document.getElementById('toggle-rotation').textContent=autoRotate?'Pause Rotation':'Resume Rotation'; });
document.getElementById('search-btn').addEventListener('click',()=>{ const q=document.getElementById('search-input').value.trim(); if(q) fetchScholarships(q); });
document.getElementById('search-input').addEventListener('keypress',e=>{ if(e.key==='Enter'){ const q=e.target.value.trim(); if(q) fetchScholarships(q); }});
