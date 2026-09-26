const sizes=[512,256,128,64,32];
const seeds=["alpha","bravo","charlie","delta","echo","foxtrot","golf","hotel"];

function hash32(s){
  let h=2166136261>>>0;
  for(const ch of new TextEncoder().encode(s)){h^=ch;h=Math.imul(h,16777619)>>>0}
  h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;
  return h>>>0;
}
function colorFrom(n,offset){return `hsl(${(n+offset*137)%360} 82% 58%)`}
function loadImage(src){return new Promise((ok,fail)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=fail;i.src=src})}
function id(prefix,n){return `${prefix}-${String(n).padStart(2,"0")}`}

async function tintMask(mask,color){
  const c=document.createElement("canvas");c.width=c.height=512;
  const x=c.getContext("2d");x.fillStyle=color;x.fillRect(0,0,512,512);
  x.globalCompositeOperation="destination-in";x.drawImage(mask,0,0);
  return c;
}
async function loadLayer(folder,name,color){
  const [art,effect]=await Promise.all([
    loadImage(`/assets/${folder}/${name}-art.png`),
    loadImage(`/assets/${folder}/${name}-effect.png`)
  ]);
  return {art,effect:await tintMask(effect,color)};
}
async function descriptor(seed){
  const h=hash32(seed);
  return {
    base:id("base",(h%10)+1),
    frame:id("frame",((h>>>8)%24)+1),
    core:id("core",((h>>>16)%35)+1),
    colors:[colorFrom(h,1),colorFrom(h>>>4,2),colorFrom(h>>>9,3)]
  };
}
async function render(seed,size){
  const d=await descriptor(seed);
  const [base,frame,core]=await Promise.all([
    loadLayer("bases",d.base,d.colors[0]),
    loadLayer("frames",d.frame,d.colors[1]),
    loadLayer("cores",d.core,d.colors[2])
  ]);
  const out=document.createElement("canvas");out.width=out.height=size;
  const x=out.getContext("2d");x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
  for(const l of [base,frame,core]){
    x.drawImage(l.art,0,0,size,size);
    x.drawImage(l.effect,0,0,size,size);
  }
  return {out,d};
}
const app=document.querySelector("#app");
for(const seed of seeds){
  const row=document.createElement("section");row.className="row";
  const d=await descriptor(seed);
  const title=document.createElement("div");title.style.minWidth="150px";
  title.innerHTML=`<strong>${seed}</strong><br><code>${d.base}<br>${d.frame}<br>${d.core}</code>`;
  row.append(title);
  for(const size of sizes){
    const wrap=document.createElement("div");wrap.className="item";
    const {out}=await render(seed,size);wrap.append(out);
    const label=document.createElement("code");label.textContent=`${size}×${size}`;wrap.append(label);
    row.append(wrap);
  }
  app.append(row);
}
