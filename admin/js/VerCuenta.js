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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Referencias a elementos
const ruc = document.getElementById("ruc");
const razon = document.getElementById("razon");
const email = document.getElementById("email");
const celular = document.getElementById("celular");
const btnEditar = document.getElementById("btnEditar");
const btnCambiarPass = document.getElementById("btnCambiarPass");
const modalPass = document.getElementById("modalPass");
const cerrarModalPass = document.getElementById("cerrarModalPass");
const formPass = document.getElementById("formPass");

// Código JavaScript en VerCuenta.js
const btnCerrarCuenta = document.getElementById("btnCerrarCuenta");

btnCerrarCuenta.addEventListener("click", () => {
  window.location.href = "./VerInicio.html";
});
let currentUserId = null;

// Cargar datos del administrador
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUserId = user.uid;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      if (data.isAdmin === true) {
        ruc.value = data.ruc || "";
        razon.value = data.razonSocial || "";
        email.value = data.email || "";
        celular.value = data.celular || "";
      } else {
        alert("Acceso no autorizado.");
        window.location.href = "../../login/login.html";
      }
    }
  } else {
    alert("Vaya... no se pudo obtener acceso a esta página.");
    window.location.href = "../../login/login.html";
  }
});

// Activar edición
btnEditar.addEventListener("click", async () => {
  ruc.disabled = false;
  razon.disabled = false;
  celular.disabled = false;

  const guardar = document.createElement("button");
  guardar.innerText = "Guardar";
  guardar.className = "btn-login";
  guardar.type = "button";

  const cerrar = document.createElement("button");
  cerrar.innerText = "Cerrar";
  cerrar.className = "btn-login";
  cerrar.type = "button";

  btnEditar.after(cerrar);
  btnEditar.after(guardar);
  btnEditar.style.display = "none";
  btnCambiarPass.style.display = "none";

  guardar.onclick = async () => {
    try {
      await updateDoc(doc(db, "users", currentUserId), {
        ruc: ruc.value.trim(),
        razon: razon.value.trim(),
        celular: celular.value.trim()
      });
      alert("Datos actualizados correctamente.");
      location.reload();
    } catch (err) {
      alert("Error al actualizar: " + err.message);
    }
  };

  cerrar.onclick = () => location.reload();
});

// Mostrar modal de cambio de contraseña
btnCambiarPass.addEventListener("click", () => {
  modalPass.classList.remove("oculto");
});

// Cerrar modal de cambio de contraseña
cerrarModalPass.addEventListener("click", () => {
  modalPass.classList.add("oculto");
  formPass.reset();
});

// Actualizar contraseña
formPass.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nueva = document.getElementById("newPass").value.trim();
  const repetir = document.getElementById("repeatPass").value.trim();

  if (nueva !== repetir) {
    alert("Las contraseñas no coinciden.");
    return;
  }

  try {
    const user = auth.currentUser;
    await updatePassword(user, nueva);
    alert("Contraseña actualizada correctamente.");
    modalPass.classList.add("oculto");
    formPass.reset();
  } catch (err) {
    alert("Error al cambiar la contraseña: " + err.message);
  }
});
