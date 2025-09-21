// assets/bw/shell.js
/* ===========================================================
   GC Shell (BW) — sidebar + header + estilos base + guard
   BASE robusta + nav absoluto + activo correcto
   =========================================================== */

// ---------- BASE robusto ----------
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

  // Fallback a subcarpeta preferida (útil mientras no mapees el dominio a la raíz del repo)
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
    return cfg;
  } catch (e) {
    console.warn("[gc-shell] gc.config.js no disponible, uso fallback:", e);
    return {
      brand: {
        homeHref: "index.html",
        logoWebp: "images/logo1.webp",
        logoPng : "images/logogestioncenter.png",
      },
      heroDefault: {
        title: "Hola Kevin, listo para romperla hoy 💪",
        subtitle: "Sesión verificada ✅ | Accesos rápidos y estado general.",
      },
      nav: [
        { type: "link", id: "home", label: "Inicio", icon: "🏠", href: "index.html" },
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
  // quita dobles slash, normaliza index.html y slash final
  let out = (p || "/").replace(/\/{2,}/g, "/");
  if (out.endsWith("/index.html")) out = out.slice(0, -"/index.html".length) + "/";
  return out;
}

function setActive(navEl) {
  const items = [...navEl.querySelectorAll(".nav-item")];
  const current = normalizePathname(location.pathname);

  let active = null;
  items.forEach(a => {
    const href = a.getAttribute("href") || a.href || "";
    // Siempre resolvemos absoluto y comparamos pathname normalizados
    const ap = normalizePathname(new URL(href, location.href).pathname);
    const match = (ap === current);
    if (match) active = a;
    a.classList.toggle("active", match);
    a.toggleAttribute("aria-current", match ? "page" : false);
  });

  // Si nada coincidió exactamente (ej. deep-link), intenta por "base filename"
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

function buildSidebar(CFG) {
  const b = CFG.brand || {};
  const navHTML = (CFG.nav || []).map(entry => {
    if (entry.type === "link") {
      return `<a class="nav-item" href="${abs(entry.href)}" title="${entry.label}">
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

  return `
  <aside id="gc-aside">
    <a class="brand" href="${abs(b.homeHref || "index.html")}" id="brandLink" aria-label="Inicio" title="Inicio">
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

// ---------- Web Component (única definición, soporte no-aside) ----------
class GCShell extends HTMLElement {
  async connectedCallback() {
    await ensureGuardAndHead();
    const CFG = await loadConfig();

    const heroOff   = this.getAttribute("hero") === "off";
    const noAside   = this.hasAttribute("no-aside");   // soporte login sin sidebar
    const heroTitle = this.getAttribute("hero-title") || (CFG.heroDefault?.title || "");
    const heroSub   = this.getAttribute("hero-subtitle") || (CFG.heroDefault?.subtitle || "");

    const userContent = this.innerHTML;

    // Si no-aside, override de main
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

    // Role (gris simple)
    const roleDot  = this.querySelector("#roleDot");
    const roleName = this.querySelector("#roleName");
    const roleDesc = this.querySelector("#roleDesc");
    const roleBadge= this.querySelector("#roleBadge");
    if (roleDot && roleName && roleDesc && roleBadge){
      const ls = (localStorage.getItem("gc-role") || "Invitado");
      roleDot.style.background = "#737373";
      roleName.textContent = ls;
      roleDesc.textContent = (ls === "Invitado" ? "Acceso limitado" : "");
      roleBadge.textContent = ls;
    }

    try { document.documentElement.style.visibility = "visible"; } catch {}
  }
}
customElements.define("gc-shell", GCShell);
