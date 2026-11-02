/* ==========================================================================
   ENCANTO DE BROWNIE — Carrinho e envio de pedidos
   Os pedidos vão para /api/pedido e aparecem no painel do dono (/painel/),
   que avisa no celular com uma notificação.
   ========================================================================== */
(() => {
  "use strict";
  const CFG = window.ENCANTO_CONFIG || {};
  const P = CFG.pedidos || {};
  if (!P.ativo) return;

  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const KEY = "encanto-carrinho";
  const LAST = "encanto-ultimo-pedido";

  // Catálogo: produtos reais ou, em desenvolvimento, os cards de exemplo
  const reais = (CFG.produtos || []).filter(p => p && p.id && p.nome);
  const catalogo = new Map(reais.map(p => [String(p.id), p]));
  if (!reais.length && CFG.modoDesenvolvimento) {
    for (let i = 1; i <= 6; i++) catalogo.set(`exemplo-${i}`, { id: `exemplo-${i}`, nome: `Produto ${i} (exemplo)`, preco: null });
  }

  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* */ } },
  };

  let cart = store.get(KEY, []).filter(i => catalogo.has(i.id));
  const save = () => { store.set(KEY, cart); render(); };

  const drawer = $("[data-cart]");
  const fab = $("[data-cart-fab]");
  if (!drawer || !fab) return;
  const list = $("[data-cart-list]", drawer);
  const form = $("[data-cart-form]", drawer);
  const views = { carrinho: $("[data-view=carrinho]", drawer), sucesso: $("[data-view=sucesso]", drawer) };

  /* ---------- abrir / fechar ---------- */
  let lastFocus;
  function open() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add("is-open"));
    document.body.style.overflow = "hidden";
    setTimeout(() => $(".cart__close", drawer).focus(), 50);
  }
  function close() {
    drawer.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(() => { drawer.hidden = true; lastFocus?.focus?.(); }, 450);
  }
  fab.addEventListener("click", open);
  drawer.addEventListener("click", e => { if (e.target.closest("[data-cart-close]")) close(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && !drawer.hidden) close(); });

  /* ---------- itens ---------- */
  function add(id, qtd = 1) {
    const p = catalogo.get(String(id));
    if (!p) return;
    const it = cart.find(i => i.id === p.id);
    if (it) it.qtd = Math.min(99, it.qtd + qtd); else cart.push({ id: p.id, qtd });
    showView("carrinho");
    save();
    fab.classList.remove("is-bump"); void fab.offsetWidth; fab.classList.add("is-bump");
  }

  list.addEventListener("click", e => {
    const b = e.target.closest("[data-q]");
    if (!b) return;
    const it = cart.find(i => i.id === b.closest("[data-id]").dataset.id);
    if (!it) return;
    if (b.dataset.q === "rm") cart = cart.filter(i => i !== it);
    else it.qtd = Math.max(0, Math.min(99, it.qtd + Number(b.dataset.q)));
    cart = cart.filter(i => i.qtd > 0);
    save();
  });

  function totals() {
    let total = 0, conhecido = true, qtd = 0;
    for (const it of cart) {
      const p = catalogo.get(it.id);
      qtd += it.qtd;
      if (typeof p.preco === "number") total += p.preco * it.qtd; else conhecido = false;
    }
    return { total, conhecido, qtd };
  }

  function render() {
    const { total, conhecido, qtd } = totals();
    fab.hidden = qtd === 0;
    $("[data-cart-count]", fab).textContent = qtd;
    fab.setAttribute("aria-label", `Ver pedido (${qtd} ${qtd === 1 ? "item" : "itens"})`);

    const empty = !cart.length;
    $("[data-cart-empty]", drawer).hidden = !empty;
    form.hidden = empty;

    list.innerHTML = cart.map(it => {
      const p = catalogo.get(it.id);
      const price = typeof p.preco === "number" ? brl(p.preco * it.qtd) : "";
      return `<li class="cart-item" data-id="${esc(it.id)}">
        <div class="cart-item__info">
          <strong>${esc(p.nome)}</strong>
          ${p.unidade ? `<small>${esc(p.unidade)}</small>` : ""}
        </div>
        <div class="qty" role="group" aria-label="Quantidade de ${esc(p.nome)}">
          <button type="button" data-q="-1" aria-label="Diminuir">−</button>
          <span aria-live="polite">${it.qtd}</span>
          <button type="button" data-q="1" aria-label="Aumentar">+</button>
        </div>
        <span class="cart-item__price">${price}</span>
        <button type="button" class="cart-item__rm" data-q="rm" aria-label="Remover ${esc(p.nome)}">×</button>
      </li>`;
    }).join("");

    $("[data-cart-total]", drawer).innerHTML = empty ? "" : conhecido
      ? `<span>Total</span><strong>${brl(total)}</strong>`
      : `<span>Total</span><strong class="is-muted">a confirmar pela doceria</strong>`;
  }

  /* ---------- entrega / retirada ---------- */
  const modos = [];
  if (P.permitirRetirada !== false) modos.push(["retirada", "Retirar"]);
  if (P.permitirEntrega !== false) modos.push(["entrega", "Entrega"]);
  const modoBox = $("[data-modos]", form);
  modoBox.innerHTML = modos.map(([v, l], i) =>
    `<label class="seg"><input type="radio" name="modo" value="${v}" ${i === 0 ? "checked" : ""}><span>${l}</span></label>`).join("");
  if (modos.length < 2) modoBox.closest(".field").hidden = true;
  const endereco = $("[data-endereco]", form);
  const syncModo = () => {
    const entrega = form.modo?.value === "entrega" || (modos.length === 1 && modos[0][0] === "entrega");
    endereco.hidden = !entrega;
    $("textarea", endereco).required = entrega;
  };
  form.addEventListener("change", e => e.target.name === "modo" && syncModo());
  if (P.avisoEntrega) $("[data-aviso-entrega]", form).textContent = P.avisoEntrega;
  syncModo();

  // Máscara simples de telefone
  form.telefone.addEventListener("input", e => {
    const d = e.target.value.replace(/\D/g, "").slice(0, 11);
    e.target.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`
      : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
  });

  /* ---------- envio ---------- */
  const errBox = $("[data-cart-error]", form);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    errBox.hidden = true;
    if (!form.reportValidity()) return;
    const btn = $("[type=submit]", form);
    btn.disabled = true; btn.classList.add("is-loading");
    const modo = form.modo?.value || modos[0]?.[0] || "retirada";
    const body = {
      itens: cart.map(i => ({ id: i.id, qtd: i.qtd })),
      nome: form.nome.value, telefone: form.telefone.value, modo,
      endereco: modo === "entrega" ? form.endereco.value : "",
      quando: form.quando.value, observacoes: form.observacoes.value,
      empresa: form.empresa.value,
    };
    try {
      const r = await fetch(P.endpoint || "/api/pedido", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.erro || "Não foi possível enviar agora.");
      store.set(LAST, { id: data.id, codigo: data.codigo, em: Date.now() });
      cart = []; save(); form.reset(); syncModo();
      showSuccess(data);
    } catch (err) {
      errBox.textContent = err.message === "Failed to fetch"
        ? "Sem conexão com o servidor de pedidos. Verifique sua internet e tente de novo."
        : err.message;
      errBox.hidden = false;
    } finally {
      btn.disabled = false; btn.classList.remove("is-loading");
    }
  });

  /* ---------- confirmação + acompanhamento ---------- */
  const STATUS_TXT = {
    novo: "Recebido — aguardando a doceria confirmar",
    confirmado: "Confirmado pela doceria",
    preparando: "Em preparo",
    pronto: "Pronto!",
    concluido: "Concluído. Bom apetite!",
    cancelado: "Cancelado — entre em contato com a doceria",
  };
  const STEPS = ["novo", "confirmado", "preparando", "pronto", "concluido"];
  let pollTimer;

  function showView(name) {
    for (const [k, el] of Object.entries(views)) el.hidden = k !== name;
    if (name !== "sucesso") clearInterval(pollTimer);
  }

  function paintStatus(st) {
    const box = $("[data-status]", drawer);
    box.dataset.state = st;
    $("[data-status-text]", box).textContent = STATUS_TXT[st] || st;
    const idx = STEPS.indexOf(st);
    box.querySelectorAll("li").forEach((li, i) => li.classList.toggle("is-done", idx >= 0 && i <= idx));
  }

  function showSuccess({ id, codigo }, abrir = true) {
    $("[data-codigo]", drawer).textContent = `#${codigo}`;
    paintStatus("novo");
    showView("sucesso");
    if (abrir && drawer.hidden) open();
    clearInterval(pollTimer);
    const poll = async () => {
      try {
        const r = await fetch(`${P.endpoint || "/api/pedido"}?id=${encodeURIComponent(id)}&codigo=${encodeURIComponent(codigo)}`);
        if (!r.ok) return;
        const d = await r.json();
        paintStatus(d.status);
        if (d.status === "concluido" || d.status === "cancelado") clearInterval(pollTimer);
      } catch { /* tenta de novo no próximo ciclo */ }
    };
    poll();
    pollTimer = setInterval(poll, 20000);
  }

  $("[data-novo-pedido]", drawer).addEventListener("click", () => { store.del(LAST); showView("carrinho"); });

  // Retoma o acompanhamento de um pedido feito nas últimas 24h
  const last = store.get(LAST, null);
  const acompanhando = last && Date.now() - last.em < 864e5 && !cart.length;
  if (acompanhando) showSuccess(last, false);

  render();
  if (acompanhando) { fab.hidden = false; $("[data-cart-count]", fab).textContent = "✓"; fab.setAttribute("aria-label", "Acompanhar meu pedido"); }

  window.EncantoCarrinho = { add, open, temItens: () => cart.length > 0 };
})();
