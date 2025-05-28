import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  updatePassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../../firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserId = null;
let userDocRef = null;

const contenedorFormulario = document.getElementById("formCuentaContainer");
const btnCerrarCuenta = document.getElementById("btnCerrarCuenta");

// Cargar datos del usuario al autenticar
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Vaya... no se pudo obtener acceso a esta página.");
    window.location.href = "../../login/login.html";
    return;
  }

  currentUserId = user.uid;
  userDocRef = doc(db, "users", currentUserId);

  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById("ruc").value = data.ruc || "";
    document.getElementById("razon").value = data.razonSocial || "";
    document.getElementById("email").value = data.email || "";
    document.getElementById("celular").value = data.celular || "";
  } else {
    alert("No se encontró información del usuario.");
  }
});

// Activar edición
document.getElementById("btnEditar").addEventListener("click", async () => {
  const campos = ["ruc", "razon", "celular"];
  const editando = document.getElementById("ruc").disabled;

  campos.forEach(id => {
    document.getElementById(id).disabled = !editando;
  });

  if (editando) {
    document.getElementById("btnEditar").textContent = "GUARDAR CAMBIOS";
  } else {
    // Guardar cambios
    const nuevosDatos = {
      ruc: document.getElementById("ruc").value.trim(),
      razonSocial: document.getElementById("razon").value.trim(),
      celular: document.getElementById("celular").value.trim()
    };

    try {
      await updateDoc(userDocRef, nuevosDatos);
      alert("Datos actualizados correctamente.");
      document.getElementById("btnEditar").textContent = "Editar Datos";
    } catch (error) {
      alert("Error al actualizar: " + error.message);
    }

    campos.forEach(id => {
      document.getElementById(id).disabled = true;
    });
  }
});

// Mostrar modal de contraseña
document.getElementById("btnCambiarPass").addEventListener("click", () => {
  document.getElementById("modalPass").classList.remove("oculto");
});

// Cerrar modal
document.getElementById("cerrarModalPass").addEventListener("click", () => {
  document.getElementById("modalPass").classList.add("oculto");
});

// Cambiar contraseña
document.getElementById("formPass").addEventListener("submit", async (e) => {
  e.preventDefault();

  const pass1 = document.getElementById("newPass").value.trim();
  const pass2 = document.getElementById("repeatPass").value.trim();

  if (pass1 !== pass2) {
    alert("Las contraseñas no coinciden.");
    return;
  }

  try {
    const user = auth.currentUser;
    await updatePassword(user, pass1);
    alert("Contraseña actualizada correctamente.");
    document.getElementById("modalPass").classList.add("oculto");
    document.getElementById("formPass").reset();
  } catch (err) {
    alert("Error al cambiar contraseña: " + err.message);
  }
});

// Cerrar formulario con botón "X" redirige a inicio.html
btnCerrarCuenta.addEventListener("click", () => {
  window.location.href = "./inicio.html";
});

