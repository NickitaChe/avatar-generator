const hero=document.querySelector("#hero"),gallery=document.querySelector("#gallery"),endpoint=document.querySelector("#endpoint"),traitsRoot=document.querySelector("#traits");
const makeSeed=()=>crypto.randomUUID().replaceAll("-","").slice(0,12);
const svgUrl=svg=>"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
async function batch(seeds,size=512,trait=null){const q=new URLSearchParams({size:String(size)});seeds.forEach(s=>q.append("seed",s));if(trait)q.set("trait",trait);const r=await fetch("/api/avatars?"+q);if(!r.ok)throw new Error("Batch avatar request failed");return r.json()}
function tile(item,heroMode=false){const d=document.createElement("div");d.className=heroMode?"hero-avatar":"card";const img=new Image();img.src=svgUrl(item.svg);img.alt=`Generated avatar for ${item.seed}`;const s=document.createElement(heroMode?"div":"span");s.className=heroMode?"seed":"";s.textContent=item.seed;d.append(img,s);if(item.trait){d.dataset.epic=item.trait;const badge=document.createElement("b");badge.className="epic-badge";badge.textContent=`EPIC · ${item.trait}`;d.append(badge)}return d}
async function populate(){
 hero.replaceChildren();gallery.replaceChildren();
 const seeds=Array.from({length:16},makeSeed);
 const data=await batch(seeds);
 data.avatars.slice(0,4).forEach(a=>hero.append(tile(a,true)));
 data.avatars.forEach(a=>gallery.append(tile(a)));
 const example=seeds[0];endpoint.textContent=`${location.origin}/api/avatar/${example}.svg?size=512`;
 document.querySelector("#copy").onclick=async()=>{await navigator.clipboard.writeText(endpoint.textContent);document.querySelector("#copy").textContent="Copied ✓";setTimeout(()=>document.querySelector("#copy").textContent="Copy example URL",1200)};
}
async function renderTraits(){
 traitsRoot.replaceChildren();
 const specimen="c819417def55";
 const variants=["distortion","glitch","dislocation"];
 const results=await Promise.all(variants.map(trait=>batch([specimen],512,trait)));
 for(let i=0;i<variants.length;i++){
   const item=results[i].avatars[0];
   const card=document.createElement("article");card.className="trait";
   card.innerHTML=`<div class="trait-stage">${item.svg}</div><div class="trait-meta"><span>${specimen}</span><span class="epic">${variants[i]}</span></div>`;
   traitsRoot.append(card);
 }
}
document.querySelector("#reroll").addEventListener("click",populate);
await Promise.all([populate(),renderTraits()]);
