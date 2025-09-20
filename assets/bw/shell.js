import { GC_CONFIG } from "./gc.config.js";

// BASE robusto (GitHub Pages repo vs dominio propio)
const isGh = location.hostname.endsWith("github.io");
const parts = location.pathname.split("/").filter(Boolean);
const repo  = isGh ? (parts[0] || "") : "";
const BASE  = isGh ? `/${repo}/` : "/";
const abs   = (p) => new URL(p.replace(/^\//, ""), location.origin + BASE).href;

/* ===== Carga guard + fuente + bw.css y maneja visibilidad ===== */
async function ensureGuardAndHead() {
  const head = document.head;

  // Fuente
  if (!document.querySelector('link[href*="fonts.googleapis.com"]')) {
    head.insertAdjacentHTML("beforeend",
      `<link rel="preconnect" href="https://fonts.googleapis.com">
       <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
       <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600;700&display=swap" rel="stylesheet">`);
  }
  // CSS
  if (!document.querySelector('link[data-gc="bw.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.setAttribute("data-gc", "bw.css");
    link.href = abs("assets/bw/bw.css");
    head.appendChild(link);
  }

  // Ocultar mientras valida (si la página no lo hizo)
  if (!document.documentElement.style.visibility)
    document.documentElement.style.visibility = "hidden";

  const watchdog = setTimeout(() => {
    document.documentElement.style.visibility = "visible";
  }, 2500);

  // Guard
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

/* ===== Helpers ===== */
function setActive(navEl) {
  const items = [...navEl.querySelectorAll(".nav-item")];
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  let active = items[0];
  items.forEach(a=>{
    const href=(a.getAttribute("href")||"").split("#")[0].split("/").pop().toLowerCase();
    if(href && href===current) active=a;
    a.classList.toggle("active", a===active);
    a.toggleAttribute("aria-current", a===active ? "page":false);
  });
}

function buildSidebar() {
  const b = GC_CONFIG.brand;
  const navHTML = GC_CONFIG.nav.map(entry=>{
    if (entry.type === "link") {
      return `<a class="nav-item" href="${abs(entry.href)}" title="${entry.label}">
        ${entry.icon||""} <span class="label">${entry.label}</span></a>`;
    }
    const items = (entry.items||[]).map(it=>`
      <a class="nav-item" href="${abs(it.href)}" title="${it.label}">
        ${it.icon||""} <span class="label">${it.label}</span></a>`).join("");
    return `<section class="nav-group" data-key="${entry.id}">
      <button class="nav-head" aria-expanded="true" title="${entry.title}">
        <span class="chev">▾</span> <span class="txt">${entry.title}</span>
      </button>
      <div class="nav-body"><div class="nav-body-inner">${items}</div></div>
    </section>`;
  }).join("");

  return `
  <aside id="gc-aside">
    <a class="brand" href="${abs(b.homeHref)}" id="brandLink" aria-label="Inicio" title="Inicio">
      <picture>
        <source srcset="${abs(b.logoWebp)}" type="image/webp"/>
        <img id="brandLogo" src="${abs(b.logoPng)}" alt="Gestión Center" loading="lazy" decoding="async"/>
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
  window.addEventListener("popstate", ()=>setActive(nav));

  // Colapsables con memoria
  nav.querySelectorAll(".nav-group").forEach(g=>{
    const key=g.dataset.key; const head=g.querySelector(".nav-head");
    const saved=localStorage.getItem(key);
    if(saved==='0'){ g.classList.add('is-collapsed'); head.setAttribute('aria-expanded','false'); }
    head.addEventListener('click',(ev)=>{
      ev.preventDefault(); ev.stopPropagation();
      const col = g.classList.toggle('is-collapsed');
      head.setAttribute('aria-expanded', col ? 'false':'true');
      localStorage.setItem(key, col ? '0':'1');
    });
  });

  // Compacto
  const btn=root.querySelector('#btnSidebarToggle');
  const compactKey='gc-sidebar-compact';
  function setCompactState(on){
    document.body.classList.toggle('sidebar-compact', !!on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    localStorage.setItem(compactKey, on ? '1' : '0');
  }
  btn.addEventListener('click', ()=> setCompactState(!document.body.classList.contains('sidebar-compact')));
  setCompactState(localStorage.getItem(compactKey)==='1');
}

class GCShell extends HTMLElement{
  async connectedCallback(){
    await ensureGuardAndHead();

    // Lee atributos del tag <gc-shell>
    const heroOff = this.getAttribute("hero") === "off";
    const heroTitle = this.getAttribute("hero-title") || (GC_CONFIG.heroDefault?.title || "");
    const heroSub   = this.getAttribute("hero-subtitle") || (GC_CONFIG.heroDefault?.subtitle || "");

    const userContent = this.innerHTML;

    this.innerHTML = `
      ${buildSidebar()}
      <main>
        ${heroOff ? "" : `
          <section class="hero">
            <h1>${heroTitle}</h1>
            <p>${heroSub}</p>
          </section>`}
        ${userContent}
      </main>
    `;
    wireSidebar(this);

    // Role gris simple
    const roleDot=this.querySelector('#roleDot');
    const roleName=this.querySelector('#roleName');
    const roleDesc=this.querySelector('#roleDesc');
    const roleBadge=this.querySelector('#roleBadge');
    const ls=(localStorage.getItem('gc-role')||'Invitado');
    roleDot.style.background='#737373';
    roleName.textContent=ls; roleDesc.textContent=(ls==='Invitado'?'Acceso limitado':'');
    roleBadge.textContent=ls;
  }
}
customElements.define("gc-shell", GCShell);
window.__GC_BASE__ = BASE;
