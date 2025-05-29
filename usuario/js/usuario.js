import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../../firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ======== Autenticación y bienvenida ========
const mensajeBienvenida = document.getElementById("mensajeBienvenida");
const razonSocial = document.getElementById("razonSocial");

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Vaya... no se pudo obtener acceso a esta página.");
    window.location.href = "../../login/login.html";
    return;
  }
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    mensajeBienvenida.textContent = `¡¡ BIENVENIDO`;
    razonSocial.textContent = `${data.razonSocial} !!`;
  }
});

// ======== Navegación ========
document.getElementById("btnInicio").onclick = () => location.href = "./usuario.html";
document.getElementById("btnCitas").onclick = () => location.href = "./citas.html";
document.getElementById("btnHistorial").onclick = () => location.href = "./historial.html";
document.getElementById("btnCuenta").onclick = () => location.href = "./cuenta.html";
document.getElementById("btnSalir").onclick = async () => {
  await signOut(auth);
  location.href = "../../login/login.html";
};
