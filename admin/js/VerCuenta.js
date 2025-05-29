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
const btnCerrarCuenta = document.getElementById("btnCerrarCuenta");

// Datos originales para revertir en cancelación
let datosOriginales = {};

// Redirección al cerrar formulario
btnCerrarCuenta.addEventListener("click", () => {
  window.location.href = "./VerInicio.html";
});

let currentUserId = null;

// Autenticación y carga de datos
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
        datosOriginales = { ...data };
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

// Editar datos
btnEditar.addEventListener("click", () => {
  ruc.disabled = false;
  razon.disabled = false;
  celular.disabled = false;

  btnEditar.style.display = "none";
  btnCambiarPass.style.display = "none";

  const guardar = document.createElement("button");
  guardar.innerText = "GUARDAR CAMBIOS";
  guardar.className = "btn-login";
  guardar.type = "button";

  const cancelar = document.createElement("button");
  cancelar.innerText = "CANCELAR";
  cancelar.className = "btn-login";
  cancelar.type = "button";

  btnEditar.parentElement.appendChild(guardar);
  btnEditar.parentElement.appendChild(cancelar);

  guardar.addEventListener("click", async () => {
    try {
      await updateDoc(doc(db, "users", currentUserId), {
        ruc: ruc.value.trim(),
        razonSocial: razon.value.trim(),
        celular: celular.value.trim()
      });

      // Crear y mostrar mensaje arriba del botón guardar
      let msg = document.createElement("p");
      msg.textContent = "Datos actualizados";
      msg.style.color = "green";
      msg.style.fontWeight = "bold";
      msg.style.textAlign = "center";
      msg.style.margin = "0 0 10px 0";
      guardar.parentElement.insertBefore(msg, guardar);

      // Ocultar mensaje luego de 3 segundos
      setTimeout(() => {
        msg.remove();
      }, 3000);

    } catch (err) {
      alert("Error al actualizar: " + err.message);
    }
  });

  cancelar.addEventListener("click", () => {
    // Restaurar valores originales
    ruc.value = datosOriginales.ruc || "";
    razon.value = datosOriginales.razonSocial || "";
    celular.value = datosOriginales.celular || "";

    ruc.disabled = true;
    razon.disabled = true;
    celular.disabled = true;

    guardar.remove();
    cancelar.remove();

    btnEditar.style.display = "inline-block";
    btnCambiarPass.style.display = "inline-block";
  });
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
