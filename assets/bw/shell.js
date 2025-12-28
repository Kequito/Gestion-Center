// assets/bw/shell.js
/* ===========================================================
   GC Shell (BW) — sidebar + header + estilos base + guard
   ✅ HOME forzado a https://kequito.github.io/Gestion-Center/
   ✅ RoleCard con claim "rank" (admin/supervisor/tl/invitado)
   ✅ Sidebar con visibilidad por roles
   ✅ Hero:
      - Sin subtítulo por defecto
      - Título AUTO desde .page-title / h1 / h2 (o hero-title)
      - Si se usó auto, oculta la .page-title duplicada
   ✅ Refuerzo: asegura "Delta Report" y "Delta Report 2" en Reportes
   =========================================================== */

const HOME_ABS = "https://kequito.github.io/Gestion-Center/";
const PREFERRED_REPO = "Gestion-Center";

/* ---------------- Ready hook global (nuevo) ----------------
   Permite a las páginas ejecutar código cuando el shell terminó
   de pintar el DOM definitivo sin perder listeners.
---------------------------------------------------------------- */
window.__GC_READY__ = false;
const __gcReadyQueue = [];
window.gcOnReady = function (fn) {
  if (typeof fn !== "function") return;
  if (window.__GC_READY__) {
    try { fn(); } catch (e) { console.error("[gc-shell] ready fn error:", e); }
  } else {
    __gcReadyQueue.push(fn);
  }
};

/* ---------------- BASE ---------------- */
function readMetaBase(){ const m = document.querySelector('meta[name="gc-base"]'); return m?.content || ""; }
function ensureSlash(u){ return u.endsWith("/") ? u : (u + "/"); }
function isValidAbsoluteBase(u){
  try{
    const url = new URL(u);
    if (url.origin !== location.origin) return false;
    if (/\.html($|\/)/i.test(url.pathname)) return false;
    return true;
  }catch{ return false; }
}
function computeBase(){
  const hinted = window.__GC_BASE__;
  if (hinted && isValidAbsoluteBase(hinted)) return ensureSlash(hinted);

  const meta = readMetaBase();
  if (meta){
    const abs = new URL(meta.replace(/^\//,""), location.origin).href;
    if (isValidAbsoluteBase(abs)) return ensureSlash(abs);
  }

  const host  = location.hostname;
  const segs  = location.pathname.split("/").filter(Boolean);

  if (host.endsWith("github.io")){
    const repo = segs[0] || "";
    if (repo && !/\.html?$/i.test(repo)) return `${location.origin}/${repo}/`;
    return `${location.origin}/${PREFERRED_REPO}/`;
  }

  const idx = segs.indexOf(PREFERRED_REPO);
  if (idx !== -1){
    const basePath = `/${segs.slice(0, idx + 1).join("/")}/`;
    return `${location.origin}${basePath}`;
  }
  return `${location.origin}/${PREFERRED_REPO}/`;
}
const BASE = computeBase();
const abs  = (p) => new URL(String(p||"").replace(/^\//,""), BASE).href;
window.__GC_BASE__ = BASE;

/* ---------------- helpers nav/config ---------------- */
function ensureDeltaReportInConfig(cfg){
  if (!cfg || !Array.isArray(cfg.nav)) return cfg;

  // Buscar grupo "Reportes"
  const reportsIdx = cfg.nav.findIndex(e => e?.type === "group" && /reportes/i.test(e.title||""));
  if (reportsIdx === -1) return cfg;

  const grp = cfg.nav[reportsIdx];
  grp.items ||= [];

  // Helpers de existencia
  const hasDelta1 = grp.items.some(it =>
    /reports\/deltareport\.html$/i.test(it?.href||"") || /delta\s*report(?!\s*2)/i.test(it?.label||"")
  );
  const hasDelta2 = grp.items.some(it =>
    /reports\/deltareport2\.html$/i.test(it?.href||"") || /delta\s*report\s*2/i.test(it?.label||"")
  );

  // Inyectar si faltan
  if (!hasDelta1){
    grp.items.push({ href: "reports/deltareport.html",  icon: "📈", label: "Delta Report" });
  }
  if (!hasDelta2){
    grp.items.push({ href: "reports/deltareport2.html", icon: "📊", label: "Delta Report 2" });
  }

  cfg.nav[reportsIdx] = grp;
  return cfg;
}

/* ---------------- Config ---------------- */
async function loadConfig() {
  try {
    const mod = await import(abs("assets/bw/gc.config.js"));
    let cfg = mod?.GC_CONFIG || mod?.default;
    if (!cfg) throw new Error("GC_CONFIG vacío");

    // Forzar home
    cfg.brand ||= {};
    cfg.brand.homeHref = HOME_ABS;

    // Forzar que el link de "Inicio" (si aparece como link suelto) vaya al HOME_ABS
    if (Array.isArray(cfg.nav)) {
      cfg.nav = cfg.nav.map(entry => {
        if (entry?.type === "link" && /inicio/i.test(entry.label || "")) {
          return { ...entry, href: HOME_ABS };
        }
        return entry;
      });
    }

    // Refuerzo: asegurar presencia de Delta Report y Delta Report 2
    cfg = ensureDeltaReportInConfig(cfg);

    return cfg;
  } catch (e) {
    console.warn("[gc-shell] gc.config.js no disponible, uso fallback:", e);
    return {
      brand: {
        homeHref: HOME_ABS,
        logoWebp: "images/logo1.webp",
        logoPng : "images/logogestioncenter.png",
      },
      heroDefault: {
        title: "Hola Kevin, listo para romperla hoy 💪",
        subtitle: "Sesión verificada ✅ | Accesos rápidos y estado general.",
      },
      nav: [
        { type: "link", id: "home", label: "Inicio", icon: "🏠", href: HOME_ABS },
        { type: "group", id: "grp-reportes", title: "Reportes",
          items: [
            { label: "New Report",         icon: "🧰", href: "reports/newreport.html" },
            { label: "New Report",         icon: "🔧", href: "reports/leadstable.html" },
            { label: "Post-Sale Report",   icon: "🚚", href: "reports/psreport.html" },
            { label: "Delta Report",       icon: "📈", href: "reports/deltareport.html" },
            { label: "Delta Report 2",     icon: "📊", href: "reports/deltareport2.html" }, // ← nuevo
          ]},
        { type: "group", id: "grp-operaciones", title: "Operaciones",
          items: [
            { label: "Distribución",        icon: "📋", href: "operations/distribucion.html" },
            { label: "BI de OPs + Links",   icon: "🔗", href: "operations/biops.html" },
          ]},
        { type: "group", id: "grp-cobertura", title: "Cobertura",
          items: [
            { label: "Mapa de cobertura",   icon: "🗺️", href: "cobertura.html" },
            { label: "New Cobertura 1.1",   icon: "🧭", href: "newcobertura.html" },
          ]},
        { type: "group", id: "grp-utils", title: "Utilidades",
          items: [
            { label: "Selector de Apoyo 2.0", icon: "👥", href: "utilities/camprev.html" },
          ]},
        { type: "group", id: "grp-admin", title: "Admin", roles:["admin"],
          items: [
            { label: "Panel de roles", icon: "🛡️", href: "admin/panelderoles.html", roles:["admin"] }
          ]},
      ],
    };
  }
}

/* -------- head + guard + estándar thead -------- */
async function ensureGuardAndHead() {
  const head = document.head;

  if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
    head.insertAdjacentHTML("beforeend",
      `<link rel="preconnect" href="https://fonts.googleapis.com">
       <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
       <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600;700&display=swap" rel="stylesheet">`);
  }
  if (!document.querySelector('link[data-gc="bw.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.setAttribute("data-gc", "bw.css");
    link.href = abs("assets/bw/bw.css");
    head.appendChild(link);
  }
  if (!document.querySelector('style[data-gc="thead-std"]')) {
    const st = document.createElement("style");
    st.setAttribute("data-gc", "thead-std");
    st.textContent = `main table thead th{ background:#000; color:#fff !important; }`;
    head.appendChild(st);
  }

  if (!document.documentElement.style.visibility)
    document.documentElement.style.visibility = "hidden";
  const watchdog = setTimeout(()=>{ document.documentElement.style.visibility = "visible"; }, 2500);

  try { await import(abs("assets/guard.js")); }
  catch (e) {
    console.warn("[gc-shell] guard no cargó, fallback visible:", e);
    if (typeof window.gcLogout !== "function") {
      window.gcLogout = () => { location.href = abs("login.html"); };
    }
    document.documentElement.style.visibility = "visible";
  }
  finally { clearTimeout(watchdog); }
}

/* ---------------- Helpers nav ---------------- */
function normalizePathname(p){
  let out = (p || "/").replace(/\/{2,}/g, "/");
  if (out.endsWith("/index.html")) out = out.slice(0, -"/index.html".length) + "/";
  return out;
}
function setActive(navEl) {
  const items   = [...navEl.querySelectorAll(".nav-item")];
  const current = normalizePathname(location.pathname);

  let active = null;
  items.forEach(a => {
    const hrefAttr = a.getAttribute("href") || a.href || "";
    const ap = normalizePathname(new URL(hrefAttr, location.href).pathname);
    const match = (ap === current);
    if (match) active = a;
    a.classList.toggle("active", match);
    a.toggleAttribute("aria-current", match ? "page" : false);
  });

  if (!active){
    const currFile = current.split("/").pop() || "index.html";
    items.forEach(a=>{
      const ap = normalizePathname(new URL(a.getAttribute("href") || a.href || "", location.href).pathname);
      const file = ap.split("/").pop() || "index.html";
      const match = (file === currFile);
      a.classList.toggle("active", match);
      a.toggleAttribute("aria-current", match ? "page" : false);
      if (match && !active) active = a;
    });
  }
}

/* ---------------- Role helpers ---------------- */
function normalizeRoleKey(raw){
  const r = String(raw || "").toLowerCase();
  if (r === "admin") return "admin";
  if (r === "supervisor") return "supervisor";
  if (r === "tl") return "tl";
  return "invitado";
}
const ROLE_UI = {
  admin:      { name: "Admin",       color: "#ef4444", desc: "Acceso total" },
  supervisor: { name: "Supervisor",  color: "#a855f7", desc: "Gestión avanzada" },
  tl:         { name: "Team Leader", color: "#3b82f6", desc: "Lidera un equipo" },
  invitado:   { name: "Invitado",    color: "#22c55e", desc: "Acceso limitado" },
};
async function readRankClaim(){
  try{
    let auth = window.gcAuth;
    if (!auth){
      const mod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      auth = mod.getAuth();
    }
    if (!auth?.currentUser) return null;
    const t = await auth.currentUser.getIdTokenResult(true);
    return t?.claims?.rank ?? null;
  }catch{ return null; }
}
function paintRoleCard(root, normalizedKey){
  const roleDot   = root.querySelector("#roleDot");
  const roleName  = root.querySelector("#roleName");
  const roleDesc  = root.querySelector("#roleDesc");
  const roleBadge = root.querySelector("#roleBadge");
  const ui = ROLE_UI[normalizedKey] || ROLE_UI.invitado;

  if (roleDot) roleDot.style.background = ui.color;
  if (roleName) roleName.textContent    = ui.name;
  if (roleBadge) roleBadge.textContent  = ui.name;
  if (roleDesc)  roleDesc.textContent   = ui.desc;

  try{ localStorage.setItem("gc-role", ui.name); }catch{}
}
async function paintRoleFromAuth(root){
  const rank = await readRankClaim();
  const key  = normalizeRoleKey(rank);
  paintRoleCard(root, key);
  return key;
}
function isAllowedFor(roleKey, allowedList=[]) {
  const roles = (allowedList || []).map(r => String(r||"").toLowerCase());
  if (roles.length === 0) return true;
  return roles.includes(roleKey);
}
function applyRoleVisibility(root, roleKey) {
  root.querySelectorAll("[data-roles]").forEach(el => {
    const roles = (el.getAttribute("data-roles") || "")
      .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    el.style.display = isAllowedFor(roleKey, roles) ? "" : "none";
  });
}

/* --------------- Sidebar --------------- */
function buildSidebar(CFG) {
  const b = CFG.brand || {};
  const navHTML = (CFG.nav || []).map(entry => {
    if (entry.type === "link") {
      const href  = /inicio/i.test(entry.label || "") ? HOME_ABS : abs(entry.href);
      const roles = Array.isArray(entry.roles) ? entry.roles.join(",") : "";
      const needs = roles ? ` data-roles="${roles}" style="display:none"` : "";
      return `<a class="nav-item" href="${href}" title="${entry.label}"${needs}>
        ${entry.icon || ""} <span class="label">${entry.label}</span></a>`;
    }
    const roles = Array.isArray(entry.roles) ? entry.roles.join(",") : "";
    const groupNeeds = roles ? ` data-roles="${roles}" style="display:none"` : "";
    const items = (entry.items || []).map(it=>{
      const itemRoles = Array.isArray(it.roles) ? it.roles.join(",") : "";
      const itemNeeds = itemRoles ? ` data-roles="${itemRoles}" style="display:none"` : "";
      return `<a class="nav-item" href="${abs(it.href)}" title="${it.label}"${itemNeeds}>
        ${it.icon || ""} <span class="label">${it.label}</span></a>`;
    }).join("");

    return `<section class="nav-group" data-key="${entry.id || ''}"${groupNeeds}>
      <button class="nav-head" aria-expanded="true" title="${entry.title}">
        <span class="chev">▾</span> <span class="txt">${entry.title}</span>
      </button>
      <div class="nav-body"><div class="nav-body-inner">${items}</div></div>
    </section>`;
  }).join("");

  return `
  <aside id="gc-aside">
    <a class="brand" href="${HOME_ABS}" id="brandLink" aria-label="Inicio" title="Inicio">
      <picture>
        <source srcset="${abs(b.logoWebp || "images/logo1.webp")}" type="image/webp"/>
        <img id="brandLogo" src="${abs(b.logoPng || "images/logogestioncenter.png")}" alt="Gestión Center" loading="lazy" decoding="async"/>
      </picture>
    </a>
    <button class="sidebar-toggle" id="btnSidebarToggle" aria-pressed="false" title="Compactar / Expandir">
      <span class="icon">⇆</span><span class="lbl">Cambiar ancho</span>
    </button>
    <nav id="gc-nav" role="navigation" aria-label="Navegación principal">${navHTML}</nav>
    <div class="spacer"></div>
    <div class="role-card" id="roleCard" title="Rango del usuario">
      <div class="role-dot" id="roleDot"></div>
      <div class="role-text">
        <strong id="roleName">Invitado</strong>
        <span class="role-badge" id="roleBadge" style="margin-left:6px">Invitado</span><br/>
        <small id="roleDesc">Acceso limitado</small>
      </div>
    </div>
    <button class="logout" onclick="gcLogout()">Salir</button>
  </aside>`;
}
function wireSidebar(root) {
  const nav = root.querySelector("#gc-nav");
  setActive(nav);
  window.addEventListener("popstate", () => setActive(nav));

  nav.querySelectorAll(".nav-group").forEach(g => {
    const key = g.dataset.key; const head = g.querySelector(".nav-head");
    const saved = localStorage.getItem(key);
    if (saved === "0") { g.classList.add("is-collapsed"); head.setAttribute("aria-expanded","false"); }
    head.addEventListener("click", (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      const col = g.classList.toggle("is-collapsed");
      head.setAttribute("aria-expanded", col ? "false" : "true");
      localStorage.setItem(key, col ? "0" : "1");
    });
  });

  const btn = root.querySelector("#btnSidebarToggle");
  const compactKey = "gc-sidebar-compact";
  function setCompactState(on) {
    document.body.classList.toggle("sidebar-compact", !!on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    localStorage.setItem(compactKey, on ? "1" : "0");
  }
  btn.addEventListener("click", () => setCompactState(!document.body.classList.contains("sidebar-compact")));
  setCompactState(localStorage.getItem(compactKey) === "1");
}

/* ---------- Utilidad: sacar título del contenido ---------- */
function extractTitleFromHtml(html){
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const el = tmp.querySelector('[data-hero-title], .page-title, h1, h2');
  return (el?.textContent || "").trim();
}

/* ---------------- Web Component ---------------- */
class GCShell extends HTMLElement {
  async connectedCallback() {
    await ensureGuardAndHead();
    const CFG = await loadConfig();

    const heroOff   = this.getAttribute("hero") === "off";
    const noAside   = this.hasAttribute("no-aside");

    // Contenido original del usuario (antes de reescribir)
    const userContent = this.innerHTML;

    // 🎯 HERO: título auto y sin subtítulo por defecto
    const extractedTitle = extractTitleFromHtml(userContent);
    const attrTitle = (this.getAttribute("hero-title") || "").trim();
    const heroTitle = attrTitle || extractedTitle || (CFG.heroDefault?.title || "");
    const heroSub   = (this.getAttribute("hero-subtitle") || "").trim(); // <- sin fallback

    // Si no hay aside y no se ha puesto override, ajustar padding main
    if (noAside && !document.querySelector('style[data-gc="no-aside-ov"]')) {
      const st = document.createElement("style");
      st.setAttribute("data-gc", "no-aside-ov");
      st.textContent = `main{ margin-left:0 !important; padding:24px 22px 40px; }`;
      document.head.appendChild(st);
    }

    // Pintar layout
    this.innerHTML = `
      ${noAside ? "" : buildSidebar(CFG)}
      <main>
        ${heroOff || noAside ? "" : `
          <section class="hero">
            <h1>${heroTitle}</h1>
            ${heroSub ? `<p>${heroSub}</p>` : ``}
          </section>`}
        ${userContent}
      </main>
    `;

    // Si el título vino de .page-title (auto), ocultamos esa .page-title para no duplicar
    if (!attrTitle && extractedTitle){
      const src = this.querySelector('.page-title, [data-hero-title]');
      if (src) src.style.display = 'none';
    }

    if (!noAside) wireSidebar(this);

    // Role: fallback rápido con último valor
    try{
      const last = localStorage.getItem("gc-role");
      if (last){
        const map = { Admin:"#ef4444", Supervisor:"#a855f7", "Team Leader":"#3b82f6", Invitado:"#22c55e" };
        const roleDot   = this.querySelector("#roleDot");
        const roleName  = this.querySelector("#roleName");
        const roleDesc  = this.querySelector("#roleDesc");
        const roleBadge = this.querySelector("#roleBadge");
        if (roleName)  roleName.textContent  = last;
        if (roleBadge) roleBadge.textContent = last;
        if (roleDot)   roleDot.style.background = map[last] || "#737373";
        if (roleDesc)  roleDesc.textContent  = (last === "Invitado" ? "Acceso limitado" : "");
      }
    }catch{}

    try {
      const roleKey = await paintRoleFromAuth(this);
      applyRoleVisibility(this, roleKey);
    } catch (e) {
      console.warn("[gc-shell] No se pudo leer el claim de rol:", e);
      paintRoleCard(this, "invitado");
      applyRoleVisibility(this, "invitado");
    }

    try { document.documentElement.style.visibility = "visible"; } catch {}

    // ---- NUEVO: Señalizar ready y ejecutar cola de callbacks ----
    try {
      window.__GC_READY__ = true;
      const q = __gcReadyQueue.splice(0);
      for (const fn of q) { try { fn(); } catch (e) { console.error("[gc-shell] ready fn error:", e); } }
      // Evento por si alguien prefiere escuchar con addEventListener
      window.dispatchEvent(new CustomEvent("gc:shell-ready", { detail: { base: BASE } }));
    } catch (e) {
      console.warn("[gc-shell] error al disparar ready:", e);
    }
  }
}
customElements.define("gc-shell", GCShell);
