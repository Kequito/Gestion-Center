// assets/guard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================
   CONFIG
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
   UTIL: BASE URL robusto
   ========================= */
function computeBase() {
  const host = location.hostname;
  if (host.endsWith("github.io")) {
    // Project Pages => https://user.github.io/<repo>/
    const parts = location.pathname.split("/").filter(Boolean);
    const repo = parts[0] || "";
    return `${location.origin}/${repo ? repo + "/" : ""}`;
  }
  // Dominio propio / hosting normal
  return `${location.origin}/`;
}
const BASE = computeBase();
const abs = (path) => new URL(path.replace(/^\//, ""), BASE).href;

/* =========================
   RUTAS PÚBLICAS
   ========================= */
const LOGIN_URL = abs("login.html");
const PUBLIC_PATHS = new Set([
  new URL("login.html", BASE).pathname,
  new URL("404.html", BASE).pathname,
  // Si algún día quieres hacer index público, descomenta:
  // new URL("index.html", BASE).pathname,
]);

function isPublicPath() {
  // Normaliza: quita duplicados y tolera trailing slash (p.ej. /login/)
  const p = location.pathname.replace(/\/+/g, "/");
  if (PUBLIC_PATHS.has(p)) return true;
  for (const pub of PUBLIC_PATHS) {
    if (p === pub.replace(/\.html$/, "/")) return true;
  }
  return false;
}

/* =========================
   VISIBILIDAD / FALLBACK
   ========================= */
let pageShown = false;
function showPage() {
  if (!pageShown) {
    document.documentElement.style.visibility = "visible";
    pageShown = true;
  }
}

// Watchdog de 2.5s para evitar “pantalla en blanco” si algo falla/lento.
// En producción puedes subir el tiempo o quitarlo si no quieres el fallback.
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
  app = initializeApp(firebaseConfig);
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
  clearTimeout(watchdog); // si llegó hasta aquí, no necesitamos fallback
  const publicPage = isPublicPath();

  if (!user && !publicPage) {
    try { localStorage.setItem("redirectAfterLogin", location.href); } catch {}
    location.href = LOGIN_URL; // absoluta y consistente con BASE
    return;
  }
  showPage();
});

/* =========================
   LOGOUT GLOBAL
   ========================= */
window.gcLogout = async () => {
  try { await signOut(auth); } catch (e) {
    console.warn("[guard] signOut warning:", e);
  } finally {
    // Redirige siempre al login absoluto, evita rutas relativas rotas
    location.href = LOGIN_URL;
  }
};

// (Opcional) expón BASE por si lo quieres reutilizar en otras utilidades
window.__GC_BASE__ = BASE;
