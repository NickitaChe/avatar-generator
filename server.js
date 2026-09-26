import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 8787);

const mime = {
  ".html":"text/html; charset=utf-8",
  ".js":"application/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".png":"image/png",
  ".svg":"image/svg+xml"
};

async function sendFile(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, {"Content-Type": mime[path.extname(filePath)] || "application/octet-stream"});
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/avatar") {
    const seed = url.searchParams.get("seed") || "avatar";
    const size = Number(url.searchParams.get("size") || 256);
    res.writeHead(200, {"Content-Type":"application/json; charset=utf-8"});
    res.end(JSON.stringify({ seed, size, renderUrl: `/demo.html?seed=${encodeURIComponent(seed)}` }));
    return;
  }

  const rel = url.pathname === "/" ? "demo.html" : url.pathname.replace(/^\//, "");
  const safe = path.normalize(rel).replace(/^\.\.(\/|\\|$)/, "");
  await sendFile(res, path.join(publicDir, safe));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`avatar-generator listening on http://localhost:${port}`);
});
