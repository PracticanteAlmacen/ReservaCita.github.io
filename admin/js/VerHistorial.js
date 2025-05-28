import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../../firebase-config.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tablaBody = document.querySelector("#tablaHistorial tbody");
const modalEditar = document.getElementById("modalEditar");
const cerrarModalBtn = document.getElementById("cerrarModalEditar");
const formEditarReserva = document.getElementById("formEditarReserva");

let reservaEditId = null;

// Cargar historial
async function cargarHistorial() {
  tablaBody.innerHTML = "";
  const snapshot = await getDocs(collection(db, "reservas"));
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${docSnap.id}</td>
      <td>${data.fecha || ""}</td>
      <td>${data.hora || ""}</td>
      <td>${data.cliente || ""}</td>
      <td>${data.nombreTransportista || ""}</td>
      <td>${data.dniTransportista || ""}</td>
      <td>${data.celular || ""}</td>
      <td>${data.placa || ""}</td>
      <td>${data.operador || ""}</td>
      <td>${data.estado || ""}</td>
      <td>
        <button class="btn-editar" data-id="${docSnap.id}">Editar</button>
        <button class="btn-eliminar" data-id="${docSnap.id}">Eliminar</button>
      </td>
    `;
    tablaBody.appendChild(tr);
  });
  agregarEventosBotones();
}

function agregarEventosBotones() {
  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("¿Estás seguro de eliminar esta reserva?")) {
        await deleteDoc(doc(db, "reservas", id));
        cargarHistorial();
      }
    });
  });

  document.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", async () => {
      reservaEditId = btn.dataset.id;
      await cargarDatosReserva(reservaEditId);
      abrirModal();
    });
  });
}

// Cargar datos al formulario modal
async function cargarDatosReserva(id) {
  const docRef = doc(db, "reservas", id);
  const docSnap = await getDocs(collection(db, "reservas"));
  const snapshot = await getDocs(query(collection(db, "reservas"), where("__name__", "==", id)));
  if (snapshot.empty) {
    alert("No se encontró la reserva.");
    return;
  }
  const docData = snapshot.docs[0].data();

  document.getElementById("editMotivo").value = docData.motivo || "";
  document.getElementById("editFecha").value = docData.fecha || "";
  await cargarHorasModal(docData.fecha, docData.hora);
  document.getElementById("editCliente").value = docData.cliente || "";
  document.getElementById("editAyudante").value = docData.ayudante || "";
  toggleDatosAyudanteModal(docData.ayudante);
  document.getElementById("editNombreAyudante").value = docData.nombreAyudante || "";
  document.getElementById("editDniAyudante").value = docData.dniAyudante || "";
  document.getElementById("editNombreTransportista").value = docData.nombreTransportista || "";
  document.getElementById("editDniTransportista").value = docData.dniTransportista || "";
  document.getElementById("editCelular").value = docData.celular || "";
  document.getElementById("editOperador").value = docData.operador || "";
  document.getElementById("editPlaca").value = docData.placa || "";
  document.getElementById("editEstadoCarga").value = docData.estadoCarga || "";
  document.getElementById("editDescripcionCarga").value = docData.descripcionCarga || "";
  document.getElementById("editEstado").value = docData.estado || "pendiente";
}

// Mostrar u ocultar campos de ayudante
document.getElementById("editAyudante").addEventListener("change", (e) => {
  toggleDatosAyudanteModal(e.target.value);
});
function toggleDatosAyudanteModal(valor) {
  const contenedor = document.getElementById("editDatosAyudante");
  if (valor === "si") {
    contenedor.classList.remove("oculto");
  } else {
    contenedor.classList.add("oculto");
  }
}

// Cargar horarios para el modal (igual que en reservar.js)
async function cargarHorasModal(fecha, horaSeleccionada) {
  const selectHora = document.getElementById("editHora");
  selectHora.innerHTML = '<option value="">-- Seleccionar --</option>';

  if (!fecha) {
    selectHora.disabled = true;
    return;
  }

  selectHora.disabled = false;

  // Generar horarios base
  const horarios = [];
  for (let h = 7; h <= 15; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 15 && m > 30) continue;
      horarios.push(`${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`);
    }
  }

  // Obtener reservas activas para la fecha
  const snapshot = await getDocs(collection(db, "reservas"));

  // Contar reservas activas por hora
  const horasOcupadas = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.fecha === fecha && (data.estado === "atendida" || data.estado === "pendiente")) {
      horasOcupadas[data.hora] = (horasOcupadas[data.hora] || 0) + 1;
    }
  });

  horarios.forEach(h => {
    const count = horasOcupadas[h] || 0;
    if (count < 2 || h === horaSeleccionada) {
      const option = document.createElement("option");
      option.value = h;
      option.textContent = h;
      if (h === horaSeleccionada) option.selected = true;
      selectHora.appendChild(option);
    }
  });
}

// Abrir y cerrar modal
function abrirModal() {
  modalEditar.classList.remove("oculto");
}

document.getElementById("cerrarModalEditar").addEventListener("click", () => {
  modalEditar.classList.add("oculto");
});

// Guardar cambios
formEditarReserva.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!reservaEditId) return;

  const nuevaData = {
    motivo: formEditarReserva.editMotivo.value,
    fecha: formEditarReserva.editFecha.value,
    hora: formEditarReserva.editHora.value,
    cliente: formEditarReserva.editCliente.value,
    ayudante: formEditarReserva.editAyudante.value,
    nombreAyudante: formEditarReserva.editNombreAyudante.value,
    dniAyudante: formEditarReserva.editDniAyudante.value,
    nombreTransportista: formEditarReserva.editNombreTransportista.value,
    dniTransportista: formEditarReserva.editDniTransportista.value,
    celular: formEditarReserva.editCelular.value,
    operador: formEditarReserva.editOperador.value,
    placa: formEditarReserva.editPlaca.value,
    estadoCarga: formEditarReserva.editEstadoCarga.value,
    descripcionCarga: formEditarReserva.editDescripcionCarga.value,
    estado: formEditarReserva.editEstado.value
  };

  try {
    await updateDoc(doc(db, "reservas", reservaEditId), nuevaData);
    alert("Reserva actualizada correctamente.");
    modalEditar.classList.add("oculto");
    cargarHistorial();
  } catch (error) {
    alert("Error al actualizar la reserva: " + error.message);
  }
});

// Botón cerrar historial redirige a VerInicio.html
document.getElementById("btnCerrarHistorial").addEventListener("click", () => {
  window.location.href = "./VerInicio.html";
});

// Inicializar tabla al cargar la página
cargarHistorial();


