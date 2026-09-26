const sizes=[512,256,128,64,32],seeds=["alpha","bravo","charlie","delta","echo","foxtrot","golf","hotel"];
const names={"bases": ["clock", "compass", "globe", "astrolabe", "hexagon", "radar", "crossgrid", "dotted", "eye", "rings", "diamond", "waves", "eclipse", "target", "petals", "spiral", "triangles", "square", "octagon", "hourglass", "maze", "circuit", "orbit", "sun", "moon", "shards", "fan", "topography", "split", "arches", "nodes", "runes"], "frames": ["cardinal", "broken-ring", "nodes", "vortex", "triangle", "square", "pentagon", "hexagon", "heptagon", "octagon", "nonagon", "decagon", "orbit-a", "orbit-b", "orbit-c", "orbit-d", "corner-a", "corner-b", "corner-c", "corner-d", "ticks-a", "ticks-b", "ticks-c", "ticks-d", "diamond-a", "diamond-b", "diamond-c", "diamond-d", "constellation", "chain", "shards", "brush"], "cores": ["target", "star", "diamond", "crosshair", "orb", "crescent", "sun", "triangle-eye", "hex-core", "yin-yang", "reticle", "spiral", "eye", "eclipse", "burst", "hub", "hourglass", "infinity", "cube", "flame", "bolt", "keyhole", "atom", "crown", "flower", "trident", "shield", "comet", "heart", "anchor", "crystal", "portal"]};
function hash32(s){let h=2166136261>>>0;for(const ch of new TextEncoder().encode(s)){h^=ch;h=Math.imul(h,16777619)>>>0}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0}
const color=(n,o)=>`hsl(${(n+o*137)%360} 82% 58%)`,load=s=>new Promise((ok,no)=>{const i=new Image;i.onload=()=>ok(i);i.onerror=no;i.src=s});
function tint(img,c){const o=document.createElement("canvas");o.width=o.height=512;const x=o.getContext("2d");x.drawImage(img,0,0);x.globalCompositeOperation="source-in";x.fillStyle=c;x.fillRect(0,0,512,512);return o}
function desc(seed){const h=hash32(seed);return{base:names.bases[h%32],frame:names.frames[(h>>>8)%32],core:names.cores[(h>>>16)%32],colors:[color(h,1),color(h>>>4,2),color(h>>>9,3)]}}
async function render(seed,size){const d=desc(seed),[b,f,c]=await Promise.all([load(`/assets-svg/bases/${d.base}.svg`),load(`/assets-svg/frames/${d.frame}.svg`),load(`/assets-svg/cores/${d.core}.svg`)]),o=document.createElement("canvas");o.width=o.height=size;const x=o.getContext("2d");x.fillStyle="#070a0e";x.fillRect(0,0,size,size);x.drawImage(tint(b,d.colors[0]),0,0,size,size);x.drawImage(tint(f,d.colors[1]),0,0,size,size);x.drawImage(tint(c,d.colors[2]),0,0,size,size);return{o,d}}
for(const seed of seeds){const row=document.createElement("section");row.className="row";const d=desc(seed),t=document.createElement("div");t.style.minWidth="160px";t.innerHTML=`<strong>${seed}</strong><br><code>${d.base}<br>${d.frame}<br>${d.core}</code>`;row.append(t);for(const size of sizes){const w=document.createElement("div");w.className="item";const{o}=await render(seed,size);w.append(o);const l=document.createElement("code");l.textContent=`${size}×${size}`;w.append(l);row.append(w)}app.append(row)}
const cat=document.querySelector("#catalog");for(const [folder,list] of Object.entries(names)){const h=document.createElement("h2");h.textContent=folder;cat.append(h);const g=document.createElement("div");g.className="catalog";for(const name of list){const d=document.createElement("div");d.className="asset";const i=document.createElement("img");i.src=`/assets-svg/${folder}/${name}.svg`;const c=document.createElement("code");c.textContent=name;d.append(i,c);g.append(d)}cat.append(g)}


const paletteSchemes=[
  {name:"analog",offsets:[-28,0,28],tones:["muted","normal","vivid"]},
  {name:"complement",offsets:[0,18,180],tones:["muted","normal","vivid"]},
  {name:"mono-accent",offsets:[0,0,180],tones:["muted","normal","vivid"]},
  {name:"warm-accent",offsets:[0,24,150],tones:["muted","normal","vivid"]},
  {name:"cold-accent",offsets:[0,-24,210],tones:["muted","normal","vivid"]},
  {name:"split",offsets:[0,150,210],tones:["muted","normal","vivid"]},
  {name:"mono",offsets:[0,0,0],tones:["muted","normal","vivid"]},
  {name:"triad",offsets:[0,120,240],tones:["muted","normal","vivid"]}
];
const toneSettings={
  muted:{sat:[38,50,58],light:[34,52,64]},
  normal:{sat:[58,70,76],light:[36,56,66]},
  vivid:{sat:[76,88,92],light:[38,58,68]}
};
const hueNames=["red","orange","amber","yellow","lime","green","emerald","teal","cyan","azure","blue","indigo","violet","purple","magenta","crimson"];
const mod=(n,m)=>((n%m)+m)%m;
const hsl=(h,s,l)=>`hsl(${mod(Math.round(h),360)} ${s}% ${l}%)`;
function paletteFor(hue,scheme,tone){
  const cfg=toneSettings[tone], hs=scheme.offsets.map(o=>mod(hue+o,360));
  const background=hsl(hue,tone==="vivid"?30:20,tone==="muted"?8:7);
  if(scheme.name==="mono-accent"){
    return {background,base:hsl(hue,18,42),frame:hsl(hue,10,68),core:hsl(hue+180,cfg.sat[2],cfg.light[2])};
  }
  if(scheme.name==="mono"){
    return {background,base:hsl(hue,cfg.sat[0],32),frame:hsl(hue,cfg.sat[1],52),core:hsl(hue,cfg.sat[2],72)};
  }
  return {background,base:hsl(hs[0],cfg.sat[0],cfg.light[0]),frame:hsl(hs[1],cfg.sat[1],cfg.light[1]),core:hsl(hs[2],cfg.sat[2],cfg.light[2])};
}
async function renderPaletteAvatar(images,palette){
  const o=document.createElement("canvas");o.width=o.height=256;const x=o.getContext("2d");
  x.fillStyle=palette.background;x.fillRect(0,0,256,256);
  x.drawImage(tint(images[0],palette.base),0,0,256,256);
  x.drawImage(tint(images[1],palette.frame),0,0,256,256);
  x.drawImage(tint(images[2],palette.core),0,0,256,256);
  return o;
}
const paletteRoot=document.querySelector("#palettes");
if(paletteRoot){
  const labGeometry={base:"astrolabe",frame:"broken-ring",core:"eye"};
  const labImages=await Promise.all([
    load(`/assets-svg/bases/${labGeometry.base}.svg`),
    load(`/assets-svg/frames/${labGeometry.frame}.svg`),
    load(`/assets-svg/cores/${labGeometry.core}.svg`)
  ]);
  for(const scheme of paletteSchemes){
    const section=document.createElement("section");section.className="palette-section";
    const heading=document.createElement("h2");heading.textContent=scheme.name;section.append(heading);
    const grid=document.createElement("div");grid.className="palette-grid";
    for(let i=0;i<12;i++){
      const hue=mod(i*30+hash32("palette-"+scheme.name)%30,360);
      const tone=scheme.tones[i%scheme.tones.length];
      const p=paletteFor(hue,scheme,tone);
      const card=document.createElement("div");card.className="palette-card";
      card.append(await renderPaletteAvatar(labImages,p));
      const sw=document.createElement("div");sw.className="swatches";
      for(const c of [p.background,p.base,p.frame,p.core]){const s=document.createElement("span");s.style.background=c;sw.append(s)}
      card.append(sw);
      const meta=document.createElement("code");meta.className="palette-meta";
      meta.textContent=`${tone} · ${hueNames[Math.floor(mod(hue+11.25,360)/22.5)%16]} · H${Math.round(hue)}`;
      card.append(meta);grid.append(card);
    }
    section.append(grid);paletteRoot.append(section);
  }
}
