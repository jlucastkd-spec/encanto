// Lê o MESMO js/config.js usado pelo site, para que o servidor confira
// nomes, preços e disponibilidade dos produtos (o cliente não consegue
// alterar preços pelo navegador).

import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

let cache;
export function loadConfig() {
  if (cache) return cache;
  const code = readFileSync(path.join(process.cwd(), "js/config.js"), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox, { timeout: 500 });
  cache = sandbox.window.ENCANTO_CONFIG || {};
  return cache;
}

/** Produtos aceitos em pedidos. Em modo de desenvolvimento, aceita os cards de exemplo. */
export function catalogo() {
  const cfg = loadConfig();
  const reais = (cfg.produtos || []).filter(p => p && p.id && p.nome);
  const map = new Map(reais.map(p => [String(p.id), { ...p, teste: false }]));
  if (cfg.modoDesenvolvimento && !reais.length) {
    for (let i = 1; i <= 6; i++) {
      map.set(`exemplo-${i}`, { id: `exemplo-${i}`, nome: `Produto ${i} (exemplo)`, preco: null, teste: true });
    }
  }
  return map;
}
