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

const feriados = [
  "2025-01-01",
  "2025-04-17",
  "2025-05-01",
  "2025-07-28",
  "2025-07-29",
  "2025-08-30",
  "2025-10-08",
  "2025-11-01",
  "2025-12-08",
  "2025-12-25"
];

// Función para formatear fecha a YYYY-MM-DD
function formatDateToYYYYMMDD(date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function esSabadoODomingo(fecha) {
  const dia = fecha.getDay();
  return dia === 0 || dia === 6;
}

function esFechaValida(fechaStr) {
  if (!fechaStr) return false;
  const fecha = new Date(fechaStr + "T00:00:00");
  const diaSemana = fecha.getDay();
  if (diaSemana === 0 || diaSemana === 6) return false;
  if (feriados.includes(fechaStr)) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (fecha < hoy) return false;
  return true;
}

function generarHorariosBase() {
  const horarios = [];
  for (let h = 7; h <= 15; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 15 && m > 30) continue;
      horarios.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }
  return horarios;
}

async function cargarHorasModal(fecha, horaSeleccionada) {
  const selectHora = document.getElementById("editHora");
  selectHora.innerHTML = '<option value="">-- Seleccionar --</option>';

  if (!fecha) {
    selectHora.disabled = true;
    return;
  }
  selectHora.disabled = false;

  const horariosBase = generarHorariosBase();

  const snapshot = await getDocs(collection(db, "reservas"));

  const horasOcupadas = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.fecha === fecha && (data.estado === "atendida" || data.estado === "pendiente")) {
      horasOcupadas[data.hora] = (horasOcupadas[data.hora] || 0) + 1;
    }
  });

  horariosBase.forEach(hora => {
    const count = horasOcupadas[hora] || 0;
    if (count < 2 || hora === horaSeleccionada) {
      const option = document.createElement("option");
      option.value = hora;
      option.textContent = hora;
      if (hora === horaSeleccionada) option.selected = true;
      selectHora.appendChild(option);
    }
  });
}

// Mostrar u ocultar campos ayudante y cantidad de ayudantes
const editAyudanteSelect = document.getElementById("editAyudante");
const editDatosAyudante = document.getElementById("editDatosAyudante");
const editCantidadAyudantes = document.getElementById("editCantidadAyudantes");
const editAyudantesContainer = document.getElementById("editAyudantesContainer");

editAyudanteSelect.addEventListener("change", () => {
  if (editAyudanteSelect.value === "si") {
    editDatosAyudante.classList.remove("oculto");
  } else {
    editDatosAyudante.classList.add("oculto");
    editCantidadAyudantes.value = '';
    editAyudantesContainer.innerHTML = '';
  }
});

editCantidadAyudantes.addEventListener("input", () => {
  const cantidad = parseInt(editCantidadAyudantes.value);
  if (!cantidad || cantidad < 1) {
    editAyudantesContainer.innerHTML = '';
    return;
  }
  generarCamposAyudantesEdicion(cantidad);
});

function generarCamposAyudantesEdicion(cantidad) {
  editAyudantesContainer.innerHTML = '';
  for (let i = 1; i <= cantidad; i++) {
    const div = document.createElement("div");
    div.style.border = "1px solid #ccc";
    div.style.padding = "10px";
    div.style.marginBottom = "10px";
    div.innerHTML = `
      <h4>Ayudante ${i}</h4>
      <label for="editNombreAyudante${i}">Nombre Ayudante:</label>
      <input type="text" id="editNombreAyudante${i}" name="editNombreAyudante${i}" />
      <label for="editDniAyudante${i}">DNI Ayudante:</label>
      <input type="text" id="editDniAyudante${i}" name="editDniAyudante${i}" />
    `;
    editAyudantesContainer.appendChild(div);
  }
}

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

// Cargar datos para editar, incluyendo ayudantes dinámicos
async function cargarDatosReserva(id) {
  const snapshot = await getDocs(query(collection(db, "reservas"), where("__name__", "==", id)));
  if (snapshot.empty) {
    alert("No se encontró la reserva.");
    return;
  }
  const docData = snapshot.docs[0].data();

  formEditarReserva.editMotivo.value = docData.motivo || "";
  formEditarReserva.editFecha.value = docData.fecha || "";
  await cargarHorasModal(docData.fecha, docData.hora);
  formEditarReserva.editCliente.value = docData.cliente || "";
  formEditarReserva.editAyudante.value = docData.ayudante || "no";

  if (docData.ayudante === "si") {
    editDatosAyudante.classList.remove("oculto");
    const cantidad = docData.cantidadAyudantes || (docData.ayudantes ? docData.ayudantes.length : 0);
    formEditarReserva.editCantidadAyudantes.value = cantidad;
    generarCamposAyudantesEdicion(cantidad);

    // Rellenar datos de ayudantes
    if (docData.ayudantes && Array.isArray(docData.ayudantes)) {
      docData.ayudantes.forEach((ayud, idx) => {
        const nombreInput = document.getElementById(`editNombreAyudante${idx + 1}`);
        const dniInput = document.getElementById(`editDniAyudante${idx + 1}`);
        if (nombreInput && dniInput) {
          nombreInput.value = ayud.nombre || "";
          dniInput.value = ayud.dni || "";
        }
      });
    }
  } else {
    editDatosAyudante.classList.add("oculto");
    editAyudantesContainer.innerHTML = '';
    formEditarReserva.editCantidadAyudantes.value = '';
  }

  formEditarReserva.editNombreTransportista.value = docData.nombreTransportista || "";
  formEditarReserva.editDniTransportista.value = docData.dniTransportista || "";
  formEditarReserva.editCelular.value = docData.celular || "";
  formEditarReserva.editOperador.value = docData.operador || "";
  formEditarReserva.editPlaca.value = docData.placa || "";
  formEditarReserva.editEstadoCarga.value = docData.estadoCarga || "";

  // Mostrar/ocultar descripción de carga
  if (docData.estadoCarga === "con carga") {
    document.getElementById("editDescripcionCargaContainer").classList.remove("oculto");
    formEditarReserva.editDescripcionCarga.value = docData.descripcionCarga || "";
  } else {
    document.getElementById("editDescripcionCargaContainer").classList.add("oculto");
    formEditarReserva.editDescripcionCarga.value = "";
  }

  formEditarReserva.editEstado.value = docData.estado || "pendiente";
}

// Mostrar/ocultar descripción de carga en edición
const editEstadoCargaSelect = document.getElementById("editEstadoCarga");
editEstadoCargaSelect.addEventListener("change", () => {
  if (editEstadoCargaSelect.value === "con carga") {
    document.getElementById("editDescripcionCargaContainer").classList.remove("oculto");
  } else {
    document.getElementById("editDescripcionCargaContainer").classList.add("oculto");
    formEditarReserva.editDescripcionCarga.value = "";
  }
});

// Abrir y cerrar modal
function abrirModal() {
  modalEditar.classList.remove("oculto");
}

cerrarModalBtn.addEventListener("click", () => {
  modalEditar.classList.add("oculto");
});

// Validar fecha edición
const inputFecha = document.getElementById("editFecha");
const mensajeFechaEditar = document.getElementById("mensajeFechaEditar");
inputFecha.min = formatDateToYYYYMMDD(new Date());

inputFecha.addEventListener("change", () => {
  const val = inputFecha.value;
  if (!val) {
    mensajeFechaEditar.style.display = "none";
    mensajeFechaEditar.textContent = "";
    return;
  }
  if (!esFechaValida(val)) {
    mensajeFechaEditar.style.display = "block";
    mensajeFechaEditar.textContent = "Fecha no disponible";
    inputFecha.value = "";
  } else {
    mensajeFechaEditar.style.display = "none";
    mensajeFechaEditar.textContent = "";
  }
});

// Guardar cambios con validaciones
formEditarReserva.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!reservaEditId) return;

  if (!inputFecha.value || !esFechaValida(inputFecha.value)) {
    alert("Por favor, seleccione una fecha válida.");
    return;
  }

  // Validar campos obligatorios
  const camposObligatorios = [
    "editMotivo", "editFecha", "editHora", "editCliente", "editAyudante",
    "editNombreTransportista", "editDniTransportista", "editCelular",
    "editOperador", "editPlaca", "editEstadoCarga", "editEstado"
  ];

  for (const campo of camposObligatorios) {
    if (!formEditarReserva[campo].value.trim()) {
      alert("Completar todos los datos obligatorios.");
      return;
    }
  }

  // Validar ayudantes si corresponde
  if (formEditarReserva.editAyudante.value === "si") {
    const cantidad = parseInt(formEditarReserva.editCantidadAyudantes.value);
    if (!cantidad || cantidad < 1) {
      alert("Ingrese la cantidad de ayudantes.");
      return;
    }
    for (let i = 1; i <= cantidad; i++) {
      const nombre = formEditarReserva[`editNombreAyudante${i}`]?.value.trim();
      const dni = formEditarReserva[`editDniAyudante${i}`]?.value.trim();
      if (!nombre || !dni) {
        alert(`Complete los datos del ayudante ${i}.`);
        return;
      }
    }
  }

  if (formEditarReserva.editEstadoCarga.value === "con carga" && !formEditarReserva.editDescripcionCarga.value.trim()) {
    alert("Completar descripción de la carga.");
    return;
  }

  // Preparar ayudantes para guardar
  let ayudantesData = [];
  if (formEditarReserva.editAyudante.value === "si") {
    const cantidad = parseInt(formEditarReserva.editCantidadAyudantes.value);
    for (let i = 1; i <= cantidad; i++) {
      ayudantesData.push({
        nombre: formEditarReserva[`editNombreAyudante${i}`].value.trim(),
        dni: formEditarReserva[`editDniAyudante${i}`].value.trim()
      });
    }
  }

  const nuevaData = {
    motivo: formEditarReserva.editMotivo.value,
    fecha: formEditarReserva.editFecha.value,
    hora: formEditarReserva.editHora.value,
    cliente: formEditarReserva.editCliente.value,
    ayudante: formEditarReserva.editAyudante.value,
    cantidadAyudantes: formEditarReserva.editAyudante.value === "si" ? parseInt(formEditarReserva.editCantidadAyudantes.value) : 0,
    ayudantes: ayudantesData,
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
    alert("Cambios guardados correctamente.");
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
