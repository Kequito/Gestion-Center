// assets/guard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// === TU CONFIG REAL ===
const firebaseConfig = {
  apiKey: "AIzaSyCHBsq9AdVZEMVryQWReX7oaPparo9lK8M",
  authDomain: "gestioncenterdata.firebaseapp.com",
  projectId: "gestioncenterdata",
  storageBucket: "gestioncenterdata.firebasestorage.app",
  messagingSenderId: "628401314464",
  appId: "1:628401314464:web:0671233dfd801ee43587c5",
  measurementId: "G-NBFZYTN094",
};

// --- Init
let app, auth;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  await setPersistence(auth, browserLocalPersistence);
} catch (e) {
  console.error("[guard] Firebase init error:", e);
  document.documentElement.style.visibility = "visible";
  throw e;
}

// --- Base URL robusto (GH Pages proyecto vs dominio raíz)
function computeBase() {
  const host = location.hostname;
  // Si corre en *.github.io asumimos Project Pages: /<repo>/
  if (host.endsWith("github.io")) {
    const first = location.pathname.split("/").filter(Boolean)[0] || "";
    return `${location.origin}/${first ? first + "/" : ""}`;
  }
  // Dominio propio u otro hosting: raíz del dominio
  return `${location.origin}/`;
}
const BASE = computeBase();

// Helpers de URL absolutas
const abs = (path) => new URL(path.replace(/^\//, ""), BASE).href;

// Rutas públicas
const LOGIN_URL = abs("login.html");
// Añade aquí otras públicas si quieres
const PUBLIC_PATHS = new Set([
  new URL("login.html", BASE).pathname,
  new URL("404.html", BASE).pathname,
  // Permite también el index público si haces páginas sin auth:
  // new URL("index.html", BASE).pathname,
]);

function isPublicPath() {
  // Normaliza pathname (quita doble slash, tolera trailing slash)
  const p = location.pathname.replace(/\/+/g, "/");
  if (PUBLIC_PATHS.has(p)) return true;
  // Permite variantes con slash final (login/ -> login.html)
  for (const pub of PUBLIC_PATHS) {
    if (p === pub.replace(/\.html$/, "/")) return true;
  }
  return false;
}

function showPage() {
  document.documentElement.style.visibility = "visible";
}

// --- Guard principal
onAuthStateChanged(auth, (user) => {
  const publicPage = isPublicPath();

  if (!user && !publicPage) {
    try { localStorage.setItem("redirectAfterLogin", location.href); } catch {}
    // Usa URL absoluta basada en BASE (evita dominios raros)
    location.href = LOGIN_URL;
    return;
  }
  showPage();
});

// Exponer logout global
window.gcLogout = () => signOut(auth);
