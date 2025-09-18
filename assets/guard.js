// assets/js/guard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } 
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = { /* ...tu config... */ };
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
await setPersistence(auth, browserLocalPersistence).catch(()=>{});

// Detecta base del repo (GitHub Pages project pages)
function getBase(){
  const parts = location.pathname.split('/').filter(Boolean);
  return parts.length ? `/${parts[0]}/` : '/';
}
const LOGIN_PATH = getBase() + 'login.html';

const PUBLIC_PATHS = [ LOGIN_PATH, getBase() + '404.html' ];

function isPublicPath(){
  const p = location.pathname;
  return PUBLIC_PATHS.includes(p);
}

function showPage(){ document.documentElement.style.visibility = "visible"; }

onAuthStateChanged(auth, (user)=>{
  const publicPage = isPublicPath();
  if (!user && !publicPage) {
    localStorage.setItem("redirectAfterLogin", location.href);
    location.href = LOGIN_PATH;
    return;
  }
  showPage();
});

window.gcLogout = ()=> signOut(auth);
