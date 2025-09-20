// assets/bw/shell.js
// Ecosistema B/N minimal para Gestión Center (Lexend, sidebar, nav, compacto, rutas base)
// Incluye estandarización GLOBAL: encabezados de tabla con fondo negro y texto blanco.

(() => {
  /* =========================
     BASE robusto (GitHub Pages repo vs dominio propio)
     ========================= */
  const isGh  = location.hostname.endsWith('github.io');
  const parts = location.pathname.split('/').filter(Boolean);
  const repo  = isGh ? (parts[0] || '') : '';
  const BASE  = isGh ? `/${repo}/` : '/';
  const ABS   = (p) => new URL(p.replace(/^\//,''), location.origin + BASE).href;

  /* =========================
     Inyección de fuente Lexend (idempotente)
     ========================= */
  function ensureFont() {
    if (!document.querySelector('link[data-gc-font="lexend"]')) {
      const l1 = document.createElement('link');
      l1.rel = 'preconnect'; l1.href = 'https://fonts.googleapis.com'; l1.setAttribute('data-gc-font','lexend');
      const l2 = document.createElement('link');
      l2.rel = 'preconnect'; l2.href = 'https://fonts.gstatic.com'; l2.crossOrigin = 'anonymous'; l2.setAttribute('data-gc-font','lexend');
      const l3 = document.createElement('link');
      l3.rel = 'stylesheet';
      l3.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600;700&display=swap';
      l3.setAttribute('data-gc-font','lexend');
      document.head.append(l1,l2,l3);
    }
  }

  /* =========================
     Inyección de estilos globales (idempotente)
     ========================= */
  const CSS_ID = 'gc-shell-style';
  function ensureStyles() {
    if (document.getElementById(CSS_ID)) return;
    const css = /* css */ `
:root{
  --font: 'Lexend', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  --black:#0a0a0a; --white:#ffffff;
  --gray-900:#111111; --gray-700:#3f3f3f; --gray-500:#737373;
  --gray-300:#d4d4d4; --gray-200:#e5e5e5; --gray-100:#f5f5f5;
  --sidebar-w:280px; --sidebar-w-compact:72px; --radius:12px;

  /* === Estándar global solicitado === */
  --tbl-head-bg:#000;     /* fondo negro */
  --tbl-head-fg:#fff;     /* texto blanco */
  --tbl-head-border:#000; /* borde negro */
}
*{box-sizing:border-box}
html,body{height:100%}
body{
  margin:0; font-family:var(--font);
  background:var(--white); color:var(--gray-900);
  -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
}

/* ===== Sidebar ===== */
aside{
  position:fixed; inset:0 auto 0 0; z-index:20;
  width:var(--sidebar-w);
  background:var(--black); color:var(--white);
  border-right:1px solid var(--gray-300);
  display:flex; flex-direction:column; gap:12px;
  padding:12px; overflow:auto;
}
.brand{
  display:flex; align-items:center; justify-content:center;
  border:1px solid var(--gray-300); border-radius:var(--radius);
  padding:10px; text-decoration:none; background:#0f0f0f;
}
.brand img{width:160px; height:auto; display:block}

.sidebar-toggle{
  width:100%; border:1px solid var(--gray-300);
  background:transparent; color:var(--white);
  border-radius:10px; padding:10px 12px; font-weight:700; cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:8px;
  min-height:44px; line-height:1.1; white-space:nowrap;
}
.sidebar-toggle .icon{ font-size:16px }

nav{display:flex; flex-direction:column; gap:10px}
.nav-group{
  border:1px solid var(--gray-300); border-radius:12px;
  overflow:hidden; background:#0f0f0f;
}
.nav-head{
  width:100%; background:transparent; color:var(--white);
  text-align:left; padding:10px 12px; border:0; cursor:pointer;
  font-weight:700; display:flex; align-items:center; gap:8px;
}
.nav-body{ display:block; padding:6px }
.nav-group.is-collapsed .nav-body{ display:none }

.nav-item{
  display:flex; align-items:center; gap:10px;
  color:var(--white); text-decoration:none;
  padding:12px 12px; border-radius:10px;
  margin:4px; background:transparent;
}
.nav-item:hover{ background:#141414 }
.nav-item.active{
  background:var(--white); color:var(--gray-900);
  border-left:3px solid var(--gray-900); border-radius:10px;
}

.spacer{flex:1}
.role-card{
  display:flex; align-items:center; gap:10px;
  padding:10px; border:1px solid var(--gray-300); border-radius:10px;
  background:#0f0f0f; color:var(--white);
}
.role-dot{width:14px; height:14px; border-radius:50%; background:var(--gray-500)}
.role-badge{font-size:12px; padding:2px 8px; border:1px solid var(--gray-300); border-radius:999px}

.logout{
  width:100%; padding:12px; border-radius:10px;
  border:1px solid var(--gray-300); background:#1a1a1a; color:#fff; cursor:pointer; font-weight:700;
}

/* ===== Main ===== */
main{ margin-left:var(--sidebar-w); padding:20px }
.hero{
  border:1px solid var(--gray-300); border-radius:var(--radius);
  padding:14px; background:var(--gray-100);
}
.hero h1{margin:0 0 6px; font-size:22px}
.hero p{margin:0; color:var(--gray-700); font-size:14px}

.grid{display:grid; gap:12px; margin-top:14px; grid-template-columns:repeat(2, minmax(280px, 1fr))}
.card{
  border:1px solid var(--gray-300); border-radius:var(--radius);
  padding:12px; background:var(--white);
}
.card h3{margin:0 0 8px; font-size:15px}
.card a{
  display:flex; align-items:center; gap:8px;
  color:var(--gray-900); text-decoration:none; padding:8px 0; border-top:1px solid var(--gray-200)
}
.card a:first-of-type{border-top:0}
.card a:hover{ background:var(--gray-100) }

/* ===== Compacto ===== */
body.sidebar-compact aside{ width:var(--sidebar-w-compact) }
body.sidebar-compact main{ margin-left:var(--sidebar-w-compact) }
body.sidebar-compact .brand img{ width:42px }
body.sidebar-compact .nav-head .txt,
body.sidebar-compact .nav-item .label,
body.sidebar-compact .sidebar-toggle .lbl,
body.sidebar-compact .role-text{ display:none }
/* ajustes visuales para que no se mezclen */
body.sidebar-compact .nav-head{ justify-content:center; padding:8px }
body.sidebar-compact .nav-body{ padding:4px 2px }
body.sidebar-compact .nav-item{
  margin:6px; padding:10px 0;
  justify-content:center; min-height:40px;
  border-radius:12px;
}
body.sidebar-compact .nav-item.active{
  border-left:none; background:var(--white); color:var(--gray-900);
  outline:2px solid var(--white);
}

/* ===== Responsive ===== */
@media (max-width:1080px){
  main{margin-left:0}
  aside{position:sticky; width:auto; inset:auto}
  body.sidebar-compact aside{width:auto}
  body.sidebar-compact main{margin-left:0}
  .grid{grid-template-columns:1fr}
}

/* Foco accesible alto contraste */
.nav-item:focus-visible, .nav-head:focus-visible, .sidebar-toggle:focus-visible,
.logout:focus-visible, .brand:focus-visible{
  outline:2px solid var(--white); outline-offset:2px;
}

/* ====== ESTÁNDAR GLOBAL DE TABLAS ====== */
table thead th{
  background:var(--tbl-head-bg);
  color:var(--tbl-head-fg);
  border-color:var(--tbl-head-border);
}
    `.trim();

    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* =========================
     Normalizador de rutas internas a BASE
     ========================= */
  function normalizeLinks() {
    const sel = 'nav a.nav-item[href], .brand[href], .card a[href]';
    document.querySelectorAll(sel).forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || /^(https?:)?\/\//i.test(href)) return;
      // Limpia ./ o ../ al principio y fuerza a BASE
      let clean = href.replace(/^\.?\//, '');
      clean = clean.replace(/^(\.\.\/)+/, '');
      a.setAttribute('href', BASE + clean);
    });

    // Normaliza logo (img + source) del brand si existe
    const logoImg = document.querySelector('#brandLink img');
    if (logoImg) {
      let src = logoImg.getAttribute('src') || 'images/logogestioncenter.png';
      if (!/^(https?:)?\/\//i.test(src)) {
        src = src.replace(/^\.?\//, '').replace(/^(\.\.\/)+/,'');
        logoImg.setAttribute('src', BASE + src);
      }
    }
    const logoSrc = document.querySelector('#brandLink source');
    if (logoSrc) {
      let s = logoSrc.getAttribute('srcset') || 'images/logogestioncenter.webp';
      s = s.replace(/^\.?\//, '').replace(/^(\.\.\/)+/,'');
      logoSrc.setAttribute('srcset', BASE + s);
    }
  }

  /* =========================
     UI behaviors (nav activo, colapsables, compacto, rol)
     ========================= */
  function setActiveNav() {
    const items = [...document.querySelectorAll('nav .nav-item')];
    if (!items.length) return;
    const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    let active = items[0];
    items.forEach(a => {
      const href = (a.getAttribute('href')||'').split('#')[0].split('/').pop().toLowerCase();
      if (href && href === current) active = a;
      a.classList.toggle('active', a === active);
      a.toggleAttribute('aria-current', a === active ? 'page' : false);
    });
  }

  function initCollapsibles() {
    document.querySelectorAll('.nav-group').forEach(g=>{
      const key = g.dataset.key || 'grp-' + Math.random().toString(36).slice(2);
      g.dataset.key = key;
      const head = g.querySelector('.nav-head');
      if (!head) return;
      const saved = localStorage.getItem(key);
      if (saved === '0') g.classList.add('is-collapsed');
      head.setAttribute('aria-expanded', g.classList.contains('is-collapsed') ? 'false' : 'true');
      head.addEventListener('click', (ev)=>{
        ev.preventDefault(); ev.stopPropagation();
        const isCollapsed = g.classList.toggle('is-collapsed');
        head.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
        localStorage.setItem(key, isCollapsed ? '0' : '1');
      });
    });
  }

  function initCompact() {
    const btn = document.getElementById('btnSidebarToggle');
    const key = 'gc-sidebar-compact';
    const setState = (on) => {
      document.body.classList.toggle('sidebar-compact', !!on);
      if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      localStorage.setItem(key, on ? '1' : '0');
    };
    if (btn) btn.addEventListener('click', ()=> setState(!document.body.classList.contains('sidebar-compact')));
    setState(localStorage.getItem(key) === '1');
  }

  function initRole() {
    const ROLE = {
      'owner':      {name:'Owner',     desc:'Control total'},
      'admin':      {name:'Admin',     desc:'Administración'},
      'supervisor': {name:'Supervisor',desc:'Lidera TLs'},
      'team leader':{name:'Team Leader',desc:'Lidera equipo'},
      'analista':   {name:'Analista',  desc:'Calidad / Datos'},
      'calidad':    {name:'Calidad',   desc:'Auditoría'},
      'operador':   {name:'Operador',  desc:'Ventas / Gestión'},
      'invitado':   {name:'Invitado',  desc:'Acceso limitado'}
    };
    const roleDot  = document.getElementById('roleDot');
    const roleName = document.getElementById('roleName');
    const roleDesc = document.getElementById('roleDesc');
    const roleBadge= document.getElementById('roleBadge');

    const qp = new URLSearchParams(location.search).get('role');
    const w  = (window.gcRole||'').toString().trim();
    const ls = (localStorage.getItem('gc-role')||'').trim();
    const raw= (qp||w||ls||'Invitado').toLowerCase();
    const key= Object.keys(ROLE).find(k => raw.includes(k)) || 'invitado';
    const cfg= ROLE[key];

    if (roleDot)  roleDot.style.background = '#737373';
    if (roleName) roleName.textContent = cfg.name;
    if (roleDesc) roleDesc.textContent = cfg.desc;
    if (roleBadge)roleBadge.textContent = cfg.name;
    localStorage.setItem('gc-role', cfg.name);
  }

  /* =========================
     Init
     ========================= */
  ensureFont();
  ensureStyles();

  // Normaliza rutas pronto (por si el usuario hace click muy rápido)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', normalizeLinks, {once:true});
  } else {
    normalizeLinks();
  }

  function boot() {
    setActiveNav();
    initCollapsibles();
    initCompact();
    initRole();
    window.addEventListener('popstate', setActiveNav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  } else {
    boot();
  }

  // Exponer utilidades por si se necesita re-aplicar
  window.gcShell = {
    BASE, ABS,
    normalizeLinks,
    refresh: () => { normalizeLinks(); setActiveNav(); }
  };
})();
