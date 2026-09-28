# Avatar Generator

Avatar Generator is a Cloudflare Worker that turns any seed into a deterministic, layered SVG avatar. Each response is one self-contained SVG document composed from a generated background color and selected base, frame, and core layers. The browser does not need to load the layer assets separately.

The included public demo uses the same API and is intended to run at [avatars.nickitache.com](https://avatars.nickitache.com).

## Local development

Requires Node.js 20 or newer.

```bash
npx wrangler dev
```

Open the local URL printed by Wrangler, normally `http://localhost:8787/`.

## API

```text
GET /api/avatar/NickitaChe.svg
GET /api/avatar/NickitaChe.svg?size=128
```

The seed may contain Unicode characters. The optional `size` parameter controls the SVG's rendered width and height and is clamped to the supported range of 16 through 2048 pixels. If omitted, it defaults to 512.

Use an avatar directly in HTML:

```html
<img
  src="https://avatars.nickitache.com/api/avatar/NickitaChe.svg?size=128"
  width="128"
  height="128"
  alt="NickitaChe avatar"
>
```

The same seed always produces the same palette and combination of base, frame, and core assets. Similar seed strings are mixed by the hash avalanche step, so a small text change will generally produce a substantially different avatar.

## Deployment

After local verification, deploy the Worker and the static files in `public/` with:

```bash
npx wrangler deploy
```

The production domain is intended to be `https://avatars.nickitache.com`. Domain and DNS configuration are managed separately from this repository.

## License

This project is available for non-commercial use under the PolyForm Noncommercial License 1.0.0. The required attribution is Copyright 2026 NickitaChe. See [LICENSE](LICENSE) for the full notice and official license terms.
