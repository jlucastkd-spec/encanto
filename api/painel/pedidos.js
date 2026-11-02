// Painel do dono (protegido por senha).
// GET   /api/painel/pedidos                → lista pedidos (mais recentes primeiro)
// PATCH /api/painel/pedidos  {id, status}  → muda o status de um pedido

import { send, readBody, requireAdmin } from "../../lib/http.js";
import { listar, atualizarStatus } from "../../lib/pedidos.js";
import { storageMode } from "../../lib/store.js";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  try {
    if (req.method === "GET") {
      return send(res, 200, { pedidos: await listar(), armazenamento: storageMode });
    }
    if (req.method === "PATCH") {
      const { id, status } = await readBody(req);
      const p = await atualizarStatus(id, status);
      if (!p) return send(res, 404, { erro: "Pedido não encontrado." });
      return send(res, 200, { pedido: p });
    }
    return send(res, 405, { erro: "Método não permitido." });
  } catch (e) {
    if (e.status) return send(res, e.status, { erro: e.message });
    console.error(e);
    return send(res, 500, { erro: "Erro ao acessar os pedidos." });
  }
}
