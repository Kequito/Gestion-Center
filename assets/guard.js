// assets/guard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, signOut }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// === TU CONFIG REAL ===
const firebaseConfig = {
  apiKey: "AIzaSyCHBsq9AdVZEMVryQWReX7oaPparo9lK8M",
  authDomain: "gestioncenterdata.firebaseapp.com",
  projectId: "gestioncenterdata",
  storageBucket: "gestioncenterdata.firebasestorage.app",
  messagingSenderId: "628401314464",
  appId: "1:628401314464:web:0671233dfd801ee43587c5",
  measurementId: "G-NBFZYTN094"
};

// --- Init
let app, auth;
try {
  app  = initializeApp(firebaseConfig);
  auth = getAuth(app);
  await setPersistence(auth, browserLocalPersistence);
} catch (e) {
  console.error("[guard] Firebase init error:", e);
  // Mostramos la página para no dejarla azul si hay error
  document.documentElement.style.visibility = "visible";
  throw e;
}

// --- Helpers de ruta (GitHub Pages project page)
function getBase(){
  const parts = location.pathname.split('/').filter(Boolean);
  return parts.length ? `/${parts[0]}/` : '/';
}
const LOGIN_PATH   = getBase() + "login.html";
const PUBLIC_PATHS = [ LOGIN_PATH, getBase() + "404.html" ];

function isPublicPath(){
  const p = location.pathname;
  return PUBLIC_PATHS.includes(p);
}
function showPage(){ document.documentElement.style.visibility = "visible"; }

// --- Guard principal
onAuthStateChanged(auth, (user)=>{
  const publicPage = isPublicPath();

  if (!user && !publicPage) {
    try { localStorage.setItem("redirectAfterLogin", location.href); } catch {}
    location.href = LOGIN_PATH;
    return;
  }
  showPage();
});

// Exponer logout global
window.gcLogout = ()=> signOut(auth);
