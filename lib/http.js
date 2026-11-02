// Utilitários HTTP compartilhados pelas funções da pasta /api.
// Funciona tanto na Vercel (Node runtime) quanto no servidor local (dev-server.js).

import { timingSafeEqual, createHash } from "node:crypto";

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

export async function readBody(req, limit = 32 * 1024) {
  if (req.body !== undefined && req.body !== null && req.body !== "") {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  let size = 0;
  const chunks = [];
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw Object.assign(new Error("Pedido grande demais."), { status: 413 });
    chunks.push(c);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

/** Confere a senha do painel (cabeçalho Authorization: Bearer <senha>). */
export function isAdmin(req) {
  const senha = process.env.PAINEL_SENHA || "";
  if (senha.length < 8) return false; // sem senha configurada, o painel fica fechado
  const h = req.headers.authorization || "";
  const got = h.startsWith("Bearer ") ? h.slice(7) : "";
  const a = createHash("sha256").update(got).digest();
  const b = createHash("sha256").update(senha).digest();
  return timingSafeEqual(a, b);
}

export function requireAdmin(req, res) {
  if (!process.env.PAINEL_SENHA || process.env.PAINEL_SENHA.length < 8) {
    send(res, 503, { erro: "Painel sem senha configurada. Defina PAINEL_SENHA (mínimo 8 caracteres)." });
    return false;
  }
  if (!isAdmin(req)) {
    send(res, 401, { erro: "Senha incorreta." });
    return false;
  }
  return true;
}

export function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
}

// Limite simples por IP (melhor esforço: vale por instância da função).
const hits = new Map();
export function rateLimited(key, max = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}
