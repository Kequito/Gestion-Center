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
const PREFERRED_REPO = "Gestion-Center";   // carpeta del repo en GitHub Pages
const PREFERRED_BASE_TRAILING = `/${PREFERRED_REPO}/`;

// Lee meta <meta name="gc-base" content="/Gestion-Center/">
function readMetaBase(){
  const m = document.querySelector('meta[name="gc-base"]');
  return m?.content || "";
}

function isValidAbsoluteBase(u){
  try{
    const url = new URL(u);
    if (url.origin !== location.origin) return false;
    // Evita que la BASE termine o contenga .html
    if (/\.html($|\/)/i.test(url.pathname)) return false;
    return true;
  }catch{
    return false;
  }
}

function ensureSlash(u){
  return u.endsWith("/") ? u : (u + "/");
}

function computeBase() {
  // 0) Override explícito desde la página (meta o variable)
  const hinted =
    window.__GC_BASE__ ||
    (() => {
      const meta = readMetaBase();
      if (!meta) return "";
      const abs = new URL(meta.replace(/^\//, ""), location.origin).href;
      return abs;
    })();

  if (isValidAbsoluteBase(hinted)) {
    return ensureSlash(hinted);
  }

  // 1) Detección por entorno
  const host = location.hostname;
  const segs = location.pathname.split("/").filter(Boolean);

  // a) GitHub Pages (usuario.github.io/<repo>/...)
  if (host.endsWith("github.io")) {
    const repo = segs[0] || "";
    if (repo && !/\.html?$/i.test(repo)) {
      return `${location.origin}/${repo}/`;
    }
    // Fallback duro al repo preferido
    return `${location.origin}${PREFERRED_BASE_TRAILING}`;
  }

  // b) Dominio propio
  // Si ya estás dentro de /Gestion-Center/ (p.ej. al abrir una URL profunda), respétalo
  const idx = segs.indexOf(PREFERRED_REPO);
  if (idx !== -1) {
    // construye base hasta ese segmento
    const basePath = `/${segs.slice(0, idx + 1).join("/")}/`;
    return `${location.origin}${basePath}`;
  }

  // Si la página está en la raíz pero los assets viven en /Gestion-Center/,
  // permite forzar esa base preferida en dominio propio:
  // - Si NO tienes custom domain mapeado a la raíz del repo, usa la subcarpeta:
  //   (Puedes suprimir este branch cuando mapees el custom domain correctamente)
  return `${location.origin}${PREFERRED_BASE_TRAILING}`;

  // Si mapeaste bien el custom domain a la raíz del repo, en su lugar podrías usar:
  // return `${location.origin}/`;
}

const BASE = computeBase();
const abs = (path) => new URL(String(path || "").replace(/^\//, ""), BASE).href;

// Exponer BASE para otros módulos
window.__GC_BASE__ = BASE;

/* =========================
   RUTAS PÚBLICAS
   ========================= */
const LOGIN_URL = abs("login.html");

// normaliza pathname (sin dobles slash, tolera /index.html y trailing slash)
function normalizePath(p){
  let out = (p || "/").replace(/\/{2,}/g, "/");
  if (out.endsWith("/index.html")) out = out.slice(0, -"/index.html".length) + "/";
  return out;
}

// Genera variantes aceptadas (con .html y con slash)
function publicVariants(rel){
  const u = new URL(rel, BASE);
  const p = u.pathname;
  const arr = new Set([p]);
  if (p.endsWith(".html")) arr.add(p.replace(/\.html$/i, "/"));
  else arr.add(p.replace(/\/$/, ".html"));
  return arr;
}

const PUBLIC_SET = new Set([
  ...publicVariants("login.html"),
  ...publicVariants("404.html"),
  // Si quieres hacer index público en algún momento:
  // ...publicVariants("index.html"),
]);

function isPublicPath() {
  if (window.GC_PUBLIC_PAGE === true) return true;
  const p = normalizePath(location.pathname);
  return PUBLIC_SET.has(p);
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
  // No relanzamos para que la página muestre al menos el contenido
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
    const now = normalizePath(location.pathname);
    const loginPath = normalizePath(new URL(LOGIN_URL).pathname);
    if (now !== loginPath) {
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
window.__GC_IS_GITHUB_PAGES__ = location.hostname.endsWith("github.io");
