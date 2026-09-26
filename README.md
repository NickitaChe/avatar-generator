# Avatar Generator

MVP layered avatar generator.

## Run locally

```bash
npm start
```

Open: http://localhost:8787/demo.html

## Current composition

- 10 base assets
- 24 frame/ornament assets
- 35 core assets
- green-screen pixels are recolored deterministically per layer
- black background in frame/core sheets is keyed out client-side
- demo renders 8 seeds at 512 / 256 / 128 / 64 / 32

## API stub

```
GET /api/avatar?seed=hello&size=128
```

For now it returns metadata + demo URL. The actual image composition lives in the browser demo so we can iterate on art quickly before freezing the production renderer.

## Cloudflare

Static files are isolated in `public/` and a minimal `wrangler.toml` is included. The Node server is only for local development.
