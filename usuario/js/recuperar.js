import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../../firebase-config.js";

// Configuración de Firebase para proyecto1-a6d0b
const firebaseConfig = {
  apiKey: "AIzaSyCBIFvoUrwHP3ldrTLca-5MB5Oby8tjY_k",
  authDomain: "proyecto1-a6d0b.firebaseapp.com",
  projectId: "proyecto1-a6d0b",
  storageBucket: "proyecto1-a6d0b.firebasestorage.app",
  messagingSenderId: "798646307083",
  appId: "1:798646307083:web:72855ce417055e9fc8fa0e",
  measurementId: "G-T9W2X52KTY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const recEmailInput = document.getElementById("recEmail");
const enviarEnlaceBtn = document.getElementById("enviarEnlace");
const mensajeError = document.getElementById("mensajeError");
const mensajeExito = document.getElementById("mensajeExito");

function mostrarError(msg) {
  mensajeError.style.display = "block";
  mensajeError.textContent = msg;
  mensajeExito.style.display = "none";
}

function mostrarExito(msg) {
  mensajeExito.style.display = "block";
  mensajeExito.textContent = msg;
  mensajeError.style.display = "none";
}

enviarEnlaceBtn.addEventListener("click", async () => {
  const email = recEmailInput.value.trim();
  if (!email) {
    mostrarError("Por favor, ingresa tu correo electrónico.");
    return;
  }

  try {
    // Verificar si el correo existe en Firestore
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      mostrarError("Correo no registrado, no se puede enviar enlace.");
      return;
    }

    // Enviar enlace de restablecimiento de contraseña
    await sendPasswordResetEmail(auth, email);

    mostrarExito("Se envió el enlace para cambiar la contraseña a su correo.");
  } catch (error) {
    mostrarError("Error al enviar el enlace: " + error.message);
  }
});
