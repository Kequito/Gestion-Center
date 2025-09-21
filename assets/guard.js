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
const PREFERRED_REPO = "Gestion-Center";
const PREFERRED_BASE_TRAILING = `/${PREFERRED_REPO}/`;

function readMetaBase(){
  const m = document.querySelector('meta[name="gc-base"]');
  return m?.content || "";
}
function isValidAbsoluteBase(u){
  try{
    const url = new URL(u);
    if (url.origin !== location.origin) return false;
    if (/\.html($|\/)/i.test(url.pathname)) return false; // evita .html en BASE
    return true;
  }catch{ return false; }
}
function ensureSlash(u){ return u.endsWith("/") ? u : (u + "/"); }

function computeBase() {
  // 0) Hint explícito (meta o variable global)
  const hinted =
    window.__GC_BASE__ ||
    (() => {
      const meta = readMetaBase();
      if (!meta) return "";
      const abs = new URL(meta.replace(/^\//, ""), location.origin).href;
      return abs;
    })();
  if (isValidAbsoluteBase(hinted)) return ensureSlash(hinted);

  // 1) Detección por entorno
  const host = location.hostname;
  const segs = location.pathname.split("/").filter(Boolean);

  // a) GitHub Pages (usuario.github.io/<repo>/...)
  if (host.endsWith("github.io")) {
    const repo = segs[0] || "";
    if (repo && !/\.html?$/i.test(repo)) return `${location.origin}/${repo}/`;
    return `${location.origin}${PREFERRED_BASE_TRAILING}`;
  }

  // b) Dominio propio: respeta si ya estás dentro de /Gestion-Center/
  const idx = segs.indexOf(PREFERRED_REPO);
  if (idx !== -1) {
    const basePath = `/${segs.slice(0, idx + 1).join("/")}/`;
    return `${location.origin}${basePath}`;
  }
  return `${location.origin}${PREFERRED_BASE_TRAILING}`;
}

const BASE = computeBase();
const abs = (path) => new URL(String(path || "").replace(/^\//, ""), BASE).href;
window.__GC_BASE__ = BASE;

/* =========================
   RUTAS PÚBLICAS
   ========================= */
const LOGIN_URL = abs("login.html");

function normalizePath(p){
  let out = (p || "/").replace(/\/{2,}/g, "/");
  if (out.endsWith("/index.html")) out = out.slice(0, -"/index.html".length) + "/";
  return out;
}
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
function showPage(){
  if (!pageShown) {
    document.documentElement.style.visibility = "visible";
    pageShown = true;
  }
}
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
  app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  await setPersistence(auth, browserLocalPersistence).catch(()=>{});
} catch (e) {
  console.error("[guard] Firebase init error:", e);
  showPage();
}

/* =========================
   AYUDAS / DEBUG
   ========================= */
// Exponer para consola
window.gcApp  = app;
window.gcAuth = auth;
// Helper para leer rank rápidamente
window.gcGetRank = async () => {
  try {
    const t = await auth.currentUser?.getIdTokenResult(true);
    return t?.claims?.rank ?? null;
  } catch { return null; }
};

/* =========================
   GUARD PRINCIPAL
   ========================= */
function isAnon(user){
  // Auth marca anónimo cuando no hay provedores conectados
  return !!user?.isAnonymous || (user && user.providerData?.length === 0);
}

onAuthStateChanged(auth, async (user) => {
  clearTimeout(watchdog);
  const publicPage = isPublicPath();

  // 🔒 Bloquear sesiones anónimas (por si el proveedor "Anónimo" estuviera activado o quedó una sesión vieja)
  if (isAnon(user)) {
    try { localStorage.setItem("redirectAfterLogin", location.href); } catch {}
    try { await signOut(auth); } catch {}
    location.href = LOGIN_URL;
    return;
  }

  // No hay usuario y la página NO es pública → enviar a login
  if (!user && !publicPage) {
    try { localStorage.setItem("redirectAfterLogin", location.href); } catch {}
    const now = normalizePath(location.pathname);
    const loginPath = normalizePath(new URL(LOGIN_URL).pathname);
    if (now !== loginPath) {
      location.href = LOGIN_URL;
      return;
    }
  }

  // Con sesión válida o en página pública → mostrar
  showPage();
});

/* =========================
   LOGOUT GLOBAL
   ========================= */
window.gcLogout = async () => {
  try { await signOut(auth); } catch (e) {
    console.warn("[guard] signOut warning:", e);
  } finally {
    location.href = LOGIN_URL;
  }
};

/* =========================
   BANDERA ENTORNO
   ========================= */
window.__GC_IS_GITHUB_PAGES__ = location.hostname.endsWith("github.io");
