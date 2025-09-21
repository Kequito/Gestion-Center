// assets/bw/shell.js
/* ===========================================================
   GC Shell (BW) — sidebar + header + estilos base + guard
   Carga config dinámica con fallback para no romper la UI
   =========================================================== */

// ---------- BASE robusto ----------
const isGh  = location.hostname.endsWith("github.io");
const parts = location.pathname.split("/").filter(Boolean);
const repo  = isGh ? (parts[0] || "") : "";
const BASE  = isGh ? `/${repo}/` : "/";
const abs   = (p) => new URL(p.replace(/^\//, ""), location.origin + BASE).href;
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
function setActive(navEl) {
  const items = [...navEl.querySelectorAll(".nav-item")];
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  let active = items[0];
  items.forEach(a => {
    const href = (a.getAttribute("href") || "")
      .split("#")[0].split("/").pop().toLowerCase();
    if (href && href === current) active = a;
    a.classList.toggle("active", a === active);
    a.toggleAttribute("aria-current", a === active ? "page" : false);
  });
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
    const noAside   = this.hasAttribute("no-aside");   // 👈 soporte login sin sidebar
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
