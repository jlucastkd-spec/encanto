// Notificações do painel.
// GET    /api/painel/notificacoes            → chave pública + nº de aparelhos (exige senha)
// POST   /api/painel/notificacoes {sub}      → cadastra este aparelho
// DELETE /api/painel/notificacoes {endpoint} → descadastra
// PUT    /api/painel/notificacoes            → envia uma notificação de teste

import { send, readBody, requireAdmin } from "../../lib/http.js";
import { saveSubscription, removeSubscription, countSubscriptions, notifyAll } from "../../lib/push.js";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  try {
    if (req.method === "GET") {
      return send(res, 200, {
        chavePublica: process.env.VAPID_PUBLIC_KEY || null,
        aparelhos: await countSubscriptions(),
      });
    }
    if (req.method === "POST") {
      const { sub, aparelho } = await readBody(req);
      if (!sub?.endpoint || !/^https:\/\//.test(sub.endpoint) || !sub.keys?.p256dh || !sub.keys?.auth) {
        return send(res, 400, { erro: "Inscrição inválida." });
      }
      await saveSubscription(sub, aparelho);
      return send(res, 201, { ok: true });
    }
    if (req.method === "DELETE") {
      const { endpoint } = await readBody(req);
      if (endpoint) await removeSubscription(endpoint);
      return send(res, 200, { ok: true });
    }
    if (req.method === "PUT") {
      const r = await notifyAll({ title: "Notificações ativadas ✓", body: "Os novos pedidos vão chegar assim no seu celular.", url: "/painel/" });
      return send(res, 200, r);
    }
    return send(res, 405, { erro: "Método não permitido." });
  } catch (e) {
    console.error(e);
    return send(res, 500, { erro: "Erro nas notificações." });
  }
}
