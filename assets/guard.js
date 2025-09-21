// assets/guard.js
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================
   CONFIG FIREBASE
   ========================= */
const firebaseConfig = {
  apiKey: "AIzaSyCHBsq9AdVZEMVryQWReX7oaPparo9lK8M",
  authDomain: "gestioncenterdata.firebaseapp.com",
  projectId: "gestioncenterdata",
  storageBucket: "gestioncenterdata.firebasestorage.app",
  messagingSenderId: "628401314464",
  appId: "1:628401314464:web:0671233dfd801ee43587c5",
  measurementId: "G-NBFZYTN094",
};

/* =========================
   BASE ABSOLUTA ROBUSTA
   ========================= */
const PREFERRED_REPO = "Gestion-Center"; // fallback para GitHub Pages

function isValidAbsoluteBase(u){
  try{
    const url = new URL(u);
    if (url.origin !== location.origin) return false;
    // Evita que la BASE termine o contenga .html
    if (/\.html($|\/)/i.test(url.pathname)) return false;
    return true;
  }catch{ return false; }
}

function computeBase() {
  // 1) Si el login ya expuso una BASE válida, úsala
  if (isValidAbsoluteBase(window.__GC_BASE__)) {
    return window.__GC_BASE__.endsWith("/") ? window.__GC_BASE__ : (window.__GC_BASE__ + "/");
  }

  // 2) Calcular por entorno
  const host = location.hostname;
  const segs = location.pathname.split("/").filter(Boolean);

  if (host.endsWith("github.io")) {
    const first = segs[0] || "";
    // Si el primer segmento no es archivo .html, se asume repo
    if (first && !/\.html?$/i.test(first)) {
      return `${location.origin}/${first}/`;
    }
    // Fallback duro al repo preferido
    return `${location.origin}/${PREFERRED_REPO}/`;
  }

  // Dominio propio → raíz (ajusta aquí si alojas en subcarpeta)
  return `${location.origin}/`;
}

const BASE = computeBase();
const abs = (path) => new URL(String(path || "").replace(/^\//, ""), BASE).href;

// Exponer BASE para otros módulos (login.html la reutiliza)
window.__GC_BASE__ = BASE;

/* =========================
   RUTAS PÚBLICAS
   ========================= */
const LOGIN_URL = abs("login.html");

const PUBLIC_PATHS = new Set([
  new URL("login.html", BASE).pathname,
  new URL("404.html", BASE).pathname,
  // Si algún día quieres hacer index público, añade:
  // new URL("index.html", BASE).pathname,
]);

function normalizePath(p){
  // Quita duplicados de slash y tolera "index.html" o trailing slash
  let out = (p || "/").replace(/\/{2,}/g, "/");
  if (out.endsWith("/index.html")) out = out.slice(0, -"/index.html".length) + "/";
  return out;
}

function isPublicPath() {
  // Respetar bandera explícita desde la página
  if (window.GC_PUBLIC_PAGE === true) return true;

  const p = normalizePath(location.pathname);
  if (PUBLIC_PATHS.has(p)) return true;

  // Aceptar también variante sin ".html" con trailing slash (p. ej. /login/)
  for (const pub of PUBLIC_PATHS) {
    const slashVariant = pub.replace(/\.html$/i, "/");
    if (p === slashVariant) return true;
  }
  return false;
}

/* =========================
   VISIBILIDAD / WATCHDOG
   ========================= */
let pageShown = false;
function showPage() {
  if (!pageShown) {
    document.documentElement.style.visibility = "visible";
    pageShown = true;
  }
}

// Evita “pantalla en blanco” si algo falla o tarda
const watchdog = setTimeout(() => {
  if (!pageShown) {
    console.warn("[guard] Watchdog: mostrando la página por fallback.");
    showPage();
  }
}, 2500);

/* =========================
   INIT FIREBASE + AUTH
   ========================= */
let app, auth;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  await setPersistence(auth, browserLocalPersistence);
} catch (e) {
  console.error("[guard] Firebase init error:", e);
  showPage(); // evita pantalla blanca si Firebase no carga
  throw e;
}

/* =========================
   GUARD PRINCIPAL
   ========================= */
onAuthStateChanged(auth, (user) => {
  clearTimeout(watchdog);

  const publicPage = isPublicPath();

  if (!user && !publicPage) {
    // Redirigir a login absoluto y recordar destino
    try { localStorage.setItem("redirectAfterLogin", location.href); } catch {}
    // Evita bucles si por algún motivo ya estás en login
    if (normalizePath(location.pathname) !== normalizePath(new URL(LOGIN_URL).pathname)) {
      location.href = LOGIN_URL;
      return;
    }
  }

  // Con sesión o en página pública → mostrar
  showPage();
});

/* =========================
   LOGOUT GLOBAL
   ========================= */
window.gcLogout = async () => {
  try { await signOut(auth); } catch (e) {
    console.warn("[guard] signOut warning:", e);
  } finally {
    // Redirige siempre al login absoluto
    location.href = LOGIN_URL;
  }
};

/* =========================
   UTILIDADES OPCIONALES
   ========================= */
// Útil por si necesitas saber si estás en GitHub Pages desde otras partes
window.__GC_IS_GITHUB_PAGES__ = location.hostname.endsWith("github.io");
