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
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512" role="img" aria-label="Generated avatar">`,
    `<rect data-layer="background" width="512" height="512" fill="${colors.background}"/>`,
    layer(baseSvg, colors.base, "base"),
    layer(frameSvg, colors.frame, "frame"),
    layer(coreSvg, colors.core, "core"),
    "</svg>",
  ].join("");
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
        svg: await renderAvatar(env, request.url, manifest, seed, size),
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
    const body = await renderAvatar(env, request.url, manifest, seed, size);

    return new Response(body, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  },
};
