// Notificações no celular do dono (Web Push, padrão aberto dos navegadores).
// Chaves VAPID: gere uma vez com `npm run chaves` e salve nas variáveis de ambiente.

import { createHash } from "node:crypto";
import { saveJSON, listPaths, readJSON, remove } from "./store.js";

let wp;
async function webpush() {
  if (wp) return wp;
  const pub = process.env.VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return null;
  wp = (await import("web-push")).default;
  wp.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:contato@example.com", pub, priv);
  return wp;
}

const subPath = endpoint => `inscricoes/${createHash("sha256").update(endpoint).digest("hex").slice(0, 32)}.json`;

export async function saveSubscription(sub, aparelho = "") {
  await saveJSON(subPath(sub.endpoint), { sub, aparelho: String(aparelho).slice(0, 80), criadoEm: new Date().toISOString() });
}

export async function removeSubscription(endpoint) {
  await remove(subPath(endpoint));
}

export async function countSubscriptions() {
  return (await listPaths("inscricoes/")).length;
}

/** Envia para todos os aparelhos inscritos; remove inscrições expiradas. */
export async function notifyAll(payload) {
  const w = await webpush();
  if (!w) return { enviados: 0, motivo: "VAPID não configurado" };
  const paths = await listPaths("inscricoes/");
  let enviados = 0;
  await Promise.all(paths.map(async p => {
    const rec = await readJSON(p);
    if (!rec?.sub) return;
    try {
      await w.sendNotification(rec.sub, JSON.stringify(payload), { TTL: 60 * 60 * 24, urgency: "high" });
      enviados++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) await remove(p);
      else console.error("push falhou", e.statusCode, e.body);
    }
  }));
  return { enviados };
}
