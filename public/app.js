const sizes=[512,256,128,64,32];
const seeds=["alpha","bravo","charlie","delta","echo","foxtrot","golf","hotel"];
const GREEN={r:0x39,g:0xff,b:0x63};
const threshold=90;

function hash32(s){
  let h=2166136261>>>0;
  for(const ch of new TextEncoder().encode(s)){h^=ch;h=Math.imul(h,16777619)>>>0}
  h^=h>>>16; h=Math.imul(h,0x7feb352d); h^=h>>>15; h=Math.imul(h,0x846ca68b); h^=h>>>16;
  return h>>>0;
}
function colorFrom(n, offset){
  const hue=(n+offset*97)%360;
  return `hsl(${hue} 82% 58%)`;
}
async function loadImage(src){
  return await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src});
}
async function recolorGreen(img,color){
  const c=document.createElement("canvas"); c.width=512;c.height=512;
  const x=c.getContext("2d"); x.drawImage(img,0,0,512,512);
  const d=x.getImageData(0,0,512,512), rgb=color.match(/\d+/g)?.map(Number);
  const probe=document.createElement("canvas").getContext("2d");
  probe.fillStyle=color; probe.fillRect(0,0,1,1); const target=probe.getImageData(0,0,1,1).data;
  for(let i=0;i<d.data.length;i+=4){
    const r=d.data[i],g=d.data[i+1],b=d.data[i+2];
    const dist=Math.hypot(r-GREEN.r,g-GREEN.g,b-GREEN.b);
    if(dist<threshold && g>r*1.25 && g>b*1.25){
      d.data[i]=target[0];d.data[i+1]=target[1];d.data[i+2]=target[2];
    }
  }
  x.putImageData(d,0,0); return c;
}
function keyOutBlack(img){
  const c=document.createElement("canvas"); c.width=512;c.height=512;
  const x=c.getContext("2d");x.drawImage(img,0,0,512,512);
  const d=x.getImageData(0,0,512,512);
  for(let i=0;i<d.data.length;i+=4){
    const m=Math.max(d.data[i],d.data[i+1],d.data[i+2]);
    if(m<22)d.data[i+3]=0;
  }
  x.putImageData(d,0,0);return c;
}
async function render(seed,size){
  const h=hash32(seed);
  const base=((h>>>0)%10)+1;
  const frame=((h>>>8)%24)+1;
  const core=((h>>>16)%35)+1;
  const colors=[colorFrom(h,1),colorFrom(h>>>4,2),colorFrom(h>>>9,3)];

  const [b,f,c]=await Promise.all([
    loadImage(`/assets/bases/base-${String(base).padStart(2,"0")}.png`),
    loadImage(`/assets/frames/frame-${String(frame).padStart(2,"0")}.png`),
    loadImage(`/assets/cores/core-${String(core).padStart(2,"0")}.png`)
  ]);
  const frameLayer=keyOutBlack(await recolorGreen(f,colors[1]));
  const coreLayer=keyOutBlack(await recolorGreen(c,colors[2]));
  const baseLayer=await recolorGreen(b,colors[0]);

  const out=document.createElement("canvas"); out.width=size;out.height=size;
  const x=out.getContext("2d");x.imageSmoothingEnabled=true;x.imageSmoothingQuality="high";
  x.drawImage(baseLayer,0,0,size,size);
  x.drawImage(frameLayer,0,0,size,size);
  x.drawImage(coreLayer,0,0,size,size);
  return {out,meta:{base,frame,core,colors}};
}

const app=document.querySelector("#app");
for(const seed of seeds){
  const row=document.createElement("section");row.className="row";
  const title=document.createElement("div");title.style.minWidth="110px";
  title.innerHTML=`<strong>${seed}</strong><br><code>hash ${hash32(seed).toString(16).padStart(8,"0")}</code>`;
  row.append(title);
  for(const size of sizes){
    const wrap=document.createElement("div");wrap.className="item";
    const {out}=await render(seed,size);wrap.append(out);
    const label=document.createElement("code");label.textContent=`${size}×${size}`;wrap.append(label);
    row.append(wrap);
  }
  app.append(row);
}
