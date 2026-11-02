/* ==========================================================================
   ENCANTO DE BROWNIE — Interações & animações
   Sem dependências. Respeita prefers-reduced-motion e desativa efeitos de
   hover/cursor em telas de toque.
   ========================================================================== */
(() => {
  "use strict";

  const CFG = window.ENCANTO_CONFIG || {};
  const contato = CFG.contato || {};
  const fotos = CFG.fotos || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const range = (p, a, b) => clamp((p - a) / (b - a), 0, 1);

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ------------------------------------------------------------------------
     WhatsApp / pedidos
     ------------------------------------------------------------------------ */
  const waNumber = String(contato.whatsapp || "").replace(/\D/g, "");
  const waLink = msg => `https://wa.me/${waNumber}?text=${encodeURIComponent(msg || contato.mensagemPadrao || "Olá!")}`;

  const sitePedidos = !!(CFG.pedidos && CFG.pedidos.ativo);

  function wireOrderButtons() {
    $$("[data-order]").forEach(a => {
      if (sitePedidos) {
        a.href = "#sabores";
        a.addEventListener("click", e => {
          if (window.EncantoCarrinho?.temItens()) { e.preventDefault(); window.EncantoCarrinho.open(); }
        });
      } else if (waNumber) {
        a.href = waLink();
        a.target = "_blank";
        a.rel = "noopener";
      } else if (a.closest("#pedido")) {
        a.href = "#contato";
      } else {
        a.href = "#pedido";
      }
    });
  }

  /* ------------------------------------------------------------------------
     Ilustrações provisórias (substituídas automaticamente por fotos reais)
     ------------------------------------------------------------------------ */
  let svgId = 0;
  function crackFilter(id, seed, freq = .02, light = "#d79a64", scale = 2.6) {
    return `<filter id="${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="4" seed="${seed}" result="n"/>
      <feDiffuseLighting in="n" surfaceScale="${scale}" lighting-color="${light}" result="l"><feDistantLight azimuth="235" elevation="42"/></feDiffuseLighting>
      <feComposite in="l" in2="SourceGraphic" operator="in" result="c"/>
      <feBlend in="c" in2="SourceGraphic" mode="multiply"/>
    </filter>`;
  }

  function slab(x, y, w, h, d, id, hue = 0) {
    // bloco de brownie em pseudo-3D: topo craquelado, frente e lateral
    const tx = d * .9, ty = d * .55;
    const top = `${x},${y} ${x + w},${y} ${x + w + tx},${y - ty} ${x + tx},${y - ty}`;
    const side = `${x + w},${y} ${x + w + tx},${y - ty} ${x + w + tx},${y - ty + h} ${x + w},${y + h}`;
    return `
      <polygon points="${top}" fill="url(#gTop${id})" filter="url(#f${id})"/>
      <path d="M${x} ${y}h${w}v${h - 8}q0 8 -8 8h${-(w - 16)}q-8 0 -8 -8z" fill="url(#gFront${id})" filter="url(#ff${id})"/>
      <polygon points="${side}" fill="#1c0e0a" opacity=".85"/>
      <path d="M${x} ${y}H${x + w}" stroke="#a46a43" stroke-opacity=".5" stroke-width="1.2"/>`;
  }

  function placeholderSVG(kind = "stack", seed = 3) {
    const id = `ph${++svgId}`;
    const defs = `<defs>
      ${crackFilter("f" + id, seed, .028)}
      ${crackFilter("ff" + id, seed + 7, .09, "#8a5a3e")}
      ${crackFilter("ft" + id, seed, .022, "#f0b47a", 7)}
      <linearGradient id="gTop${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a4632"/><stop offset="1" stop-color="#4a2519"/></linearGradient>
      <linearGradient id="gFront${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d1e15"/><stop offset="1" stop-color="#22110c"/></linearGradient>
      <radialGradient id="gGlow${id}" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#c88950" stop-opacity=".35"/><stop offset="1" stop-color="#c88950" stop-opacity="0"/></radialGradient>
      <linearGradient id="gDrz${id}" x1="0" x2="1"><stop offset="0" stop-color="#e2b27f"/><stop offset="1" stop-color="#c88950"/></linearGradient>
    </defs>`;

    let body = "";
    const sugar = (n, x0, x1, y0, y1) => Array.from({ length: n }, (_, i) => {
      const r = (Math.sin(seed * 99 + i * 12.9898) * 43758.5453) % 1, r2 = (Math.sin(seed * 7 + i * 78.233) * 12345.678) % 1;
      return `<circle cx="${lerp(x0, x1, Math.abs(r)).toFixed(1)}" cy="${lerp(y0, y1, Math.abs(r2)).toFixed(1)}" r="${(1 + Math.abs(r * 2)).toFixed(1)}" fill="#f8f0e5" opacity="${(.35 + Math.abs(r2) * .5).toFixed(2)}"/>`;
    }).join("");

    if (kind === "texture") {
      body = `
        <rect width="800" height="520" fill="#5a2e21" filter="url(#ft${id})"/>
        <rect width="800" height="520" fill="url(#gGlow${id})"/>
        <path d="M-20 300 C 120 230, 220 360, 360 290 S 600 230, 820 300" fill="none" stroke="url(#gDrz${id})" stroke-width="16" stroke-linecap="round" opacity=".85"/>
        <path d="M-20 340 C 140 280, 260 400, 420 330 S 640 280, 820 350" fill="none" stroke="#2a140e" stroke-width="10" stroke-linecap="round" opacity=".6"/>
        ${sugar(60, 0, 800, 0, 520)}`;
      return `<svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs}${body}</svg>`;
    }

    if (kind === "piece") {
      body = `
        <rect width="400" height="500" fill="url(#gGlow${id})"/>
        <ellipse cx="205" cy="372" rx="170" ry="44" fill="#f8f0e5" opacity=".92"/>
        <ellipse cx="205" cy="368" rx="140" ry="32" fill="#efe2d0"/>
        <ellipse cx="210" cy="362" rx="110" ry="14" fill="#000" opacity=".25"/>
        ${slab(108, 300, 170, 62, 56, id)}
        <path d="M120 296 q 30 -22 60 -6 t 60 -8 t 50 -14" fill="none" stroke="url(#gDrz${id})" stroke-width="7" stroke-linecap="round" opacity=".9"/>
        ${sugar(26, 118, 320, 250, 296)}`;
      return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs}${body}</svg>`;
    }

    // stack
    body = `
      <rect width="400" height="500" fill="url(#gGlow${id})"/>
      <ellipse cx="205" cy="430" rx="150" ry="20" fill="#000" opacity=".35"/>
      ${slab(85, 360, 200, 66, 64, id)}
      ${slab(98, 290, 190, 64, 60, id, 4)}
      ${slab(90, 222, 196, 62, 62, id, -3)}
      <path d="M96 216 q 28 -26 58 -8 t 58 -12 t 62 -18 t 28 6" fill="none" stroke="url(#gDrz${id})" stroke-width="7" stroke-linecap="round"/>
      <path d="M150 222 q 4 16 0 30 q -2 8 4 10" fill="none" stroke="url(#gDrz${id})" stroke-width="6" stroke-linecap="round"/>
      ${sugar(34, 100, 330, 160, 220)}
      <circle cx="320" cy="445" r="4" fill="#3d1e15"/><circle cx="96" cy="452" r="3" fill="#3d1e15"/><circle cx="338" cy="432" r="2.4" fill="#5a2e21"/>`;
    return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs}${body}</svg>`;
  }

  const placeholder = (kind, seed, label = "Foto provisória") =>
    `<div class="placeholder">${placeholderSVG(kind, seed)}<span class="placeholder__tag">${esc(label)}</span></div>`;

  function fillPhotoSlots() {
    const map = {
      hero: { src: fotos.hero, kind: "stack", alt: "Brownies da Encanto de Brownie", eager: true },
      textura: { src: fotos.textura, kind: "texture", alt: "Detalhe da textura do brownie" },
      marca: { src: fotos.marca, kind: "piece", alt: "Momento especial com brownie" },
    };
    $$("[data-photo-slot]").forEach((slot, i) => {
      const m = map[slot.dataset.photoSlot];
      if (!m) return;
      slot.innerHTML = m.src
        ? `<img src="${esc(m.src)}" alt="${esc(m.alt)}" ${m.eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`
        : placeholder(m.kind, 3 + i);
    });
  }

  /* ------------------------------------------------------------------------
     Catálogo
     ------------------------------------------------------------------------ */
  const fmtPrice = v => typeof v === "number" && isFinite(v)
    ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "";

  const DEMO = Array.from({ length: 6 }, (_, i) => ({
    id: `exemplo-${i + 1}`,
    nome: `Produto ${i + 1}`,
    categoria: i % 2 ? "Categoria B" : "Categoria A",
    descricao: "Espaço para a descrição real do produto, com até duas ou três linhas.",
    preco: null,
    foto: null,
    disponivel: null,
    _demo: true,
  }));

  function productCard(p, i) {
    const dark = i % 6 === 1 || i % 6 === 4;
    const media = p.foto
      ? `<img src="${esc(p.foto)}" alt="${esc(p.nome)}" loading="lazy" decoding="async">`
      : placeholder(i % 2 ? "piece" : "stack", 11 + i, p._demo ? "Imagem de exemplo" : "Foto provisória");
    const price = fmtPrice(p.preco);
    const status = p.disponivel === true ? `<span class="product__status">Disponível</span>`
      : p.disponivel === false ? `<span class="product__status is-off">Indisponível no momento</span>` : "";
    const canOrder = p.disponivel !== false;

    return `
      <article class="product${dark ? " product--dark" : ""}${p.destaque ? " is-featured" : ""}${p._demo ? " product--demo" : ""}"
               data-cat="${esc(p.categoria || "")}" data-name="${esc((p.nome || "").toLowerCase())}">
        <div class="product__media" data-cursor="${canOrder ? "Provar" : "Ver"}">
          ${p.categoria ? `<span class="product__cat">${esc(p.categoria)}</span>` : ""}
          ${status}
          ${media}
        </div>
        <div class="product__body">
          <div class="product__row">
            <h3 class="product__name">${esc(p.nome)}</h3>
            ${price ? `<p class="product__price">${price}${p.unidade ? `<small>${esc(p.unidade)}</small>` : ""}</p>` : ""}
          </div>
          ${p.descricao ? `<p class="product__desc">${esc(p.descricao)}</p>` : ""}
          ${canOrder ? `<button type="button" class="btn btn--chocolate product__cta" data-want="${esc(p.nome)}" data-id="${esc(p.id)}" data-demo="${p._demo ? 1 : 0}" data-magnetic>
            <span>Quero experimentar</span></button>` : ""}
        </div>
      </article>`;
  }

  function renderCatalog() {
    const grid = $("[data-grid]");
    const real = Array.isArray(CFG.produtos) ? CFG.produtos.filter(p => p && p.nome) : [];
    let list = real;

    if (!real.length) {
      if (CFG.modoDesenvolvimento) {
        list = DEMO;
        $("[data-dev-banner]").hidden = false;
      } else {
        $("[data-menu-soon]").hidden = false;
        return;
      }
    }

    grid.innerHTML = list.map(productCard).join("");

    // Busca e categorias apenas quando há produtos suficientes
    const cats = [...new Set(list.map(p => p.categoria).filter(Boolean))];
    if (list.length >= (CFG.minimoParaFiltros ?? 6)) {
      const tools = $("[data-catalog-tools]");
      tools.hidden = false;
      const chips = $("[data-chips]");
      if (cats.length > 1) {
        chips.innerHTML = ["Todos", ...cats].map((c, i) =>
          `<button type="button" class="chip" role="tab" aria-selected="${i === 0}" data-chip="${i ? esc(c) : ""}">${esc(c)}</button>`).join("");
      }
      let cat = "", q = "";
      const apply = () => {
        let shown = 0;
        $$(".product", grid).forEach(el => {
          const ok = (!cat || el.dataset.cat === cat) && (!q || el.dataset.name.includes(q));
          el.classList.toggle("is-filtered-out", !ok);
          if (ok) { shown++; el.classList.add("is-in"); }
        });
        $("[data-grid-empty]").hidden = shown > 0;
      };
      chips.addEventListener("click", e => {
        const b = e.target.closest("[data-chip]");
        if (!b) return;
        $$(".chip", chips).forEach(c => c.setAttribute("aria-selected", c === b));
        cat = b.dataset.chip; apply();
      });
      $("[data-search]").addEventListener("input", e => {
        q = e.target.value.trim().toLowerCase(); apply();
      });
    }

    grid.addEventListener("click", e => {
      const b = e.target.closest("[data-want]");
      if (!b) return;
      b.classList.remove("is-pressed"); void b.offsetWidth; b.classList.add("is-pressed");
      if (sitePedidos && window.EncantoCarrinho) {
        window.EncantoCarrinho.add(b.dataset.id);
        return toast(`“${b.dataset.want}” foi adicionado ao seu pedido`);
      }
      if (b.dataset.demo === "1") return toast("Card de exemplo — cadastre os produtos reais em js/config.js");
      if (waNumber) {
        window.open(waLink(`Olá! Vim pelo site e quero experimentar: ${b.dataset.want}.`), "_blank", "noopener");
      } else {
        toast(`Ótima escolha! Fale com a gente para pedir “${b.dataset.want}”.`);
        setTimeout(() => $("#pedido").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }), 900);
      }
    });
  }

  let toastTimer;
  function toast(msg) {
    const t = $("[data-toast]");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-on"), 3200);
  }

  /* ------------------------------------------------------------------------
     Rodapé / contatos (só exibe o que estiver preenchido)
     ------------------------------------------------------------------------ */
  function renderContacts() {
    const box = $("[data-contact-list]");
    const items = [];
    if (waNumber) items.push(`<a href="${waLink()}" target="_blank" rel="noopener">WhatsApp</a>`);
    if (contato.instagram) {
      const u = String(contato.instagram).replace(/^@/, "");
      items.push(`<a href="https://instagram.com/${encodeURIComponent(u)}" target="_blank" rel="noopener">@${esc(u)}</a>`);
    }
    if (contato.email) items.push(`<a href="mailto:${esc(contato.email)}">${esc(contato.email)}</a>`);
    if (contato.cidade) items.push(`<span>${esc(contato.cidade)}</span>`);
    if (contato.horario) items.push(`<span>${esc(contato.horario)}</span>`);
    if (!items.length) items.push(`<span class="footer__muted">Canais de contato em breve.</span>`);
    box.insertAdjacentHTML("beforeend", items.join(""));
    $("[data-year]").textContent = new Date().getFullYear();
  }

  /* ------------------------------------------------------------------------
     Entrada (preloader → hero stagger)
     ------------------------------------------------------------------------ */
  function intro() {
    $$("[data-hero-stagger]").forEach((el, i) => el.style.setProperty("--i", i));
    let done = false;
    const go = () => {
      if (done) return; done = true;
      document.body.classList.remove("is-loading");
      document.body.classList.add("is-loaded");
      setTimeout(() => document.body.classList.add("is-ready"), reduceMotion ? 0 : 450);
    };
    if (document.readyState === "complete") setTimeout(go, 300);
    else window.addEventListener("load", () => setTimeout(go, 300));
    setTimeout(go, 2600); // nunca prende o usuário no preloader
  }

  /* ------------------------------------------------------------------------
     Revelação ao rolar
     ------------------------------------------------------------------------ */
  function reveals() {
    const els = [...$$("[data-reveal]"), ...$$(".product")];
    if (reduceMotion || !("IntersectionObserver" in window)) return els.forEach(e => e.classList.add("is-in"));

    // atraso em cascata para irmãos que entram juntos
    const io = new IntersectionObserver(entries => {
      const batch = entries.filter(e => e.isIntersecting);
      batch.forEach((e, i) => {
        e.target.style.setProperty("--d", `${i * 0.09}s`);
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: .12 });
    els.forEach(e => io.observe(e));
  }

  /* ------------------------------------------------------------------------
     Navegação
     ------------------------------------------------------------------------ */
  function nav() {
    const bar = $("[data-nav]");
    const toggle = $("[data-menu-toggle]");
    const menu = $("[data-mobile-menu]");
    let lastY = scrollY;
    addEventListener("scroll", () => {
      const y = scrollY;
      bar.classList.toggle("is-scrolled", y > 40);
      bar.classList.toggle("is-hidden", y > lastY && y > 500 && menu.hidden);
      lastY = y;
    }, { passive: true });

    const setOpen = open => {
      toggle.setAttribute("aria-expanded", open);
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      menu.hidden = !open;
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () => setOpen(menu.hidden));
    menu.addEventListener("click", e => e.target.closest("a") && setOpen(false));
    addEventListener("keydown", e => e.key === "Escape" && !menu.hidden && setOpen(false));
  }

  /* ------------------------------------------------------------------------
     Cursor personalizado + botões magnéticos (somente desktop)
     ------------------------------------------------------------------------ */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 };

  function cursor() {
    if (!finePointer || reduceMotion) return;
    document.body.classList.add("has-cursor");
    const root = $(".cursor"), dot = $(".cursor__dot"), ring = $(".cursor__ring"), label = $(".cursor__label");
    let rx = mouse.x, ry = mouse.y;

    addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;
      mouse.x = e.clientX; mouse.y = e.clientY;
      dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
      root.classList.remove("is-hidden");
    }, { passive: true });
    document.addEventListener("pointerleave", () => root.classList.add("is-hidden"));
    addEventListener("pointerdown", () => root.classList.add("is-down"));
    addEventListener("pointerup", () => root.classList.remove("is-down"));

    document.addEventListener("pointerover", e => {
      const labeled = e.target.closest("[data-cursor]");
      const interactive = e.target.closest("a, button, input, label, [data-photo-slot], .product__media");
      // sobre campos de texto mostramos o cursor nativo
      if (e.target.closest("input, textarea")) { root.classList.add("is-hidden"); return; }
      root.classList.remove("is-hidden");
      root.classList.toggle("is-label", !!labeled);
      root.classList.toggle("is-hover", !!interactive && !labeled);
      if (labeled) label.textContent = labeled.dataset.cursor || "Explorar";
    });

    (function loop() {
      rx = lerp(rx, mouse.x, .18); ry = lerp(ry, mouse.y, .18);
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    })();
  }

  function magnetic() {
    if (!finePointer || reduceMotion) return;
    const bind = el => {
      if (el._mag) return; el._mag = true;
      const strength = el.classList.contains("btn--large") ? .25 : .32;
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transition = "transform .2s ease-out, color .45s, box-shadow .45s";
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform .8s cubic-bezier(.16,1,.3,1), color .45s, box-shadow .45s";
        el.style.transform = "";
      });
    };
    $$("[data-magnetic]").forEach(bind);
  }

  /* ------------------------------------------------------------------------
     Partículas douradas no hero (canvas leve, pausa fora da tela)
     ------------------------------------------------------------------------ */
  function particles() {
    const c = $(".hero__particles");
    if (!c || reduceMotion) return;
    const ctx = c.getContext("2d");
    let w, h, dpr, parts = [], visible = true;
    const N = innerWidth < 700 ? 22 : 46;

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (anyY) => ({
      x: Math.random() * w, y: anyY ? Math.random() * h : h + 10,
      r: Math.random() * 1.6 + .4, vy: Math.random() * .25 + .08,
      sway: Math.random() * 2 * Math.PI, a: Math.random() * .5 + .2,
      tw: Math.random() * .02 + .005,
    });
    resize(); parts = Array.from({ length: N }, () => spawn(true));
    addEventListener("resize", resize);
    new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(c);

    let t = 0;
    (function frame() {
      requestAnimationFrame(frame);
      if (!visible) return;
      t++;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.vy; p.sway += .01;
        const x = p.x + Math.sin(p.sway) * 14 + mouse.nx * 10 * p.r;
        const alpha = p.a * (.6 + .4 * Math.sin(t * p.tw + p.sway));
        const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * 4);
        g.addColorStop(0, `rgba(226,178,127,${alpha})`);
        g.addColorStop(1, "rgba(226,178,127,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
        if (p.y < -10) Object.assign(p, spawn(false));
      }
    })();
  }

  /* ------------------------------------------------------------------------
     Seção "Chocolate em movimento" — orquestrada pela rolagem
     ------------------------------------------------------------------------ */
  const motionSec = $("[data-motion]");
  const meltPath = $("[data-melt]");
  const drips = Array.from({ length: 16 }, (_, i) => ({
    x: 40 + i * 90 + (Math.sin(i * 3.1) * 26),
    w: 22 + Math.abs(Math.sin(i * 1.7)) * 26,
    len: 40 + Math.abs(Math.sin(i * 2.3 + 1)) * 170,
  }));

  function meltD(p) {
    const b = 18 + p * 22; // espessura da faixa superior
    let d = `M0 0H1440V${b.toFixed(1)}`;
    [...drips].sort((a, z) => z.x - a.x).forEach((dr, i) => {
      const len = dr.len * easeInOut(clamp(p * 1.25 - (i % 4) * .06, 0, 1));
      const r = dr.w / 2;
      if (len < r + 6) return;
      const R = dr.x + r, L = dr.x - r, bot = b + len - r;
      d += `L${(R + 10).toFixed(1)} ${b.toFixed(1)}Q${R.toFixed(1)} ${b.toFixed(1)} ${R.toFixed(1)} ${(b + 10).toFixed(1)}`
        + `L${R.toFixed(1)} ${bot.toFixed(1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${L.toFixed(1)} ${bot.toFixed(1)}`
        + `L${L.toFixed(1)} ${(b + 10).toFixed(1)}Q${L.toFixed(1)} ${b.toFixed(1)} ${(L - 10).toFixed(1)} ${b.toFixed(1)}`;
    });
    return d + `L0 ${b.toFixed(1)}Z`;
  }

  const mixHex = (a, b, t) => {
    const pa = a.match(/\w\w/g).map(h => parseInt(h, 16)), pb = b.match(/\w\w/g).map(h => parseInt(h, 16));
    return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(",")})`;
  };

  function updateMotion() {
    if (!motionSec) return;
    const r = motionSec.getBoundingClientRect();
    const total = r.height - innerHeight;
    const p = clamp(-r.top / total, 0, 1);
    if (r.bottom < 0 || r.top > innerHeight) return;

    const stage = $(".motion__stage", motionSec);
    const photo = $("[data-motion-photo]");
    const inner = $(".motion__photo-inner", photo);
    const mobile = innerWidth < 760;

    const grow = easeInOut(range(p, 0, .45));
    photo.style.setProperty("--w", `${lerp(mobile ? 78 : 44, 100, grow)}%`);
    photo.style.setProperty("--h", `${lerp(mobile ? 46 : 54, 100, grow)}%`);
    photo.style.setProperty("--r", `${lerp(mobile ? 160 : 260, 0, grow)}px`);
    photo.style.setProperty("--vig", (range(p, .25, .55) * .95).toFixed(3));

    // "câmera" passeando pela textura
    inner.style.setProperty("--s", lerp(1.35, 1.08, p).toFixed(3));
    inner.style.setProperty("--tx", `${lerp(-3, 3, p).toFixed(2)}%`);
    inner.style.setProperty("--ty", `${lerp(4, -4, p).toFixed(2)}%`);

    // fundo creme → cacau
    const bp = range(p, .05, .4);
    stage.style.setProperty("--bgc", bp < .5 ? mixHex("F8F0E5", "8A5A45", bp * 2) : mixHex("8A5A45", "24130F", bp * 2 - 1));
    meltPath.setAttribute("d", meltD(range(p, .02, .7)));

    const steps = [.22, .32, .4, .5, .58, .68];
    $$("[data-motion-step]", motionSec).forEach(el => {
      el.classList.toggle("is-on", p >= steps[+el.dataset.motionStep]);
    });
    $("[data-motion-bar]").style.setProperty("--p", p.toFixed(3));
  }

  /* ------------------------------------------------------------------------
     Loop de rolagem: parallax, flutuação, seção de movimento
     ------------------------------------------------------------------------ */
  function scrollFx() {
    if (reduceMotion) {
      if (meltPath) meltPath.setAttribute("d", meltD(1));
      $$("[data-motion-step]").forEach(e => e.classList.add("is-on"));
      return;
    }
    const parallax = $$("[data-parallax]");
    const floats = $$("[data-float]");
    const badge = $("[data-rotate]");

    if (finePointer) addEventListener("pointermove", e => {
      mouse.nx = e.clientX / innerWidth - .5;
      mouse.ny = e.clientY / innerHeight - .5;
    }, { passive: true });

    let sx = 0, sy = 0;
    (function frame(time) {
      const y = scrollY;
      sx = lerp(sx, mouse.nx, .06); sy = lerp(sy, mouse.ny, .06);

      if (y < innerHeight * 1.2) {
        parallax.forEach(el => {
          const f = parseFloat(el.dataset.parallax);
          el.style.transform = `translate3d(${sx * f * -60}px, ${y * f}px, 0)`;
        });
        floats.forEach((el, i) => {
          const t = time / 1000 + i * 1.7;
          const fx = Math.sin(t * .6) * 6 + sx * (18 + i * 8);
          const fy = Math.cos(t * .8) * 8 + sy * (14 + i * 6) - y * (.06 + i * .03);
          el.style.transform = `translate3d(${fx}px, ${fy}px, 0)`;
        });
      }
      if (badge) {
        const r = badge.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) badge.style.transform = `translateY(${(r.top - innerHeight / 2) * -.08}px)`;
      }
      updateMotion();
      requestAnimationFrame(frame);
    })(performance.now());
  }

  /* ------------------------------------------------------------------------
     Init
     ------------------------------------------------------------------------ */
  fillPhotoSlots();
  renderCatalog();
  renderContacts();
  wireOrderButtons();
  intro();
  nav();
  reveals();
  cursor();
  magnetic();
  particles();
  scrollFx();
})();
