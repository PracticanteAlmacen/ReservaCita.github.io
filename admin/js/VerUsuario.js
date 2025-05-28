import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../../firebase-config.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tablaUsuarios = document.getElementById("tablaUsuarios").querySelector("tbody");
const modalEditarUsuario = document.getElementById("modalEditarUsuario");
const cerrarModalEditarUsuario = document.getElementById("cerrarModalEditarUsuario");
const formEditarUsuario = document.getElementById("formEditarUsuario");
const btnCerrarUsuarios = document.getElementById("btnCerrarUsuarios");

// Redirigir al inicio al cerrar lista usuarios
btnCerrarUsuarios.addEventListener("click", () => {
  window.location.href = "./VerInicio.html";
});

// Variables para usuario que se está editando
let usuarioEditandoId = null;

// Cargar usuarios y llenar tabla
async function cargarUsuarios() {
  tablaUsuarios.innerHTML = "";
  const snapshot = await getDocs(collection(db, "users"));

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${docSnap.id}</td>
      <td>${data.celular || ""}</td>
      <td>${data.email || ""}</td>
      <td>${data.isAdmin ? "Administrador" : "Usuario"}</td>
      <td>${data.razonSocial || ""}</td>
      <td>
        <button class="btn-editar" data-id="${docSnap.id}">Editar</button>
        <button class="btn-eliminar" data-id="${docSnap.id}">Eliminar</button>
      </td>
    `;

    tablaUsuarios.appendChild(tr);
  });

  agregarEventosBotones();
}

// Agregar eventos a botones de editar y eliminar
function agregarEventosBotones() {
  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (confirm("¿Estás seguro de eliminar este usuario?")) {
        try {
          await deleteDoc(doc(db, "users", id));
          alert("Usuario eliminado correctamente.");
          cargarUsuarios();
        } catch (error) {
          alert("Error al eliminar usuario: " + error.message);
        }
      }
    });
  });

  document.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      usuarioEditandoId = id;
      try {
        // Usar getDoc en lugar de doc(...).get()
        const userDoc = doc(db, "users", id);
        const userSnap = await getDoc(userDoc);

        if (!userSnap.exists()) {
          alert("No se encontró información del usuario.");
          return;
        }
        const data = userSnap.data();

        // Completar formulario con datos del usuario
        formEditarUsuario.editRuc.value = data.ruc || "";
        formEditarUsuario.editRazonSocial.value = data.razonSocial || "";
        formEditarUsuario.editRol.value = data.isAdmin ? "true" : "false";
        formEditarUsuario.editEmail.value = data.email || "";
        formEditarUsuario.editCelular.value = data.celular || "";

        modalEditarUsuario.classList.remove("oculto");
        modalEditarUsuario.setAttribute("aria-hidden", "false");
      } catch (error) {
        alert("Error al cargar usuario: " + error.message);
      }
    });
  });
}

// Cerrar modal
cerrarModalEditarUsuario.addEventListener("click", () => {
  modalEditarUsuario.classList.add("oculto");
  modalEditarUsuario.setAttribute("aria-hidden", "true");
  usuarioEditandoId = null;
});

// Guardar cambios usuario
formEditarUsuario.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!usuarioEditandoId) {
    alert("Error: usuario no seleccionado.");
    return;
  }

  const nuevosDatos = {
  ruc: formEditarUsuario.editRuc.value.trim(),
  razonSocial: formEditarUsuario.editRazonSocial.value.trim(),
  isAdmin: formEditarUsuario.editRol.value === "true",
  celular: formEditarUsuario.editCelular.value.trim()
};


  try {
    await updateDoc(doc(db, "users", usuarioEditandoId), nuevosDatos);
    alert("Usuario actualizado correctamente.");
    modalEditarUsuario.classList.add("oculto");
    modalEditarUsuario.setAttribute("aria-hidden", "true");
    usuarioEditandoId = null;
    cargarUsuarios();
  } catch (error) {
    alert("Error al actualizar usuario: " + error.message);
  }
});

// Inicializar carga de usuarios al abrir la página
cargarUsuarios();
