import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../../firebase-config.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.getElementById("formRegistro").addEventListener("submit", async (e) => {
  e.preventDefault();

  const ruc = document.getElementById("ruc").value.trim();
  const razon = document.getElementById("razon").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const celular = document.getElementById("celular").value.trim();
  const pass = document.getElementById("regPass").value.trim();
  const repPass = document.getElementById("repPass").value.trim();

  if (pass !== repPass) {
    alert("Las contraseñas no coinciden.");
    return;
  }

  try {
    // Validar si ya existe el correo en Firestore
    const q = query(collection(db, "users"), where("email", "==", email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      alert("El correo ya se encuentra en uso, intente registrarse con otro correo.");
      return;
    }

    // Crear cuenta en Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, email, pass);

    // Guardar datos en Firestore en colección 'users'
    await setDoc(doc(db, "users", cred.user.uid), {
      celular,
      email,
      isAdmin: false,
      razonSocial: razon,
      ruc
    });

    alert("Registro exitoso.");

  } catch (err) {
    alert("Error en el registro: " + err.message);
  }
});
