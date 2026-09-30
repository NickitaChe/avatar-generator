const hero=document.querySelector("#hero"),gallery=document.querySelector("#gallery"),endpoint=document.querySelector("#endpoint"),traitsRoot=document.querySelector("#traits");
const makeSeed=()=>crypto.randomUUID().replaceAll("-","").slice(0,12);
const svgUrl=svg=>"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
async function batch(seeds,size=512){const q=new URLSearchParams({size:String(size)});seeds.forEach(s=>q.append("seed",s));const r=await fetch("/api/avatars?"+q);if(!r.ok)throw new Error("Batch avatar request failed");return r.json()}
function tile(item,heroMode=false){const d=document.createElement("div");d.className=heroMode?"hero-avatar":"card";const img=new Image();img.src=svgUrl(item.svg);img.alt=`Generated avatar for ${item.seed}`;const s=document.createElement(heroMode?"div":"span");s.className=heroMode?"seed":"";s.textContent=item.seed;d.append(img,s);return d}
const traitDefs=[
 ["None","common",""],
 ["Satellite","common",'<circle cx="398" cy="128" r="18" fill="#ffd36a"/><circle cx="256" cy="256" r="205" fill="none" stroke="#ffd36a" stroke-width="5" stroke-dasharray="120 900"/>'],
 ["Halo","rare",'<circle cx="256" cy="256" r="207" fill="none" stroke="#ffd36a" stroke-width="9" stroke-dasharray="490 110" transform="rotate(-35 256 256)"/>'],
 ["Signal","rare",'<path d="M365 112q75 28 91 105M381 80q101 36 123 139" fill="none" stroke="#58e0d1" stroke-width="9" stroke-linecap="round"/>'],
 ["Slash","rare",'<path d="M105 420L411 92" stroke="#ff655d" stroke-width="18" stroke-linecap="round"/>'],
 ["Comet","rare",'<path d="M102 370Q190 300 349 127" fill="none" stroke="#ffd36a" stroke-width="11"/><path d="M350 127l12 24 27 4-20 19 5 27-24-13-24 13 5-27-20-19 27-4z" fill="#ffd36a"/>'],
 ["Runes","rare",'<g fill="none" stroke="#58e0d1" stroke-width="7"><path d="M256 35l13 21-13 21-13-21z"/><path d="M477 256l-21 13-21-13 21-13z"/><path d="M256 477l-13-21 13-21 13 21z"/><path d="M35 256l21-13 21 13-21 13z"/></g>'],
 ["Glitch","epic",'<g><path d="M86 171h186M315 171h110M54 213h110M218 213h244M92 291h245M377 291h81" stroke="#d65cff" stroke-width="12"/><path d="M109 191h85M347 191h96M72 316h102M307 316h108" stroke="#45e6df" stroke-width="5"/></g>'],
 ["Crown","epic",'<path d="M193 91l30 34 33-72 33 72 30-34 21 91H172z" fill="#ffd36a" stroke="#ffe6a2" stroke-width="6"/>'],
 ["Fracture","epic",'<path d="M333 77l-46 104 30 27-55 91 22 23-65 116" fill="none" stroke="#ffd8a8" stroke-width="12"/>'],
 ["Duo","legendary",'<circle cx="256" cy="256" r="207" fill="none" stroke="#ffd36a" stroke-width="8" stroke-dasharray="410 80 90 80"/><circle cx="399" cy="121" r="18" fill="#ffd36a"/>']
];
function withTrait(svg,trait){return svg.replace("</svg>",trait+"</svg>")}
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
 const seed="rare-traits-preview",data=await batch([seed]),base=data.avatars[0].svg;
 for(const [name,rarity,trait] of traitDefs){const card=document.createElement("article");card.className="trait";card.innerHTML=`<div class="trait-stage">${withTrait(base,trait)}</div><div class="trait-meta"><span>${name}</span><span class="${rarity}">${rarity}</span></div>`;traitsRoot.append(card)}
}
document.querySelector("#reroll").addEventListener("click",populate);
await Promise.all([populate(),renderTraits()]);
