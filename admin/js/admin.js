// admin.js - Manejo de autenticación del administrador
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword
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

document.getElementById("formLoginAdmin").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  try {
    // Verifica si el correo está registrado como administrador
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("Correo no registrado.");
      return;
    }

    const userData = snapshot.docs[0].data();

    if (!userData.isAdmin) {
      alert("No tienes permisos de administrador.");
      return;
    }

    await signInWithEmailAndPassword(auth, email, password);

    // Redirigir al dashboard del administrador
    window.location.href = "./html/VerInicio.html";

  } catch (error) {
    if (error.code === "auth/wrong-password") {
      alert("Contraseña incorrecta.");
    } else {
      alert("Error al iniciar sesión: " + error.message);
    }
  }
});

// Botón regresar al login de usuario
document.getElementById("btnVolverLogin").addEventListener("click", () => {
  window.location.href = "../login/login.html";
});
