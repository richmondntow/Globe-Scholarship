'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { geoContains, geoEquirectangular, geoPath, geoGraticule10, geoOrthographic } from 'd3-geo';
import { feature } from 'topojson-client';
import { Minus, Plus, RotateCcw, Pause, Play } from 'lucide-react';
import type { Feature, Geometry } from 'geojson';
import type { Topology } from 'topojson-specification';

type CountryFeature=Feature<Geometry,{name:string}>;
const centers:Record<string,[number,number]>={'United States':[-99,38],Canada:[-106,52],'United Kingdom':[-3,55],Germany:[10,51],'South Korea':[128,36],Japan:[138,37],China:[105,35],Australia:[134,-25],Switzerland:[8,47]};
export default function Globe({selected,onSelect}:{selected:string;onSelect:(s:string)=>void}){
 const mount=useRef<HTMLDivElement>(null),selection=useRef(selected),choose=useRef(onSelect),controls=useRef<{zoom:(n:number)=>void;reset:()=>void}>({zoom:()=>{},reset:()=>{}});
 const [hover,setHover]=useState(''),[paused,setPaused]=useState(false),[failed,setFailed]=useState(false);
 const pause=useRef(false);
 useEffect(()=>{choose.current=onSelect},[onSelect]);
 useEffect(()=>{selection.current=selected},[selected]);
 useEffect(()=>{pause.current=paused},[paused]);
 useEffect(()=>{
  const target=mount.current;if(!target)return;const container=target;
  let disposed=false,frame=0,cleanup=()=>{};
  let countries:CountryFeature[]=[];
  function startCanvas(){
   if(!countries.length){setFailed(true);return;}
   const canvas=document.createElement('canvas');container.appendChild(canvas);const ctx=canvas.getContext('2d');if(!ctx){setFailed(true);return;}
   const projection=geoOrthographic();const path=geoPath(projection,ctx);let w=0,h=0,r=0;
   let rotation:[number,number,number]=[-15,-15,0],drag=false,hovered='',lastX=0,lastY=0,downX=0,downY=0,moved=0,previous='';
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   function resize(){w=container.clientWidth;h=container.clientHeight;r=Math.min(w*.36,h*.405);const dpr=Math.min(window.devicePixelRatio,2);canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx!.setTransform(dpr,0,0,dpr,0,0);projection.translate([w/2,h/2-4]).scale(r);}
   function paint(){ctx!.clearRect(0,0,w,h);projection.rotate(rotation);
    const halo=ctx!.createRadialGradient(w/2,h/2,r*.85,w/2,h/2,r*1.15);halo.addColorStop(0,'rgba(160,132,252,0.2)');halo.addColorStop(.5,'rgba(160,132,252,0.10)');halo.addColorStop(1,'rgba(160,132,252,0)');ctx!.fillStyle=halo;ctx!.fillRect(0,0,w,h);
    ctx!.beginPath();path({type:'Sphere'});ctx!.fillStyle='#1c2843';ctx!.fill();
    ctx!.beginPath();path(geoGraticule10());ctx!.strokeStyle='#303c58';ctx!.lineWidth=.6;ctx!.stroke();
    for(const c of countries){ctx!.beginPath();path(c);ctx!.fillStyle=c.properties.name===selection.current?'#ac95ed':c.properties.name===hovered?'#c8b5f6':'#939db6';ctx!.fill();ctx!.strokeStyle='#27324d';ctx!.lineWidth=.7;ctx!.stroke();}
    ctx!.save();ctx!.beginPath();ctx!.arc(w/2,h/2-4,r,0,Math.PI*2);ctx!.clip();const shade=ctx!.createRadialGradient(w/2-r*.38,h/2-r*.5,r*.14,w/2-r*.32,h/2-r*.35,r*1.6);shade.addColorStop(0,'rgba(225,220,255,0.08)');shade.addColorStop(.62,'rgba(14,16,37,0.02)');shade.addColorStop(1,'rgba(4,5,21,0.76)');ctx!.fillStyle=shade;ctx!.fillRect(0,0,w,h);ctx!.restore();
    ctx!.beginPath();ctx!.arc(w/2,h/2-4,r,0,Math.PI*2);ctx!.strokeStyle='#77699380';ctx!.lineWidth=1;ctx!.stroke();
   }
   function pick(e:PointerEvent){const b=canvas.getBoundingClientRect();const x=e.clientX-b.left,y=e.clientY-b.top;if(Math.hypot(x-w/2,y-(h/2-4))>r)return '';const p=projection.invert?.([x,y]);return p?countries.find(c=>geoContains(c,p))?.properties.name??'':'';}
   function down(e:PointerEvent){drag=true;downX=lastX=e.clientX;downY=lastY=e.clientY;moved=0;canvas.setPointerCapture(e.pointerId);}
   function move(e:PointerEvent){if(drag){moved=Math.hypot(e.clientX-downX,e.clientY-downY);rotation[0]+=(e.clientX-lastX)*.3;rotation[1]=Math.max(-75,Math.min(75,rotation[1]-(e.clientY-lastY)*.3));lastX=e.clientX;lastY=e.clientY;}else{hovered=pick(e);setHover(hovered);canvas.style.cursor=hovered?'pointer':'grab';}}
   function up(e:PointerEvent){if(drag&&moved<6){const c=pick(e);if(c)choose.current(c);}drag=false;}
   function leave(){if(!drag){hovered='';setHover('');}}
   const ro=new ResizeObserver(resize);ro.observe(container);resize();
   controls.current={zoom:n=>{r=Math.max(75,Math.min(Math.min(w,h)*.49,r-n*24));projection.scale(r);},reset:()=>{rotation=[-15,-15,0];resize();}};
   canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('pointercancel',()=>{drag=false;});
   function animate(){if(disposed)return;frame=requestAnimationFrame(animate);if(previous!==selection.current){previous=selection.current;const c=centers[previous];if(c)rotation=[-c[0],-c[1],0];}if(!pause.current&&!drag&&!hovered&&!selection.current&&!reduced)rotation[0]+=.07;paint();}
   animate();cleanup=()=>{ro.disconnect();cancelAnimationFrame(frame);canvas.remove();};
  }
  async function setup(){
   try{
    const topology=await fetch('/data/world.json').then(r=>{if(!r.ok)throw Error('Map unavailable');return r.json() as Promise<Topology>});
    if(disposed)return;
    countries=(feature(topology,topology.objects.countries) as unknown as {features:CountryFeature[]}).features;
    const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(35,1,.1,100);camera.position.z=4.6;
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));renderer.setClearColor(0x000000,0);container.appendChild(renderer.domElement);
    const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1024;
    const ctx=canvas.getContext('2d')!;const projection=geoEquirectangular().scale(2048/(2*Math.PI)).translate([1024,512]);const path=geoPath(projection,ctx);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.MeshPhongMaterial({map:texture,shininess:12,specular:0x333850});
    const globe=new THREE.Mesh(new THREE.SphereGeometry(1.15,96,64),material);globe.rotation.set(.25,-Math.PI/2-.18,0);scene.add(globe);
    scene.add(new THREE.AmbientLight(0xffffff,2.3));const light=new THREE.DirectionalLight(0xe4ddff,2);light.position.set(-3,4,5);scene.add(light);
    // Atmospheric rim uses sphere geometry and a transparent shader, not a bitmap.
    const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1.173,64,48),new THREE.ShaderMaterial({vertexShader:'varying vec3 vNormal; varying vec3 vPos; void main(){vNormal=normalize(normalMatrix*normal); vec4 p=modelViewMatrix*vec4(position,1.0); vPos=normalize(-p.xyz); gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vNormal; varying vec3 vPos; void main(){float a=pow(1.0-abs(dot(vNormal,vPos)),3.5)*0.55; gl_FragColor=vec4(0.58,0.46,1.0,a);}',transparent:true,depthWrite:false,side:THREE.FrontSide}));scene.add(atmosphere);
    let hovered='',drag=false,lastX=0,lastY=0,moved=0,downX=0,downY=0,previousSelection=selection.current;
    const raycaster=new THREE.Raycaster();
    function paint(){
     ctx.fillStyle='#182139';ctx.fillRect(0,0,2048,1024);
     ctx.beginPath();path(geoGraticule10());ctx.strokeStyle='#273149';ctx.lineWidth=.7;ctx.stroke();
     for(const country of countries){ctx.beginPath();path(country);ctx.fillStyle=country.properties.name===selection.current?'#ad97ff':country.properties.name===hovered?'#d3c8f9':'#929cb5';ctx.fill();ctx.strokeStyle='#24314a';ctx.lineWidth=1.15;ctx.stroke();}
     texture.needsUpdate=true;
    }
    function pick(event:PointerEvent){
     const rect=renderer.domElement.getBoundingClientRect();raycaster.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
     const hit=raycaster.intersectObject(globe)[0];if(!hit?.uv)return '';
     const p:[number,number]=[hit.uv.x*360-180,hit.uv.y*180-90];
     const country=countries.find(c=>geoContains(c,p));return country?.properties.name==='United States of America'?'United States':country?.properties.name??'';
    }
    // Use the same name for map highlighting and catalog filters.
    for(const c of countries)if(c.properties.name==='United States of America')c.properties.name='United States';
    function down(e:PointerEvent){drag=true;downX=lastX=e.clientX;downY=lastY=e.clientY;moved=0;renderer.domElement.setPointerCapture(e.pointerId);}
    function move(e:PointerEvent){if(drag){moved=Math.hypot(e.clientX-downX,e.clientY-downY);globe.rotation.y+=(e.clientX-lastX)*.006;globe.rotation.x=THREE.MathUtils.clamp(globe.rotation.x+(e.clientY-lastY)*.004,-1.25,1.25);lastX=e.clientX;lastY=e.clientY;}else{const name=pick(e);if(name!==hovered){hovered=name;setHover(name);paint();}renderer.domElement.style.cursor=name?'pointer':'grab';}}
    function up(e:PointerEvent){if(drag&&moved<6){const country=pick(e);if(country){choose.current(country);paint();}}drag=false;}
    function leave(){if(!drag){hovered='';setHover('');paint();}}
    function resize(){const w=container!.clientWidth,h=container!.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
    const ro=new ResizeObserver(resize);ro.observe(container);resize();
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function animate(){if(disposed)return;frame=requestAnimationFrame(animate);
     if(previousSelection!==selection.current){previousSelection=selection.current;const c=centers[selection.current];if(c)globe.rotation.set(c[1]*Math.PI/180,-Math.PI/2-c[0]*Math.PI/180,0);paint();}
     if(!pause.current&&!drag&&!hovered&&!selection.current&&!reduced)globe.rotation.y+=.0015;
     renderer.render(scene,camera);
    }
    controls.current={zoom:n=>{camera.position.z=THREE.MathUtils.clamp(camera.position.z+n,3.5,6);},reset:()=>{camera.position.z=4.6;globe.rotation.set(.25,-Math.PI/2-.18,0);}};
    renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',()=>{drag=false;});renderer.domElement.addEventListener('pointerleave',leave);
    paint();animate();
    cleanup=()=>{ro.disconnect();cancelAnimationFrame(frame);renderer.dispose();globe.geometry.dispose();material.dispose();texture.dispose();atmosphere.geometry.dispose();(atmosphere.material as THREE.Material).dispose();renderer.domElement.remove();};
   }catch{console.info('Using the canvas globe renderer');for(const c of countries)if(c.properties.name==='United States of America')c.properties.name='United States';startCanvas();}
  }
  void setup();return()=>{disposed=true;cleanup();};
 },[]);
 return <div className="globe-interactive">
  <div className="globe-canvas" ref={mount} role="img" aria-label="Interactive 3D Earth. Drag to rotate and click a country. Use the destination selector below for keyboard access." />
  {failed&&<div className="globe-fallback">The 3D globe is unavailable on this device. Choose a destination below to explore scholarships.</div>}
  <div className="globe-hover" aria-live="polite">{hover||selected||'A world of possibilities'}</div>
  <div className="globe-controls"><button aria-label="Zoom in" onClick={()=>controls.current.zoom(-.35)}><Plus size={16}/></button><button aria-label="Zoom out" onClick={()=>controls.current.zoom(.35)}><Minus size={16}/></button><button aria-label="Reset globe view" onClick={()=>controls.current.reset()}><RotateCcw size={15}/></button><button aria-label={paused?'Resume globe rotation':'Pause globe rotation'} onClick={()=>setPaused(!paused)}>{paused?<Play size={15}/>:<Pause size={15}/>}</button></div>
 </div>;
}
