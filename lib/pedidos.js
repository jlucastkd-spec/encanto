// Regras dos pedidos: validação, cálculo do total, gravação e leitura.

import { randomBytes } from "node:crypto";
import { catalogo, loadConfig } from "./catalogo.js";
import { saveJSON, readJSON, listPaths } from "./store.js";

export const STATUS = ["novo", "confirmado", "preparando", "pronto", "concluido", "cancelado"];

const str = (v, max) => String(v ?? "").replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "").trim().slice(0, max);

class Invalido extends Error { constructor(m) { super(m); this.status = 400; } }

export function validar(input) {
  if (!input || typeof input !== "object") throw new Invalido("Dados do pedido ausentes.");
  if (input.empresa) throw new Invalido("Envio bloqueado."); // campo-isca anti-robô

  const cfg = loadConfig().pedidos || {};
  const cat = catalogo();

  const nome = str(input.nome, 80);
  if (nome.length < 2) throw new Invalido("Informe seu nome.");

  const telefone = str(input.telefone, 30);
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 13) throw new Invalido("Informe um telefone com DDD.");

  const modo = input.modo === "entrega" ? "entrega" : "retirada";
  if (modo === "entrega" && cfg.permitirEntrega === false) throw new Invalido("No momento não fazemos entregas.");
  if (modo === "retirada" && cfg.permitirRetirada === false) throw new Invalido("No momento não temos retirada.");

  const endereco = str(input.endereco, 240);
  if (modo === "entrega" && endereco.length < 8) throw new Invalido("Informe o endereço de entrega.");

  const quando = str(input.quando, 60);
  const observacoes = str(input.observacoes, 600);

  if (!Array.isArray(input.itens) || !input.itens.length) throw new Invalido("Seu carrinho está vazio.");
  if (input.itens.length > 40) throw new Invalido("Itens demais em um único pedido.");

  let total = 0, totalConhecido = true, teste = false;
  const itens = input.itens.map(it => {
    const p = cat.get(String(it?.id));
    if (!p) throw new Invalido("Um dos produtos não está mais disponível. Atualize a página.");
    if (p.disponivel === false) throw new Invalido(`"${p.nome}" está indisponível no momento.`);
    const qtd = Math.floor(Number(it.qtd));
    if (!(qtd >= 1 && qtd <= 99)) throw new Invalido("Quantidade inválida.");
    const precoUnit = typeof p.preco === "number" && isFinite(p.preco) ? p.preco : null;
    const subtotal = precoUnit === null ? null : Math.round(precoUnit * qtd * 100) / 100;
    if (subtotal === null) totalConhecido = false; else total += subtotal;
    if (p.teste) teste = true;
    return { id: String(p.id), nome: p.nome, unidade: p.unidade || "", qtd, precoUnit, subtotal };
  });

  return {
    cliente: { nome, telefone },
    modo, endereco: modo === "entrega" ? endereco : "",
    quando, observacoes, itens,
    total: totalConhecido ? Math.round(total * 100) / 100 : null,
    teste,
  };
}

const ALFA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I para não confundir
const codigo = () => Array.from(randomBytes(4), b => ALFA[b % ALFA.length]).join("");

export async function criar(dados) {
  const agora = new Date();
  const id = `${String(agora.getTime()).padStart(13, "0")}-${randomBytes(3).toString("hex")}`;
  const pedido = {
    id, codigo: codigo(), criadoEm: agora.toISOString(),
    status: "novo", historico: [{ status: "novo", em: agora.toISOString() }],
    ...dados,
  };
  await saveJSON(`pedidos/${id}.json`, pedido);
  return pedido;
}

const validId = id => /^\d{13}-[0-9a-f]{6}$/.test(String(id));

export async function obter(id) {
  if (!validId(id)) return null;
  return readJSON(`pedidos/${id}.json`);
}

export async function listar(limite = 150) {
  const paths = (await listPaths("pedidos/")).reverse().slice(0, limite);
  const itens = await Promise.all(paths.map(p => readJSON(p).catch(() => null)));
  return itens.filter(Boolean);
}

export async function atualizarStatus(id, status) {
  if (!STATUS.includes(status)) throw new Invalido("Status inválido.");
  const p = await obter(id);
  if (!p) return null;
  if (p.status !== status) {
    p.status = status;
    p.historico = [...(p.historico || []), { status, em: new Date().toISOString() }];
    await saveJSON(`pedidos/${id}.json`, p);
  }
  return p;
}

export const brl = v => typeof v === "number" ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "";
