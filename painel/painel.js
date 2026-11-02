/* Painel de pedidos — Encanto de Brownie */
(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const brl = v => typeof v === "number" ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "";
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* */ } },
  };

  const STATUS = {
    novo: { txt: "Novo", next: "confirmado", acao: "Confirmar pedido" },
    confirmado: { txt: "Confirmado", next: "preparando", acao: "Iniciar preparo" },
    preparando: { txt: "Em preparo", next: "pronto", acao: "Marcar como pronto" },
    pronto: { txt: "Pronto", next: "concluido", acao: "Concluir (entregue/retirado)" },
    concluido: { txt: "Concluído" },
    cancelado: { txt: "Cancelado" },
  };
  const GRUPO = { novo: "novos", confirmado: "andamento", preparando: "andamento", pronto: "andamento", concluido: "finalizados", cancelado: "finalizados" };

  let senha = ls.get("painel-senha") || "";
  let pedidos = [];
  let aba = "novos";
  let conhecidos = null; // ids já vistos (para detectar pedidos novos)
  let timer;

  /* ---------------- API ---------------- */
  async function api(path, opts = {}) {
    const r = await fetch(path, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${senha}`, ...(opts.headers || {}) },
    });
    const data = await r.json().catch(() => ({}));
    if (r.status === 401) { logout("Senha incorreta ou alterada. Entre novamente."); throw new Error("401"); }
    if (!r.ok) throw new Error(data.erro || `Erro ${r.status}`);
    return data;
  }

  /* ---------------- Login ---------------- */
  function showLogin(msg) {
    $("[data-app]").hidden = true;
    $("[data-login]").hidden = false;
    const e = $("[data-login-erro]");
    e.hidden = !msg; e.textContent = msg || "";
    $("#senha").focus();
  }
  function logout(msg) {
    senha = ""; ls.del("painel-senha"); clearInterval(timer); conhecidos = null;
    showLogin(msg);
  }
  $("[data-login-form]").addEventListener("submit", async e => {
    e.preventDefault();
    senha = $("#senha").value;
    try {
      const r = await fetch("/api/painel/pedidos", { headers: { Authorization: `Bearer ${senha}` } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.erro || "Não foi possível entrar.");
      ls.set("painel-senha", senha);
      $("#senha").value = "";
      start(d);
    } catch (err) {
      showLogin(err.message === "Failed to fetch" ? "Sem conexão com o servidor." : err.message);
    }
  });
  $("[data-logout]").addEventListener("click", () => logout());

  /* ---------------- Lista ---------------- */
  function tempo(iso) {
    const d = new Date(iso), s = (Date.now() - d) / 1000;
    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (s < 60) return `agora · ${hora}`;
    if (s < 3600) return `há ${Math.floor(s / 60)} min · ${hora}`;
    const hoje = new Date().toDateString() === d.toDateString();
    return hoje ? `hoje · ${hora}` : `${d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · ${hora}`;
  }

  function card(p) {
    const st = STATUS[p.status] || { txt: p.status };
    const fone = (p.cliente?.telefone || "").replace(/\D/g, "");
    const foneIntl = fone.length <= 11 ? "55" + fone : fone;
    const mapa = p.endereco ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.endereco)}` : "";
    const itens = (p.itens || []).map(i =>
      `<li><span><b>${i.qtd}×</b> ${esc(i.nome)}${i.unidade ? ` <small>(${esc(i.unidade)})</small>` : ""}</span><span class="v">${brl(i.subtotal) || "—"}</span></li>`).join("");

    return `<article class="order" id="p-${esc(p.id)}" data-id="${esc(p.id)}">
      <div class="order__head">
        <div>
          <span class="order__code">#${esc(p.codigo)}</span>${p.teste ? `<span class="tag-teste">TESTE</span>` : ""}
          <span class="order__time">${tempo(p.criadoEm)}</span>
        </div>
        <span class="pill pill--${esc(p.status)}">${esc(st.txt)}</span>
      </div>

      <div class="order__client">
        <div><strong>${esc(p.cliente?.nome)}</strong><span>${esc(p.cliente?.telefone)}</span></div>
        <div class="links">
          <a class="pbtn" href="tel:+${foneIntl}">Ligar</a>
          <a class="pbtn" href="https://wa.me/${foneIntl}" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>

      <ul class="order__items">${itens}</ul>
      <div class="order__total"><span>Total</span><span>${p.total !== null && p.total !== undefined ? brl(p.total) : "a definir"}</span></div>

      <dl class="order__meta">
        <div><dt>Recebimento</dt><dd>${p.modo === "entrega" ? "Entrega" : "Retirada"}</dd></div>
        ${p.endereco ? `<div><dt>Endereço</dt><dd>${esc(p.endereco)} · <a href="${mapa}" target="_blank" rel="noopener">mapa</a></dd></div>` : ""}
        ${p.quando ? `<div><dt>Para quando</dt><dd>${esc(p.quando)}</dd></div>` : ""}
        ${p.observacoes ? `<div><dt>Observações</dt><dd>${esc(p.observacoes)}</dd></div>` : ""}
      </dl>

      ${st.next || p.status === "novo" ? `<div class="order__actions">
        ${st.next ? `<button type="button" class="pbtn ${p.status === "novo" ? "pbtn--primary" : "pbtn--dark"}" data-set="${st.next}">${st.acao}</button>` : ""}
        <button type="button" class="pbtn pbtn--ghost pbtn--danger" data-cancel>Cancelar</button>
      </div>` : p.status === "cancelado" || p.status === "concluido" ? `<div class="order__actions">
        <button type="button" class="pbtn pbtn--ghost" data-set="novo">Reabrir</button></div>` : ""}
    </article>`;
  }

  function render() {
    const grupos = { novos: [], andamento: [], finalizados: [] };
    pedidos.forEach(p => grupos[GRUPO[p.status] || "novos"].push(p));
    for (const [k, arr] of Object.entries(grupos)) {
      const el = $(`[data-count="${k}"]`);
      el.textContent = arr.length;
      if (k === "novos") el.classList.toggle("has-new", arr.length > 0);
    }
    // Em andamento: os mais antigos primeiro (fila de produção)
    const lista = aba === "andamento" ? [...grupos[aba]].reverse() : grupos[aba];
    $("[data-orders]").innerHTML = lista.map(card).join("");
    const empty = $("[data-empty]");
    empty.hidden = lista.length > 0;
    empty.textContent = { novos: "Nenhum pedido novo por enquanto. 🍫", andamento: "Nenhum pedido em andamento.", finalizados: "Nenhum pedido finalizado ainda." }[aba];
    document.title = grupos.novos.length ? `(${grupos.novos.length}) Pedidos · Encanto de Brownie` : "Pedidos · Encanto de Brownie";
    if ("setAppBadge" in navigator) (grupos.novos.length ? navigator.setAppBadge(grupos.novos.length) : navigator.clearAppBadge()).catch?.(() => {});
  }

  $$("[data-tab]").forEach(b => b.addEventListener("click", () => {
    aba = b.dataset.tab;
    $$("[data-tab]").forEach(x => x.setAttribute("aria-selected", x === b));
    render();
    scrollTo({ top: 0 });
  }));

  $("[data-orders]").addEventListener("click", async e => {
    const el = e.target.closest("[data-id]");
    if (!el) return;
    const id = el.dataset.id;
    const set = e.target.closest("[data-set]");
    if (e.target.closest("[data-cancel]")) {
      const box = $(".order__actions", el);
      box.innerHTML = `<div class="confirm-cancel">Cancelar este pedido?
        <button type="button" class="pbtn pbtn--danger" data-set="cancelado">Sim, cancelar</button>
        <button type="button" class="pbtn pbtn--ghost" data-voltar>Não</button></div>`;
      return;
    }
    if (e.target.closest("[data-voltar]")) return render();
    if (!set) return;
    set.disabled = true;
    try {
      const { pedido } = await api("/api/painel/pedidos", { method: "PATCH", body: JSON.stringify({ id, status: set.dataset.set }) });
      pedidos = pedidos.map(p => p.id === id ? pedido : p);
      toast(`#${pedido.codigo} → ${STATUS[pedido.status].txt}`);
      render();
    } catch (err) {
      if (err.message !== "401") toast(err.message);
      set.disabled = false;
    }
  });

  /* ---------------- Atualização ---------------- */
  async function load(manual) {
    const btn = $("[data-refresh]");
    btn.classList.add("is-spinning");
    try {
      const d = await api("/api/painel/pedidos");
      const novos = aplicar(d);
      if (manual && !novos) toast("Atualizado");
    } catch (err) {
      if (err.message !== "401") $("[data-sync]").textContent = "Sem conexão · tentando de novo";
    } finally {
      btn.classList.remove("is-spinning");
    }
  }

  function aplicar(d) {
    pedidos = d.pedidos || [];
    const ids = new Set(pedidos.map(p => p.id));
    let qtdNovos = 0;
    if (conhecidos) {
      const novos = pedidos.filter(p => !conhecidos.has(p.id));
      qtdNovos = novos.length;
      if (novos.length) alertaNovo(novos);
    }
    conhecidos = ids;
    $("[data-sync]").textContent = `Atualizado ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}${d.armazenamento === "local" ? " · modo local" : ""}`;
    render();
    destacarHash();
    return qtdNovos;
  }

  function alertaNovo(novos) {
    toast(novos.length === 1 ? `Novo pedido #${novos[0].codigo}!` : `${novos.length} pedidos novos!`);
    if (aba !== "novos") $(`[data-tab="novos"]`).click();
    if ($("[data-sound]").checked) beep();
    navigator.vibrate?.([200, 100, 200]);
  }

  let audioCtx;
  function beep() {
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime;
      [880, 1175, 1568].forEach((f, i) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0, t + i * .16);
        g.gain.linearRampToValueAtTime(.25, t + i * .16 + .02);
        g.gain.exponentialRampToValueAtTime(.001, t + i * .16 + .35);
        o.connect(g).connect(audioCtx.destination);
        o.start(t + i * .16); o.stop(t + i * .16 + .4);
      });
    } catch { /* sem áudio */ }
  }
  // desbloqueia o áudio no primeiro toque (exigência dos navegadores)
  addEventListener("pointerdown", () => { try { audioCtx ||= new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch { /* */ } }, { once: true });
  $("[data-sound]").checked = ls.get("painel-som") !== "0";
  $("[data-sound]").addEventListener("change", e => ls.set("painel-som", e.target.checked ? "1" : "0"));

  function destacarHash() {
    const id = location.hash.slice(1);
    if (!id) return;
    const p = pedidos.find(x => x.id === id);
    if (!p) return;
    const alvo = GRUPO[p.status];
    if (aba !== alvo) { aba = alvo; $$("[data-tab]").forEach(x => x.setAttribute("aria-selected", x.dataset.tab === alvo)); render(); }
    const el = document.getElementById("p-" + id);
    if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("is-highlight"); }
    history.replaceState(null, "", location.pathname);
  }

  $("[data-refresh]").addEventListener("click", () => load(true));
  document.addEventListener("visibilitychange", () => { if (!document.hidden && senha) load(); });

  /* ---------------- Notificações (Web Push) ---------------- */
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  const pushOk = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  let swReg;

  $("[data-menu]").addEventListener("click", e => {
    const s = $("[data-settings]");
    s.hidden = !s.hidden;
    e.currentTarget.setAttribute("aria-expanded", !s.hidden);
    if (!s.hidden) estadoNotif();
  });

  function b64ToUint8(b64) {
    const pad = "=".repeat((4 - b64.length % 4) % 4);
    const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  }

  async function estadoNotif() {
    const st = $("[data-notif-status]");
    const on = $("[data-notif-on]"), off = $("[data-notif-off]"), test = $("[data-notif-test]");
    $("[data-ios-hint]").hidden = !(isIOS && !standalone);
    if (!pushOk) {
      st.textContent = isIOS && !standalone
        ? "Para receber notificações no iPhone, primeiro instale o painel na Tela de Início."
        : "Este navegador não suporta notificações. Use o Chrome (Android) ou o Safari (iPhone, com o painel instalado).";
      on.hidden = off.hidden = test.hidden = true;
      return;
    }
    try {
      const info = await api("/api/painel/notificacoes");
      if (!info.chavePublica) {
        st.textContent = "As chaves de notificação ainda não foram configuradas no servidor (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).";
        on.hidden = off.hidden = test.hidden = true;
        return;
      }
      swReg ||= await navigator.serviceWorker.register("/painel/sw.js", { scope: "/painel/" });
      const sub = await swReg.pushManager.getSubscription();
      const perm = Notification.permission;
      if (perm === "denied") {
        st.textContent = "As notificações foram bloqueadas neste aparelho. Libere nas configurações do navegador/celular.";
        on.hidden = off.hidden = test.hidden = true;
      } else if (sub) {
        st.textContent = `Ativadas neste aparelho ✓ · ${info.aparelhos} aparelho(s) recebendo pedidos.`;
        on.hidden = true; off.hidden = test.hidden = false;
      } else {
        st.textContent = `Desativadas neste aparelho. ${info.aparelhos ? `${info.aparelhos} outro(s) aparelho(s) recebendo.` : ""}`;
        on.hidden = false; off.hidden = test.hidden = true;
      }
      on.dataset.key = info.chavePublica;
    } catch (err) {
      if (err.message !== "401") st.textContent = "Não foi possível verificar as notificações agora.";
    }
  }

  $("[data-notif-on]").addEventListener("click", async e => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") throw new Error("Permissão de notificação não concedida.");
      swReg ||= await navigator.serviceWorker.register("/painel/sw.js", { scope: "/painel/" });
      await navigator.serviceWorker.ready;
      const sub = await swReg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(btn.dataset.key) });
      const aparelho = /android/i.test(navigator.userAgent) ? "Android" : isIOS ? "iPhone/iPad" : "Computador";
      await api("/api/painel/notificacoes", { method: "POST", body: JSON.stringify({ sub: sub.toJSON(), aparelho }) });
      toast("Notificações ativadas!");
    } catch (err) {
      if (err.message !== "401") toast(err.message);
    } finally {
      btn.disabled = false;
      estadoNotif();
    }
  });

  $("[data-notif-test]").addEventListener("click", async () => {
    try {
      const r = await api("/api/painel/notificacoes", { method: "PUT" });
      toast(r.enviados ? "Teste enviado — confira a notificação" : "Nenhum aparelho recebeu. Reative as notificações.");
    } catch (err) { if (err.message !== "401") toast(err.message); }
  });

  $("[data-notif-off]").addEventListener("click", async () => {
    try {
      const sub = await swReg?.pushManager.getSubscription();
      if (sub) {
        await api("/api/painel/notificacoes", { method: "DELETE", body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      toast("Notificações desativadas neste aparelho");
    } catch (err) { if (err.message !== "401") toast(err.message); }
    estadoNotif();
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", e => {
      if (e.data?.tipo === "novo-pedido") load();
      if (e.data?.tipo === "abrir") { location.hash = new URL(e.data.url, location.origin).hash; load(); }
    });
    // registra o SW cedo para que o painel funcione como app instalável
    navigator.serviceWorker.register("/painel/sw.js", { scope: "/painel/" }).then(r => { swReg = r; }).catch(() => {});
  }

  /* ---------------- Utilidades ---------------- */
  let toastT;
  function toast(msg) {
    const t = $("[data-toast]");
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("is-on"), 2800);
  }

  function start(dadosIniciais) {
    $("[data-login]").hidden = true;
    $("[data-app]").hidden = false;
    if (dadosIniciais) aplicar(dadosIniciais); else load();
    clearInterval(timer);
    timer = setInterval(() => { if (!document.hidden) load(); }, 15000);
    if (pushOk && Notification.permission === "default") {
      // abre as configurações na primeira vez para lembrar de ativar
      $("[data-settings]").hidden = false; estadoNotif();
    }
  }

  if (senha) start(); else showLogin();
})();
