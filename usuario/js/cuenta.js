import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  updatePassword
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

const btnCerrarCuenta = document.getElementById("btnCerrarCuenta");
const btnEditar = document.getElementById("btnEditar");
const btnCambiarPass = document.getElementById("btnCambiarPass");

// Botones dinámicos
const btnGuardar = document.createElement("button");
btnGuardar.textContent = "GUARDAR CAMBIOS";
btnGuardar.classList.add("btn-login");
btnGuardar.type = "button";

const btnCancelar = document.createElement("button");
btnCancelar.textContent = "CANCELAR";
btnCancelar.classList.add("btn-login");
btnCancelar.type = "button";

// Contenedor del mensaje "Datos actualizados"
let mensajeGuardado = null;

// Cargar datos del usuario
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

// Editar datos
btnEditar.addEventListener("click", () => {
  ["ruc", "razon", "celular"].forEach(id => {
    document.getElementById(id).disabled = false;
  });

  btnEditar.style.display = "none";
  btnCambiarPass.style.display = "none";

  btnEditar.parentElement.appendChild(btnGuardar);
  btnEditar.parentElement.appendChild(btnCancelar);
});

// Guardar cambios
btnGuardar.addEventListener("click", async () => {
  const nuevosDatos = {
    ruc: document.getElementById("ruc").value.trim(),
    razonSocial: document.getElementById("razon").value.trim(),
    celular: document.getElementById("celular").value.trim()
  };

  try {
    await updateDoc(userDocRef, nuevosDatos);

    // Si ya existe mensaje, eliminarlo antes de crear uno nuevo
    if (mensajeGuardado) {
      mensajeGuardado.remove();
      mensajeGuardado = null;
    }

    // Crear y mostrar mensaje arriba del botón guardar
    mensajeGuardado = document.createElement("p");
    mensajeGuardado.textContent = "Datos actualizados";
    mensajeGuardado.style.color = "green";
    mensajeGuardado.style.fontWeight = "bold";
    mensajeGuardado.style.textAlign = "center";
    mensajeGuardado.style.margin = "0 0 10px 0";

    btnGuardar.parentElement.insertBefore(mensajeGuardado, btnGuardar);

  } catch (error) {
    alert("Error al actualizar: " + error.message);
  }
});

// Cancelar edición
btnCancelar.addEventListener("click", () => {
  cancelarEdicion();
});

function cancelarEdicion() {
  ["ruc", "razon", "celular"].forEach(id => {
    document.getElementById(id).disabled = true;
  });

  btnGuardar.remove();
  btnCancelar.remove();
  btnEditar.style.display = "inline-block";
  btnCambiarPass.style.display = "inline-block";

  // Remover mensaje si existe
  if (mensajeGuardado) {
    mensajeGuardado.remove();
    mensajeGuardado = null;
  }
}

// Mostrar modal de contraseña
btnCambiarPass.addEventListener("click", () => {
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

// Cerrar formulario
btnCerrarCuenta.addEventListener("click", () => {
  window.location.href = "./usuario.html";
});
