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

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const adminData = userSnap.data();
      if (adminData.isAdmin) {
        document.getElementById("mensajeBienvenida").textContent = "¡¡ BIENVENIDO";
        document.getElementById("razonSocial").textContent = `${adminData.razonSocial} !!`;
      } else {
        alert("Acceso no autorizado. Esta vista es solo para administradores.");
        window.location.href = "../../login/login.html";
      }
    } else {
      alert("No se pudo recuperar los datos del usuario.");
    }
  } else {
    alert("Vaya... no se pudo obtener acceso a esta página.");
    window.location.href = "../../login/login.html";
  }
});

