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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const recEmailInput = document.getElementById("recEmail");
const enviarEnlaceBtn = document.getElementById("enviarEnlace");
const mensajeError = document.getElementById("mensajeError");
const mensajeExito = document.getElementById("mensajeExito");

function mostrarError(msg) {
  mensajeError.textContent = msg;
  mensajeError.style.display = "block";
  mensajeExito.style.display = "none";
}

function mostrarExito(msg) {
  mensajeExito.textContent = msg;
  mensajeExito.style.display = "block";
  mensajeError.style.display = "none";
}

enviarEnlaceBtn.addEventListener("click", async () => {
  const email = recEmailInput.value.trim();

  if (!email) {
    mostrarError("Por favor, ingresa tu correo electrónico.");
    return;
  }

  try {
    // Verificar si el correo está registrado en Firestore
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      mostrarError("Correo no registrado, no se puede enviar enlace.");
      return;
    }

    // Enviar email de restablecimiento
    await sendPasswordResetEmail(auth, email);
    mostrarExito("Se envió el enlace para cambiar la contraseña a tu correo.");
  } catch (error) {
    mostrarError("Error al enviar el enlace: " + error.message);
  }
});
