const hero=document.querySelector("#hero"),gallery=document.querySelector("#gallery"),endpoint=document.querySelector("#endpoint"),traitsRoot=document.querySelector("#traits");
const makeSeed=()=>crypto.randomUUID().replaceAll("-","").slice(0,12);
const svgUrl=svg=>"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
async function batch(seeds,size=512){const q=new URLSearchParams({size:String(size)});seeds.forEach(s=>q.append("seed",s));const r=await fetch("/api/avatars?"+q);if(!r.ok)throw new Error("Batch avatar request failed");return r.json()}
function tile(item,heroMode=false){const d=document.createElement("div");d.className=heroMode?"hero-avatar":"card";const img=new Image();img.src=svgUrl(item.svg);img.alt=`Generated avatar for ${item.seed}`;const s=document.createElement(heroMode?"div":"span");s.className=heroMode?"seed":"";s.textContent=item.seed;d.append(img,s);return d}
const traitDefs=[
 ["None","common",svg=>svg],
 ["Satellite","rare",svg=>svg.replace("</svg>",'<ellipse cx="256" cy="256" rx="224" ry="112" transform="rotate(-29 256 256)" fill="none" stroke="#6bb7c4" stroke-width="4" opacity=".4" stroke-dasharray="370 110"/><g transform="translate(387 105) rotate(18)"><rect x="-14" y="-14" width="28" height="28" rx="5" fill="#102b3a" stroke="#ffd36a" stroke-width="6"/><path d="M-45-11h25v22h-25zM20-11h25v22H20z" fill="#57b8c5" stroke="#a8e5e4" stroke-width="4"/><circle r="5" fill="#fff0b0"/></g></svg>')],
 ["Comet Trail","rare",svg=>svg.replace("</svg>",'<g fill="none" stroke-linecap="round"><path d="M8 451Q142 383 323 189" stroke="#55c4c9" stroke-width="36" opacity=".14"/><path d="M18 430Q153 361 338 171" stroke="#ffd36a" stroke-width="15"/><path d="M36 458Q169 393 315 223" stroke="#ff8e72" stroke-width="8"/><path d="M73 470Q188 410 286 284" stroke="#55c4c9" stroke-width="5"/></g></svg>')],
 ["Halo","rare",svg=>svg.replace("</svg>",'<circle cx="256" cy="256" r="207" fill="none" stroke="#ffd36a" stroke-width="9" stroke-dasharray="490 110" transform="rotate(-35 256 256)"/></svg>')],
 ["Runes","rare",svg=>svg.replace("</svg>",'<g fill="none" stroke="#58e0d1" stroke-width="7"><path d="M256 35l13 21-13 21-13-21z"/><path d="M477 256l-21 13-21-13 21-13z"/><path d="M256 477l-13-21 13-21 13 21z"/><path d="M35 256l21-13 21 13-21 13z"/></g></svg>')],
 ["Distortion","epic",svg=>svg.replace("<svg ",`<svg `).replace("</svg>",'<defs><filter id="distort"><feTurbulence type="fractalNoise" baseFrequency=".015 .055" numOctaves="1" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="15" xChannelSelector="R" yChannelSelector="G"/></filter></defs><g filter="url(#distort)"></g></svg>').replace(/(<rect data-layer="background"[^>]*\/>)/,'$1<g filter="url(#distort)">').replace("</svg>","</g></svg>")],
 ["Glitch","epic",svg=>{const inner=svg.replace(/^<svg[^>]*>/,"").replace("</svg>","");return svg.replace("</svg>",`<defs><clipPath id="g1"><rect y="72" width="512" height="24"/></clipPath><clipPath id="g2"><rect y="127" width="512" height="42"/></clipPath><clipPath id="g3"><rect y="194" width="512" height="18"/></clipPath><clipPath id="g4"><rect y="242" width="512" height="49"/></clipPath><clipPath id="g5"><rect y="319" width="512" height="27"/></clipPath><clipPath id="g6"><rect y="374" width="512" height="39"/></clipPath><clipPath id="g7"><rect y="438" width="512" height="20"/></clipPath></defs><g opacity=".96"><g clip-path="url(#g1)" transform="translate(11 0)">${inner}</g><g clip-path="url(#g2)" transform="translate(24 0)">${inner}</g><g clip-path="url(#g3)" transform="translate(-17 0)">${inner}</g><g clip-path="url(#g4)" transform="translate(31 0)">${inner}</g><g clip-path="url(#g5)" transform="translate(-13 0)">${inner}</g><g clip-path="url(#g6)" transform="translate(-26 0)">${inner}</g><g clip-path="url(#g7)" transform="translate(16 0)">${inner}</g></g></svg>`)}],
 ["Dislocation","epic",svg=>{const inner=svg.replace(/^<svg[^>]*>/,"").replace("</svg>","");return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><clipPath id="up"><path d="M-30-30h572v285L-30 420z"/></clipPath><clipPath id="down"><path d="M-30 420L542 255v287H-30z"/></clipPath></defs><rect width="512" height="512" fill="#081723"/><g clip-path="url(#up)" transform="translate(-12 -5) rotate(-2 256 256)">${inner}</g><g clip-path="url(#down)" transform="translate(15 9) rotate(2 256 256)">${inner}</g></svg>`}]
];

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
 for(const [name,rarity,apply] of traitDefs){const card=document.createElement("article");card.className="trait";card.innerHTML=`<div class="trait-stage">${apply(base)}</div><div class="trait-meta"><span>${name}</span><span class="${rarity}">${rarity}</span></div>`;traitsRoot.append(card)}
}
document.querySelector("#reroll").addEventListener("click",populate);
await Promise.all([populate(),renderTraits()]);
