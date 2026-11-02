// POST /api/pedido  → cliente envia um pedido pelo site
// GET  /api/pedido?id=...&codigo=...  → cliente acompanha o status do pedido

import { send, readBody, clientIp, rateLimited } from "../lib/http.js";
import { validar, criar, obter, brl } from "../lib/pedidos.js";
import { notifyAll } from "../lib/push.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const url = new URL(req.url, "http://x");
      const p = await obter(url.searchParams.get("id"));
      if (!p || p.codigo !== url.searchParams.get("codigo")) return send(res, 404, { erro: "Pedido não encontrado." });
      return send(res, 200, { status: p.status, codigo: p.codigo, atualizadoEm: p.historico?.at(-1)?.em });
    }

    if (req.method !== "POST") return send(res, 405, { erro: "Método não permitido." });

    if (rateLimited("pedido:" + clientIp(req), 6)) {
      return send(res, 429, { erro: "Muitos pedidos em sequência. Aguarde alguns minutos e tente de novo." });
    }

    const dados = validar(await readBody(req));
    const pedido = await criar(dados);

    const qtd = pedido.itens.reduce((n, i) => n + i.qtd, 0);
    const resumo = pedido.itens.slice(0, 3).map(i => `${i.qtd}× ${i.nome}`).join(", ") + (pedido.itens.length > 3 ? "…" : "");
    await notifyAll({
      title: `${pedido.teste ? "[TESTE] " : ""}Novo pedido #${pedido.codigo}`,
      body: `${pedido.cliente.nome} · ${qtd} ${qtd === 1 ? "item" : "itens"}${pedido.total !== null ? " · " + brl(pedido.total) : ""}\n${resumo}`,
      tag: pedido.id,
      url: `/painel/#${pedido.id}`,
    }).catch(e => console.error("falha ao notificar", e));

    return send(res, 201, { ok: true, id: pedido.id, codigo: pedido.codigo, total: pedido.total });
  } catch (e) {
    if (e instanceof SyntaxError) return send(res, 400, { erro: "Dados inválidos." });
    if (e.status) return send(res, e.status, { erro: e.message });
    console.error(e);
    return send(res, 500, { erro: "Não foi possível registrar o pedido agora. Tente novamente em instantes." });
  }
}
