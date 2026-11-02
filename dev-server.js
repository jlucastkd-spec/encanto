// Servidor local para testar o site + pedidos + painel sem publicar.
// Uso: crie um arquivo .env (veja .env.example) e rode `npm run dev`.
import http from "node:http";
import { promises as fs, existsSync, readFileSync } from "node:fs";
import path from "node:path";

if (existsSync(".env")) for (const l of readFileSync(".env", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".json": "application/json", ".webmanifest": "application/manifest+json" };
const root = process.cwd();
const PORT = Number(process.env.PORT || 3000);

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname.startsWith("/api/")) {
      const file = path.join(root, url.pathname.replace(/\/$/, "") + ".js");
      if (!file.startsWith(path.join(root, "api")) || !existsSync(file)) { res.statusCode = 404; return res.end("{}"); }
      const mod = await import(file + "?t=" + Date.now());
      return mod.default(req, res);
    }
    let p = decodeURIComponent(url.pathname);
    if (p.endsWith("/")) p += "index.html";
    const file = path.join(root, p);
    const rel = file.slice(root.length);
    if (!file.startsWith(root) || /\/\./.test(rel) || /^\/(lib|api|node_modules|scripts)\//.test(rel + "/") || /^\/(package(-lock)?\.json|dev-server\.js)$/.test(rel)) { res.statusCode = 403; return res.end(); }
    const data = await fs.readFile(file);
    res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
    if (p === "/painel/sw.js") res.setHeader("Service-Worker-Allowed", "/painel/");
    res.end(data);
  } catch (e) {
    res.statusCode = e.code === "ENOENT" ? 404 : 500;
    res.end(e.code === "ENOENT" ? "Não encontrado" : "Erro");
    if (e.code !== "ENOENT") console.error(e);
  }
}).listen(PORT, () => console.log(`Encanto de Brownie em http://localhost:${PORT}  ·  painel: http://localhost:${PORT}/painel/`));
