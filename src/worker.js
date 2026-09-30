const schemes = [
  ["analog", [-28, 0, 28]],
  ["complement", [0, 18, 180]],
  ["mono-accent", [0, 0, 180]],
  ["warm-accent", [0, 24, 150]],
  ["cold-accent", [0, -24, 210]],
  ["split", [0, 150, 210]],
  ["mono", [0, 0, 0]],
  ["triad", [0, 120, 240]],
];

const tones = ["muted", "normal", "vivid"];
const toneConfig = {
  muted: [[38, 50, 58], [34, 52, 64]],
  normal: [[58, 70, 76], [36, 56, 66]],
  vivid: [[76, 88, 92], [38, 58, 68]],
};

const modulo = (number, divisor) => ((number % divisor) + divisor) % divisor;
const hsl = (hue, saturation, lightness) =>
  `hsl(${modulo(Math.round(hue), 360)} ${saturation}% ${lightness}%)`;

function hash32(value) {
  let hash = 2166136261 >>> 0;

  for (const byte of new TextEncoder().encode(value)) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619) >>> 0;
  }

  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  hash ^= hash >>> 16;

  return hash >>> 0;
}

function palette(hash) {
  const [scheme, offsets] = schemes[hash % schemes.length];
  const tone = tones[(hash >>> 5) % tones.length];
  const hue = (hash >>> 10) % 360;
  const [saturation, lightness] = toneConfig[tone];
  const background = hsl(hue, tone === "vivid" ? 30 : 20, tone === "muted" ? 8 : 7);

  if (scheme === "mono-accent") {
    return {
      background,
      base: hsl(hue, 18, 42),
      frame: hsl(hue, 10, 68),
      core: hsl(hue + 180, saturation[2], lightness[2]),
    };
  }

  if (scheme === "mono") {
    return {
      background,
      base: hsl(hue, saturation[0], 32),
      frame: hsl(hue, saturation[1], 52),
      core: hsl(hue, saturation[2], 72),
    };
  }

  const hues = offsets.map((offset) => modulo(hue + offset, 360));
  return {
    background,
    base: hsl(hues[0], saturation[0], lightness[0]),
    frame: hsl(hues[1], saturation[1], lightness[1]),
    core: hsl(hues[2], saturation[2], lightness[2]),
  };
}

async function readAsset(env, requestUrl, path) {
  const response = await env.ASSETS.fetch(new URL(path, requestUrl));

  if (!response.ok) {
    throw new Error(`Unable to read asset ${path}: ${response.status}`);
  }

  return response.text();
}

function svgContent(source) {
  return source
    .replace(/^\s*(?:<\?xml[^>]*>\s*)?<svg\b[^>]*>/i, "")
    .replace(/<\/svg>\s*$/i, "");
}

function layer(source, color, name) {
  const content = svgContent(source).replaceAll("#fff", "currentColor");
  return `<g data-layer="${name}" color="${color}" style="color:${color}">${content}</g>`;
}

function avatarRequest(pathname) {
  const match = pathname.match(/^\/api\/avatar(?:\/([^/]+))?$/);

  if (!match) {
    return null;
  }

  const encodedSeed = match[1]?.replace(/\.svg$/i, "");
  return encodedSeed === undefined ? undefined : decodeURIComponent(encodedSeed);
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[char]);
}

function avatarSize(value) {
  const requested = Number(value);
  const size = Number.isFinite(requested) && requested !== 0 ? requested : 512;
  return Math.max(16, Math.min(2048, Math.trunc(size)));
}

function epicTrait(seed) {
  const traitHash = hash32(`epic:${seed}`);
  if (traitHash % 100 !== 0) return null;
  return ["distortion", "glitch", "dislocation"][(traitHash >>> 8) % 3];
}

function epicDefs() {
  return '<defs><filter id="epic-distortion" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".015 .055" numOctaves="1" seed="17" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="18" xChannelSelector="R" yChannelSelector="G"/></filter><clipPath id="epic-up"><path d="M-80-80h680v285L-60 430z"/></clipPath><clipPath id="epic-down"><path d="M-60 430L590 205v390H-60z"/></clipPath></defs>';
}

function applyEpic(body, trait, seed) {
  if (!trait) return body;
  const content = body.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  if (trait === "distortion") {
    return body.replace(">", `>${epicDefs()}<g filter="url(#epic-distortion)">`).replace("</svg>", "</g></svg>");
  }
  if (trait === "glitch") {
    const h = hash32(`glitch:${seed}`);
    const ys = [58, 112, 178, 235, 306, 370, 434];
    const clips = ys.map((y,i)=>`<clipPath id="eg${i}"><rect y="${y}" width="512" height="${16+((h >>> (i*3))&31)}"/></clipPath>`).join("");
    const slices = ys.map((_,i)=>{let dx=((h >>> (i*4))&63)-31;if(Math.abs(dx)<10)dx+=dx<0?-12:12;return `<g clip-path="url(#eg${i})" transform="translate(${dx} 0)">${content}</g>`}).join("");
    return body.replace(">", `><defs>${clips}</defs>`).replace("</svg>", `${slices}</svg>`);
  }
  const h = hash32(`dislocation:${seed}`);
  let angle = 10 + (h % 21);
  if ((h & 1) === 0) angle = -angle;
  const shift = 10 + ((h >>> 8) % 14);
  const rad = angle * Math.PI / 180, dx = Math.cos(rad)*700, dy = Math.sin(rad)*700;
  const x1=256-dx, y1=256-dy, x2=256+dx, y2=256+dy;
  const nx=-Math.sin(rad)*900, ny=Math.cos(rad)*900;
  const p1=`${x1+nx},${y1+ny} ${x2+nx},${y2+ny} ${x2},${y2} ${x1},${y1}`;
  const p2=`${x1},${y1} ${x2},${y2} ${x2-nx},${y2-ny} ${x1-nx},${y1-ny}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs><clipPath id="du"><polygon points="${p1}"/></clipPath><clipPath id="dd"><polygon points="${p2}"/></clipPath></defs><rect width="512" height="512" fill="#081723"/><g clip-path="url(#du)" transform="translate(${-shift/2} ${-shift/3})">${content}</g><g clip-path="url(#dd)" transform="translate(${shift/2} ${shift/3})">${content}</g></svg>`;
}

async function renderAvatar(env, requestUrl, manifest, seed, size) {
  const hash = hash32(seed);
  const { assets } = manifest;
  const colors = palette(hash);
  const pick = (items, value) => items[value % items.length];
  const base = pick(assets.bases, hash);
  const frame = pick(assets.frames, hash >>> 8);
  const core = pick(assets.cores, hash >>> 16);
  const [baseSvg, frameSvg, coreSvg] = await Promise.all([
    readAsset(env, requestUrl, `/assets-svg/bases/${base}.svg`),
    readAsset(env, requestUrl, `/assets-svg/frames/${frame}.svg`),
    readAsset(env, requestUrl, `/assets-svg/cores/${core}.svg`),
  ]);
  const regular = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512" role="img" aria-label="Generated avatar">`,
    `<rect data-layer="background" width="512" height="512" fill="${colors.background}"/>`,
    layer(baseSvg, colors.base, "base"),
    layer(frameSvg, colors.frame, "frame"),
    layer(coreSvg, colors.core, "core"),
    "</svg>",
  ].join("");
  const trait = epicTrait(seed);
  return { svg: applyEpic(regular, trait, seed), trait };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/avatars") {
      const seeds = url.searchParams.getAll("seed").slice(0, 64);
      if (!seeds.length) return new Response("At least one seed is required", { status: 400 });
      const size = avatarSize(url.searchParams.get("size"));
      const manifest = JSON.parse(await readAsset(env, request.url, "/assets-svg/manifest.json"));
      const avatars = await Promise.all(seeds.map(async seed => ({
        seed,
        ...await renderAvatar(env, request.url, manifest, seed, size),
      })));
      return Response.json({ size, avatars }, {
        headers: { "Cache-Control": "no-store" },
      });
    }

    const pathSeed = avatarRequest(url.pathname);

    if (pathSeed === null) {
      if (url.pathname === "/") {
        return env.ASSETS.fetch(new Request(new URL("/demo", url), request));
      }

      return env.ASSETS.fetch(request);
    }

    const seed = pathSeed || url.searchParams.get("seed") || "avatar";
    const size = avatarSize(url.searchParams.get("size"));
    const manifest = JSON.parse(
      await readAsset(env, request.url, "/assets-svg/manifest.json"),
    );
    const rendered = await renderAvatar(env, request.url, manifest, seed, size);
    const body = rendered.svg;

    return new Response(body, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  },
};
