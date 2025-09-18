// assets/js/guard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ===== Tu config =====
const firebaseConfig = {
  apiKey: "AIzaSyCHBsq9AdVZEMVryQWReX7oaPparo9lK8M",
  authDomain: "gestioncenterdata.firebaseapp.com",
  projectId: "gestioncenterdata",
  storageBucket: "gestioncenterdata.firebasestorage.app",
  messagingSenderId: "628401314464",
  appId: "1:628401314464:web:0671233dfd801ee43587c5",
  measurementId: "G-NBFZYTN094"
};

// ===== Inicializa =====
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
await setPersistence(auth, browserLocalPersistence).catch(()=>{});

// Rutas públicas (no requieren login)
const PUBLIC_PATHS = [
  "/login.html",
  "/404.html"
];

// Helper: ¿esta ruta es pública?
function isPublicPath(){
  const p = location.pathname.replace(/\/+$/,'');
  return PUBLIC_PATHS.includes(p) || PUBLIC_PATHS.includes(p + "/index.html");
}

// Evitar flash: solo mostramos cuando decidimos
function showPage(){ document.documentElement.style.visibility = "visible"; }

// Guard principal
onAuthStateChanged(auth, async (user)=>{
  const publicPage = isPublicPath();

  if (!user && !publicPage) {
    // Guardamos a dónde quería ir
    localStorage.setItem("redirectAfterLogin", location.href);
    location.href = "/Gestion-Center/login.html"; // <-- ajusta ruta del login
    return; // no mostramos nada aquí
  }

  // Si hay usuario y estamos en login, dejamos que el login gestione el redirect.
  // Si hay usuario y estamos en página privada, mostramos.
  showPage();
});

// Opcional: expón logout global para tus botones
window.gcLogout = ()=> signOut(auth);
