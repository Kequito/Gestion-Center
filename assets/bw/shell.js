// assets/bw/shell.js
/* ===========================================================
   GC Shell (BW) — sidebar + header + estilos base + guard
   ✅ Enlaces de "Inicio" y logo forzados a:
      https://kequito.github.io/Gestion-Center/
   ✅ RoleCard: muestra rango real (claim "rank") con color
   =========================================================== */

// ---------- Constante HOME ABSOLUTA (pedido del usuario) ----------
const HOME_ABS = "https://kequito.github.io/Gestion-Center/";

// ---------- BASE robusto (para assets y demás páginas internas) ----------
const PREFERRED_REPO = "Gestion-Center";

function readMetaBase(){
  const m = document.querySelector('meta[name="gc-base"]');
  return m?.content || "";
}
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
  // 0) Override expuesto por otras piezas (guard, login)
  const hinted = window.__GC_BASE__;
  if (hinted && isValidAbsoluteBase(hinted)) return ensureSlash(hinted);

  // 1) meta gc-base como plan B (relativa a origin)
  const meta = readMetaBase();
  if (meta){
    const abs = new URL(meta.replace(/^\//,""), location.origin).href;
    if (isValidAbsoluteBase(abs)) return ensureSlash(abs);
  }

  // 2) Detección por entorno
  const host  = location.hostname;
  const segs  = location.pathname.split("/").filter(Boolean);

  if (host.endsWith("github.io")){
    const repo = segs[0] || "";
    if (repo && !/\.html?$/i.test(repo)) return `${location.origin}/${repo}/`;
    return `${location.origin}/${PREFERRED_REPO}/`;
  }

  // Dominio propio: si estamos ya dentro de /Gestion-Center/, respétalo
  const idx = segs.indexOf(PREFERRED_REPO);
  if (idx !== -1){
    const basePath = `/${segs.slice(0, idx + 1).join("/")}/`;
    return `${location.origin}${basePath}`;
  }

  // Fallback a subcarpeta preferida
  return `${location.origin}/${PREFERRED_REPO}/`;
}

const BASE = computeBase();
const abs  = (p) => new URL(String(p||"").replace(/^\//,""), BASE).href;

// Exponer para otros módulos
window.__GC_BASE__ = BASE;

// ---------- Cargar configuración dinámica con fallback ----------
async function loadConfig() {
  try {
    const mod = await import(abs("assets/bw/gc.config.js"));
    const cfg = mod?.GC_CONFIG || mod?.default;
    if (!cfg) throw new Error("GC_CONFIG vacío");

    // 🔒 Forzar home/Inicio a HOME_ABS
    if (!cfg.brand) cfg.brand = {};
    cfg.brand.homeHref = HOME_ABS;

    // Además, si existe un item "Inicio" de tipo link con href "index.html", lo forzamos
    if (Array.isArray(cfg.nav)) {
      cfg.nav = cfg.nav.map(entry => {
        if (entry?.type === "link" && /inicio/i.test(entry.label || "")) {
          return { ...entry, href: HOME_ABS };
        }
        return entry;
      });
    }

    return cfg;
  } catch (e) {
    console.warn("[gc-shell] gc.config.js no disponible, uso fallback:", e);
    return {
      brand: {
        homeHref: HOME_ABS, // ⬅️ forzado
        logoWebp: "images/logo1.webp",
        logoPng : "images/logogestioncenter.png",
      },
      heroDefault: {
        title: "Hola Kevin, listo para romperla hoy 💪",
        subtitle: "Sesión verificada ✅ | Accesos rápidos y estado general.",
      },
      nav: [
        // ⬇️ “Inicio” forzado a HOME_ABS
        { type: "link", id: "home", label: "Inicio", icon: "🏠", href: HOME_ABS },
        {
          type: "group",
          id: "grp-reportes",
          title: "Reportes",
          items: [
            { label: "New Report", icon: "🧰", href: "reports/newreport.html" },
            { label: "Post-Sale Report", icon: "🚚", href: "reports/psreport.html" },
          ],
        },
        {
          type: "group",
          id: "grp-operaciones",
          title: "Operaciones",
          items: [
            { label: "Distribución", icon: "📋", href: "operations/distribucion.html" },
            { label: "BI de OPs + Links", icon: "🔗", href: "operations/biops.html" },
          ],
        },
        {
          type: "group",
          id: "grp-cobertura",
          title: "Cobertura",
          items: [
            { label: "Mapa de cobertura", icon: "🗺️", href: "cobertura.html" },
            { label: "New Cobertura 1.1", icon: "🧭", href: "newcobertura.html" },
          ],
        },
        {
          type: "group",
          id: "grp-utils",
          title: "Utilidades",
          items: [
            { label: "Selector de Apoyo 2.0", icon: "👥", href: "utilities/camprev.html" },
          ],
        },
      ],
    };
  }
}

// ---------- Inyectar fuente + CSS + guard, y gestionar visibilidad ----------
async function ensureGuardAndHead() {
  const head = document.head;

  // Fuente
  if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
    head.insertAdjacentHTML(
      "beforeend",
      `<link rel="preconnect" href="https://fonts.googleapis.com">
       <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
       <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600;700&display=swap" rel="stylesheet">`
    );
  }

  // CSS principal
  if (!document.querySelector('link[data-gc="bw.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.setAttribute("data-gc", "bw.css");
    link.href = abs("assets/bw/bw.css");
    head.appendChild(link);
  }

  // Encabezados de tablas (estándar global invertido)
  if (!document.querySelector('style[data-gc="thead-std"]')) {
    const st = document.createElement("style");
    st.setAttribute("data-gc", "thead-std");
    st.textContent = `
      main table thead th{
        background:#000; color:#fff !important;
      }
    `;
    head.appendChild(st);
  }

  // Ocultar mientras valida (si la página no lo hizo)
  if (!document.documentElement.style.visibility)
    document.documentElement.style.visibility = "hidden";

  const watchdog = setTimeout(() => {
    document.documentElement.style.visibility = "visible";
  }, 2500);

  // Guard
  try {
    await import(abs("assets/guard.js"));
  } catch (e) {
    console.warn("[gc-shell] guard no cargó, fallback visible:", e);
    if (typeof window.gcLogout !== "function") {
      window.gcLogout = () => { location.href = abs("login.html"); };
    }
    document.documentElement.style.visibility = "visible";
  } finally {
    clearTimeout(watchdog);
  }
}

// ---------- Helpers ----------
function normalizePathname(p){
  let out = (p || "/").replace(/\/{2,}/g, "/");
  if (out.endsWith("/index.html")) out = out.slice(0, -"/index.html".length) + "/";
  return out;
}

function setActive(navEl) {
  const items = [...navEl.querySelectorAll(".nav-item")];
  const current = normalizePathname(location.pathname);

  let active = null;
  items.forEach(a => {
    const hrefAttr = a.getAttribute("href") || a.href || "";
    // Resolver absoluto (soporta HOME_ABS externo)
    const ap = normalizePathname(new URL(hrefAttr, location.href).pathname);
    const match = (ap === current);
    if (match) active = a;
    a.classList.toggle("active", match);
    a.toggleAttribute("aria-current", match ? "page" : false);
  });

  // Si no coincidió nada exacto, intentar por archivo base
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

// ---------- Role helpers (UI) ----------
/**
 * Normaliza el claim a uno de los 4 estados visuales.
 * - admin        -> Admin (rojo)
 * - supervisor   -> Supervisor (morado)
 * - tl           -> Team Leader (azul)
 * - viewer/op/undefined -> Invitado (verde)
 */
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
    // Preferimos el auth expuesto por guard.js
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

  roleDot.style.background = ui.color;
  roleName.textContent     = ui.name;
  roleBadge.textContent    = ui.name;
  roleDesc.textContent     = ui.desc;

  // para estilos condicionales si quieres
  const card = root.querySelector("#roleCard");
  if (card){
    card.dataset.role = normalizedKey;  // ej: data-role="admin"
  }

  // Guarda último valor como fallback
  try{ localStorage.setItem("gc-role", ui.name); }catch{}
}

async function paintRoleFromAuth(root){
  const rank = await readRankClaim();             // ej: "admin" | "supervisor" | "tl" | null
  const key  = normalizeRoleKey(rank);            // -> "admin"/"supervisor"/"tl"/"invitado"
  paintRoleCard(root, key);
}

function buildSidebar(CFG) {
  const b = CFG.brand || {};
  const navHTML = (CFG.nav || []).map(entry => {
    if (entry.type === "link") {
      // Si el label es Inicio, forzar HOME_ABS
      const href = /inicio/i.test(entry.label || "") ? HOME_ABS : abs(entry.href);
      return `<a class="nav-item" href="${href}" title="${entry.label}">
        ${entry.icon || ""} <span class="label">${entry.label}</span></a>`;
    }
    const items = (entry.items || [])
      .map(it => `<a class="nav-item" href="${abs(it.href)}" title="${it.label}">
        ${it.icon || ""} <span class="label">${it.label}</span></a>`).join("");
    return `<section class="nav-group" data-key="${entry.id}">
      <button class="nav-head" aria-expanded="true" title="${entry.title}">
        <span class="chev">▾</span> <span class="txt">${entry.title}</span>
      </button>
      <div class="nav-body"><div class="nav-body-inner">${items}</div></div>
    </section>`;
  }).join("");

  // 🔒 Logo/brand siempre a HOME_ABS
  const brandHref = HOME_ABS;

  return `
  <aside id="gc-aside">
    <a class="brand" href="${brandHref}" id="brandLink" aria-label="Inicio" title="Inicio">
      <picture>
        <source srcset="${abs(b.logoWebp || "images/logo1.webp")}" type="image/webp"/>
        <img id="brandLogo" src="${abs(b.logoPng || "images/logogestioncenter.png")}" alt="Gestión Center" loading="lazy" decoding="async"/>
      </picture>
    </a>
    <button class="sidebar-toggle" id="btnSidebarToggle" aria-pressed="false" title="Compactar / Expandir">
      <span class="icon">⇆</span><span class="lbl">Cambiar ancho</span>
    </button>
    <nav id="gc-nav" role="navigation" aria-label="Navegación principal">
      ${navHTML}
    </nav>
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

  // Colapsables con memoria
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

  // Compacto
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

// ---------- Web Component ----------
class GCShell extends HTMLElement {
  async connectedCallback() {
    await ensureGuardAndHead();
    const CFG = await loadConfig();

    const heroOff   = this.getAttribute("hero") === "off";
    const noAside   = this.hasAttribute("no-aside");
    const heroTitle = this.getAttribute("hero-title") || (CFG.heroDefault?.title || "");
    const heroSub   = this.getAttribute("hero-subtitle") || (CFG.heroDefault?.subtitle || "");

    const userContent = this.innerHTML;

    if (noAside && !document.querySelector('style[data-gc="no-aside-ov"]')) {
      const st = document.createElement("style");
      st.setAttribute("data-gc", "no-aside-ov");
      st.textContent = `
        main{ margin-left:0 !important; padding:24px 22px 40px; }
      `;
      document.head.appendChild(st);
    }

    this.innerHTML = `
      ${noAside ? "" : buildSidebar(CFG)}
      <main>
        ${heroOff || noAside ? "" : `
          <section class="hero">
            <h1>${heroTitle}</h1>
            <p>${heroSub}</p>
          </section>`}
        ${userContent}
      </main>
    `;

    if (!noAside) wireSidebar(this);

    // ===== RoleCard: pintar con claim real / fallback LS =====
    const roleDot   = this.querySelector("#roleDot");
    const roleName  = this.querySelector("#roleName");
    const roleDesc  = this.querySelector("#roleDesc");
    const roleBadge = this.querySelector("#roleBadge");

    // Fallback inmediato con último valor
    try{
      const last = localStorage.getItem("gc-role");
      if (last && roleName && roleBadge){
        // color por nombre (aprox), sólo por no dejar en gris si hay algo previo
        const map = { Admin:"#ef4444", Supervisor:"#a855f7", "Team Leader":"#3b82f6", Invitado:"#22c55e" };
        roleName.textContent = last;
        roleBadge.textContent = last;
        if (roleDot) roleDot.style.background = map[last] || "#737373";
        if (roleDesc) roleDesc.textContent = (last === "Invitado" ? "Acceso limitado" : "");
      }
    }catch{}

    // Pintar con dato real del token
    try {
      await paintRoleFromAuth(this);
    } catch (e) {
      console.warn("[gc-shell] No se pudo leer el claim de rol:", e);
      // Si algo falla, al menos dejar "Invitado" en verde
      paintRoleCard(this, "invitado");
    }

    try { document.documentElement.style.visibility = "visible"; } catch {}
  }
}
customElements.define("gc-shell", GCShell);
