/* NEX3 Tecnologia · interações do site */
(() => {
  const reduzir = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const CIANO = "35,195,231", ALERTA = "255,101,104";
  const doisDig = (n) => String(n).padStart(2, "0");
  const horaAgora = () => { const d = new Date(); return `${doisDig(d.getHours())}:${doisDig(d.getMinutes())}:${doisDig(d.getSeconds())}`; };

  /* ── Painel da abertura: relógio e log ────────────────────────────────── */
  const relogio = document.querySelector("[data-relogio]");
  const logEl = document.querySelector("[data-hp-log]");
  const alertaEl = document.querySelector("[data-hp-alerta]");
  const enlacesEl = document.querySelector("[data-hp-enlaces]");
  if (relogio) { relogio.textContent = horaAgora(); setInterval(() => (relogio.textContent = horaAgora()), 1000); }
  const registrar = (texto, tipo) => {
    if (!logEl) return;
    const li = document.createElement("li");
    if (tipo) li.className = tipo;
    li.innerHTML = `<time>${horaAgora()}</time><span></span>`;
    li.lastChild.textContent = texto;
    logEl.prepend(li);
    while (logEl.children.length > 5) logEl.lastChild.remove();
  };

  /* ── Abertura: mapa de rede vivo ──────────────────────────────────────── */
  const canvas = document.querySelector(".hero-rede");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let L = 0, A = 0, nos = [], enlaces = [], pacotes = [], visivel = true, ultimo = 0;
    // Gerador fixo: a rede tem sempre o mesmo desenho
    let semente = 7;
    const aleatorio = () => ((semente = (semente * 16807) % 2147483647) - 1) / 2147483646;

    const montar = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      L = canvas.clientWidth; A = canvas.clientHeight;
      canvas.width = L * dpr; canvas.height = A * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      semente = 7; nos = []; enlaces = []; pacotes = [];
      const qtd = L < 700 ? 26 : 46;
      for (let i = 0; i < qtd; i++) {
        // mais nós à direita, onde o texto não está
        const x = L * (0.08 + Math.pow(aleatorio(), 0.6) * 0.9);
        const y = A * (0.1 + aleatorio() * 0.82);
        nos.push({ x, y, r: 1.6 + aleatorio() * 1.8, nome: `POP-${doisDig(i + 1)}`, fase: aleatorio() * 6.28, alerta: 0 });
      }
      nos.forEach((n, i) => {
        const perto = nos.map((m, j) => ({ j, d: Math.hypot(m.x - n.x, m.y - n.y) })).filter((o) => o.j !== i).sort((a, b) => a.d - b.d).slice(0, 2);
        perto.forEach(({ j }) => { if (!enlaces.some((e) => (e.a === i && e.b === j) || (e.a === j && e.b === i))) enlaces.push({ a: i, b: j, estado: "ok", t: 0 }); });
      });
      if (enlacesEl) enlacesEl.textContent = enlaces.length;
      for (let k = 0; k < enlaces.length * 0.7; k++) novoPacote();
      if (reduzir) desenhar(0);
    };

    const novoPacote = () => {
      const e = enlaces[(aleatorio() * enlaces.length) | 0];
      if (e && e.estado === "ok") pacotes.push({ e, p: aleatorio(), v: 0.0012 + aleatorio() * 0.0025, ida: aleatorio() > 0.5 });
    };

    const desenhar = (t) => {
      ctx.clearRect(0, 0, L, A);
      for (const e of enlaces) {
        const a = nos[e.a], b = nos[e.b];
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        if (e.estado === "alerta") {
          ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t / 40;
          ctx.strokeStyle = `rgba(${ALERTA},${0.55 + Math.sin(t / 120) * 0.35})`; ctx.lineWidth = 1.6;
        } else if (e.estado === "tratando") {
          ctx.setLineDash([]); ctx.strokeStyle = `rgba(${CIANO},.85)`; ctx.lineWidth = 2;
        } else {
          ctx.setLineDash([]); ctx.strokeStyle = `rgba(${CIANO},.2)`; ctx.lineWidth = 1;
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      for (const k of pacotes) {
        const a = nos[k.e.a], b = nos[k.e.b], p = k.ida ? k.p : 1 - k.p;
        const x = a.x + (b.x - a.x) * p, y = a.y + (b.y - a.y) * p;
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 6.28);
        ctx.fillStyle = `rgba(${CIANO},.95)`; ctx.shadowColor = `rgb(${CIANO})`; ctx.shadowBlur = 8; ctx.fill();
      }
      ctx.shadowBlur = 0;
      for (const n of nos) {
        const brilho = 0.45 + Math.sin(t / 900 + n.fase) * 0.25;
        if (n.alerta) {
          const onda = (t / 1400) % 1;
          ctx.beginPath(); ctx.arc(n.x, n.y, 6 + onda * 26, 0, 6.28);
          ctx.strokeStyle = `rgba(${ALERTA},${0.6 * (1 - onda)})`; ctx.lineWidth = 1.5; ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.28);
        ctx.fillStyle = n.alerta ? `rgb(${ALERTA})` : `rgba(${CIANO},${brilho})`; ctx.fill();
        if (n.alerta && L > 700) {
          ctx.font = "500 11px 'IBM Plex Mono', monospace"; ctx.fillStyle = `rgba(${ALERTA},.9)`;
          ctx.fillText(n.nome, n.x + 10, n.y - 10);
        }
      }
    };

    const passo = (t) => {
      if (visivel) {
        const dt = Math.min(48, t - (ultimo || t)); ultimo = t;
        for (const k of pacotes) k.p += k.v * dt;
        pacotes = pacotes.filter((k) => k.p < 1 && k.e.estado === "ok");
        while (pacotes.length < enlaces.length * 0.7) novoPacote();
        desenhar(t);
      } else ultimo = 0;
      requestAnimationFrame(passo);
    };

    // Ciclo de incidente: enlace cai, NOC trata, enlace normaliza
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    const ciclo = async () => {
      await espera(2600);
      while (true) {
        if (!visivel) { await espera(1000); continue; }
        const e = enlaces[(aleatorio() * enlaces.length) | 0];
        const a = nos[e.a], b = nos[e.b];
        e.estado = "alerta"; a.alerta = b.alerta = 1;
        if (alertaEl) { alertaEl.textContent = "1"; alertaEl.className = "alerta"; }
        registrar(`Perda de pacotes ${a.nome} ↔ ${b.nome}`, "alerta");
        await espera(2600);
        registrar("Impacto validado · criticidade alta");
        await espera(1800);
        e.estado = "tratando";
        registrar("Procedimento aplicado pelo plantão");
        await espera(1600);
        e.estado = "ok"; a.alerta = b.alerta = 0;
        if (alertaEl) { alertaEl.textContent = "0"; alertaEl.className = ""; }
        registrar(`Enlace ${a.nome} ↔ ${b.nome} normalizado`, "ok");
        await espera(5200);
      }
    };

    new IntersectionObserver(([en]) => (visivel = en.isIntersecting)).observe(canvas);
    let redim;
    addEventListener("resize", () => { clearTimeout(redim); redim = setTimeout(montar, 200); });
    montar();
    if (reduzir) registrar("Operação em acompanhamento", "ok");
    else { requestAnimationFrame(passo); ciclo(); }
  }

  /* ── Topo e menu ──────────────────────────────────────────────────────── */
  const topo = document.querySelector(".topo");
  const aoRolar = () => topo && topo.classList.toggle("rolou", scrollY > 30);
  addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();
  const links = [...document.querySelectorAll(".menu a")];
  const obsMenu = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("atual", a.hash === `#${e.target.id}`));
  }), { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section[id]").forEach((s) => obsMenu.observe(s));

  /* ── Revelar e contadores ─────────────────────────────────────────────── */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); }
  }), { threshold: 0.15 });
  document.querySelectorAll(".revelar").forEach((el) => io.observe(el));

  const formatar = (n) => n.toLocaleString("pt-BR");
  const contar = (el) => {
    const alvo = +el.dataset.contar;
    if (reduzir) return (el.textContent = formatar(alvo));
    const ini = performance.now(), dur = 1800;
    const f = (t) => {
      const p = Math.min(1, (t - ini) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = formatar(Math.round(alvo * e));
      if (p < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  };
  const ioNum = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { contar(e.target); ioNum.unobserve(e.target); }
  }), { threshold: 0.6 });
  document.querySelectorAll("[data-contar]").forEach((el) => ioNum.observe(el));

  /* ── Café do plantão: mesma regra do site anterior, contando ao vivo ──── */
  // Parte de 5.726 em 14/07/2026 (Brasília). Dia útil: 1 café a cada 30 min até 7h,
  // 1 por minuto das 7h às 22h e 1 a cada 30 min depois. Fim de semana: 1 por hora.
  const cafeEl = document.querySelector("[data-cafe]");
  if (cafeEl) {
    const INICIO = new Date("2026-07-14T00:00:00-03:00"), BASE = 5726;
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
    const partes = (d) => {
      const t = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
      return { dia: `${t.year}-${t.month}-${t.day}`, fimDeSemana: t.weekday === "Sat" || t.weekday === "Sun", minuto: (t.hour === "24" ? 0 : +t.hour) * 60 + +t.minute };
    };
    const ateMinuto = (m, fimDeSemana) => fimDeSemana ? Math.floor(m / 60)
      : Math.floor(Math.min(m, 420) / 30) + Math.max(0, Math.min(m, 1320) - 420) + Math.floor(Math.max(0, m - 1320) / 30);
    const cafes = (agora = new Date()) => {
      if (agora <= INICIO) return BASE;
      const ini = partes(INICIO), fim = partes(agora), d = new Date(INICIO);
      let total = 0;
      for (;;) {
        const p = partes(d), primeiro = p.dia === ini.dia, ultimo = p.dia === fim.dia;
        total += ateMinuto(ultimo ? fim.minuto : 1440, p.fimDeSemana) - ateMinuto(primeiro ? ini.minuto : 0, p.fimDeSemana);
        if (ultimo) break;
        d.setUTCDate(d.getUTCDate() + 1);
      }
      return BASE + total;
    };
    let mostrado = null;
    const atualizarCafe = () => {
      const n = cafes();
      if (n === mostrado) return;
      if (mostrado !== null && !reduzir) { cafeEl.classList.remove("subiu"); void cafeEl.offsetWidth; cafeEl.classList.add("subiu"); }
      mostrado = n; cafeEl.textContent = formatar(n);
    };
    // conta a partir de zero quando aparece, depois segue ao vivo
    const ioCafe = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      ioCafe.disconnect();
      cafeEl.dataset.contar = cafes();
      contar(cafeEl);
      setTimeout(() => { atualizarCafe(); setInterval(atualizarCafe, 5000); }, reduzir ? 0 : 1900);
    }, { threshold: 0.6 });
    ioCafe.observe(cafeEl);
  }
  document.querySelectorAll("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ── Serviços: luz que segue o cursor ─────────────────────────────────── */
  document.querySelectorAll(".servico").forEach((c) => c.addEventListener("pointermove", (ev) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty("--mx", `${ev.clientX - r.left}px`);
    c.style.setProperty("--my", `${ev.clientY - r.top}px`);
  }));

  /* ── Cobertura: radar com 6 setores ───────────────────────────────────── */
  const setoresEl = document.querySelector("[data-setores]");
  const abas = [...document.querySelectorAll(".camada")];
  const rotulo = document.querySelector("[data-radar-rotulo]");
  if (setoresEl && abas.length) {
    const ns = "http://www.w3.org/2000/svg";
    const ponto = (r, g) => [r * Math.sin(g * Math.PI / 180), -r * Math.cos(g * Math.PI / 180)];
    const setores = abas.map((aba, i) => {
      const g0 = i * 60 + 2, g1 = (i + 1) * 60 - 2, R = 100, r = 18;
      const [x1, y1] = ponto(R, g0), [x2, y2] = ponto(R, g1), [x3, y3] = ponto(r, g1), [x4, y4] = ponto(r, g0);
      const p = document.createElementNS(ns, "path");
      p.setAttribute("d", `M${x4} ${y4}L${x1} ${y1}A${R} ${R} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r} ${r} 0 0 0 ${x4} ${y4}Z`);
      p.addEventListener("click", () => escolher(i, true));
      setoresEl.appendChild(p);
      // ativos monitorados dentro do setor
      for (let k = 0; k < 4; k++) {
        const [cx, cy] = ponto(30 + ((k * 37 + i * 13) % 62), i * 60 + 10 + ((k * 23 + i * 7) % 40));
        const c = document.createElementNS(ns, "circle");
        c.setAttribute("cx", cx.toFixed(1)); c.setAttribute("cy", cy.toFixed(1)); c.setAttribute("r", "2.2");
        c.style.animationDelay = `${k * 0.6}s`;
        setoresEl.appendChild(c);
        p._pontos = (p._pontos || []).concat(c);
      }
      return p;
    });
    let atual = 0, auto = !reduzir;
    function escolher(i, doUsuario) {
      if (doUsuario) auto = false;
      atual = i;
      abas.forEach((a, j) => a.setAttribute("aria-selected", String(j === i)));
      setores.forEach((s, j) => {
        s.classList.toggle("ativo", j === i);
        s._pontos.forEach((c) => c.classList.toggle("alvo", j === i));
      });
      if (rotulo) rotulo.textContent = abas[i].querySelector("strong").textContent;
    }
    abas.forEach((a, i) => {
      a.addEventListener("click", () => escolher(i, true));
      a.addEventListener("keydown", (ev) => {
        const d = ev.key === "ArrowDown" || ev.key === "ArrowRight" ? 1 : ev.key === "ArrowUp" || ev.key === "ArrowLeft" ? -1 : 0;
        if (d) { ev.preventDefault(); const n = (i + d + abas.length) % abas.length; escolher(n, true); abas[n].focus(); }
      });
    });
    escolher(0);
    // troca sozinho enquanto ninguém interage e a seção está na tela
    let radarNaTela = false;
    new IntersectionObserver(([e]) => (radarNaTela = e.isIntersecting)).observe(setoresEl.closest(".radar"));
    setInterval(() => { if (auto && radarNaTela) escolher((atual + 1) % abas.length); }, 4500);
  }

  /* ── NOC: o incidente avança conforme os passos entram na tela ────────── */
  const passos = [...document.querySelectorAll(".noc-passo")];
  if (passos.length) {
    const estadoEl = document.querySelector("[data-inc-estado]");
    const linha = document.querySelector("[data-inc-linha]");
    const crit = document.querySelector("[data-inc-crit]");
    const proc = document.querySelector("[data-inc-proc]");
    const resp = document.querySelector("[data-inc-resp]");
    const tempo = [...document.querySelectorAll("[data-inc-tempo] li")];
    // o que o cartão mostra em cada passo
    const quadros = [
      { estado: ["Evento validado", ""], linha: "", crit: ["Alta", "alta"], proc: ["—", ""], resp: ["—", ""], t: 1 },
      { estado: ["Em diagnóstico", "andamento"], linha: "quebrada", crit: ["Alta", "alta"], proc: ["Ativo", "sim"], resp: ["—", ""], t: 2 },
      { estado: ["Tratativa em execução", "andamento"], linha: "quebrada", crit: ["Alta", "alta"], proc: ["Ativo", "sim"], resp: ["—", ""], t: 2 },
      { estado: ["Escalonado", "andamento"], linha: "quebrada", crit: ["Alta", "alta"], proc: ["Ativo", "sim"], resp: ["Definido", "sim"], t: 3 },
      { estado: ["Em acompanhamento", "ok"], linha: "estavel", crit: ["Alta", "alta"], proc: ["Ativo", "sim"], resp: ["Definido", "sim"], t: 3 },
    ];
    const pintar = (el, [txt, cls]) => { el.textContent = txt; el.className = cls; };
    const mostrar = (i) => {
      const q = quadros[i];
      passos.forEach((p, j) => p.classList.toggle("ativo", j === i));
      estadoEl.textContent = q.estado[0]; estadoEl.className = `inc-estado ${q.estado[1]}`;
      linha.className = `inc-linha ${q.linha}`;
      pintar(crit, q.crit); pintar(proc, q.proc); pintar(resp, q.resp);
      tempo.forEach((li, j) => li.classList.toggle("feito", j <= q.t));
    };
    const obs = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) mostrar(passos.indexOf(e.target));
    }), { rootMargin: "-45% 0px -45% 0px" });
    passos.forEach((p) => obs.observe(p));
    mostrar(0);
  }

  /* ── Implantação: trilha acende com a rolagem ─────────────────────────── */
  const trilha = document.querySelector("[data-trilha]");
  if (trilha) {
    const itens = [...trilha.children];
    const atualizar = () => {
      const r = trilha.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / (r.height + innerHeight * 0.25)));
      trilha.style.setProperty("--progresso", reduzir ? 1 : p.toFixed(3));
      itens.forEach((li, i) => li.classList.toggle("aceso", reduzir || p >= i / (itens.length - 1) - 0.02));
    };
    addEventListener("scroll", () => requestAnimationFrame(atualizar), { passive: true });
    atualizar();
  }

  /* ── Formulário → /api/contato (mesmo contrato do site anterior) ──────── */
  const form = document.querySelector(".form");
  if (form) {
    const status = form.querySelector(".form-status");
    const botao = form.querySelector("button[type=submit]");
    const avisar = (txt, tipo) => { status.textContent = txt; status.className = `form-status campo--inteiro ${tipo || ""}`; };

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      let valido = true;
      form.querySelectorAll("[required]").forEach((c) => {
        const ok = c.type === "checkbox" ? c.checked
          : c.type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.value.trim())
          : c.value.trim().length > 1;
        (c.closest(".campo") || c.closest(".aceite")).classList.toggle("erro", !ok);
        if (!ok) valido = false;
      });
      if (!valido) return avisar("Confira os campos destacados.", "falha");

      botao.disabled = true;
      avisar("Enviando…");
      try {
        const r = await fetch("/api/contato", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.erro || "Não foi possível enviar sua mensagem.");
        }
        form.reset();
        avisar("Mensagem enviada. A equipe NEX3 retorna em breve.", "ok");
      } catch (e) {
        avisar(e instanceof Error ? e.message : "Erro inesperado.", "falha");
      } finally {
        botao.disabled = false;
      }
    });
  }
})();
