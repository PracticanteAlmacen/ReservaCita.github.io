import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "../../firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const ayudante = document.getElementById("ayudante");
const cantidadAyudantes = document.getElementById("cantidadAyudantes");
const datosAyudante = document.getElementById("datosAyudante");
const ayudantesContainer = document.getElementById("ayudantesContainer");
const estadoCarga = document.getElementById("estadoCarga");
const descripcionCargaContainer = document.getElementById("descripcionCargaContainer");
const fechaInput = document.getElementById("fecha");
const horaSelect = document.getElementById("hora");
const mensajeFecha = document.getElementById("mensajeFecha");

let cantidadDeAyudantes = 0;

// Lista de feriados en formato 'YYYY-MM-DD'
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

// Función para verificar si es sábado o domingo
function esSabadoODomingo(fecha) {
  const dia = fecha.getDay();
  return dia === 0 || dia === 6;
}

// Función para validar fecha: mínimo mañana, y no sábado, domingo ni feriado
function esFechaValida(fechaStr) {
  if (!fechaStr) return false;
  const fecha = new Date(fechaStr + "T00:00:00");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  if (fecha < manana) return false;
  if (esSabadoODomingo(fecha)) return false;
  if (feriados.includes(fechaStr)) return false;

  return true;
}

// Generar horarios base (7:00 a 15:30, intervalos 30 min)
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

// Actualizar horas disponibles
async function actualizarHorasDisponibles(fecha) {
  horaSelect.innerHTML = '<option value="">-- Seleccionar --</option>';

  if (!fecha || !esFechaValida(fecha)) {
    horaSelect.innerHTML = '<option value="">Fecha no disponible (sábado, domingo o feriado)</option>';
    horaSelect.disabled = true;
    return;
  }

  horaSelect.disabled = false;

  const horariosBase = generarHorariosBase();

  const q = query(collection(db, "reservas"), where("fecha", "==", fecha));
  const snapshot = await getDocs(q);

  const horasOcupadas = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    const horaReserva = data.hora;
    const estado = data.estado?.toLowerCase();
    if (horaReserva && (estado === "atendida" || estado === "pendiente")) {
      horasOcupadas[horaReserva] = (horasOcupadas[horaReserva] || 0) + 1;
    }
  });

  const horariosDisponibles = horariosBase.filter(hora => !horasOcupadas[hora] || horasOcupadas[hora] < 2);

  horariosDisponibles.forEach(hora => {
    const option = document.createElement("option");
    option.value = hora;
    option.textContent = hora;
    horaSelect.appendChild(option);
  });

  if (horariosDisponibles.length === 0) {
    horaSelect.innerHTML = '<option value="">No hay horarios disponibles para esta fecha</option>';
    horaSelect.disabled = true;
  }
}

// Mostrar/ocultar campos ayudantes
ayudante.addEventListener("change", () => {
  if (ayudante.value === "si") {
    datosAyudante.classList.remove("oculto");
  } else {
    datosAyudante.classList.add("oculto");
    cantidadAyudantes.value = '';
    ayudantesContainer.innerHTML = '';
    cantidadDeAyudantes = 0;
  }
});

// Detectar cantidad ayudantes y generar campos
cantidadAyudantes.addEventListener("input", () => {
  cantidadDeAyudantes = parseInt(cantidadAyudantes.value);
  if (!cantidadDeAyudantes || cantidadDeAyudantes < 1) {
    ayudantesContainer.innerHTML = '';
    return;
  }
  generarCamposAyudantes();
});

// Generar campos dinámicos para ayudantes
function generarCamposAyudantes() {
  ayudantesContainer.innerHTML = '';
  for (let i = 1; i <= cantidadDeAyudantes; i++) {
    const div = document.createElement("div");
    div.style.border = "1px solid #ccc";
    div.style.padding = "10px";
    div.style.marginBottom = "10px";
    div.innerHTML = `
      <h4>AYUDANTE ${i}</h4>
      <label for="nombreAyudante${i}">Nombre Ayudante:</label>
      <input type="text" id="nombreAyudante${i}" name="nombreAyudante${i}" required />
      <label for="dniAyudante${i}">DNI Ayudante:</label>
      <input type="text" id="dniAyudante${i}" name="dniAyudante${i}" required />
    `;
    ayudantesContainer.appendChild(div);
  }
}

// Mostrar/ocultar descripción carga
estadoCarga.addEventListener("change", () => {
  if (estadoCarga.value === "con carga") {
    descripcionCargaContainer.classList.remove("oculto");
  } else {
    descripcionCargaContainer.classList.add("oculto");
    document.getElementById("descripcionCarga").value = '';
  }
});

// Establecer fecha mínima
function setMinDate() {
  const hoy = new Date();
  let nextDay = new Date(hoy);
  nextDay.setDate(nextDay.getDate() + 1);

  while (esSabadoODomingo(nextDay) || feriados.includes(nextDay.toISOString().split("T")[0])) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  fechaInput.min = nextDay.toISOString().split("T")[0];
}
setMinDate();

// Validar fecha y mostrar mensaje
fechaInput.addEventListener("change", () => {
  const fechaSeleccionada = fechaInput.value;
  if (!fechaSeleccionada) {
    mensajeFecha.style.display = "none";
    mensajeFecha.textContent = "";
    return;
  }
  if (!esFechaValida(fechaSeleccionada)) {
    mensajeFecha.style.display = "block";
    mensajeFecha.textContent = "Fecha no disponible";
    fechaInput.value = "";
    horaSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
    horaSelect.disabled = true;
  } else {
    mensajeFecha.style.display = "none";
    mensajeFecha.textContent = "";
  }
});

// Actualizar horas al cambiar fecha
fechaInput.addEventListener("change", async () => {
  await actualizarHorasDisponibles(fechaInput.value);
});

// Enviar formulario
document.getElementById("formReserva").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const mensajeDiv = document.getElementById("mensajeReserva");
  mensajeDiv.textContent = "";
  mensajeDiv.style.color = "red";

  const camposObligatorios = [
    "motivo", "fecha", "hora", "cliente", "ayudante",
    "nombreTransportista", "dniTransportista", "celular",
    "operador", "placa", "estadoCarga"
  ];

  for (const campo of camposObligatorios) {
    if (!form[campo].value.trim()) {
      mensajeDiv.textContent = "Completar todos los datos obligatorios.";
      return;
    }
  }

  if (form.ayudante.value === "si") {
    if (!cantidadAyudantes.value || parseInt(cantidadAyudantes.value) < 1) {
      mensajeDiv.textContent = "Ingrese la cantidad de ayudantes.";
      return;
    }

    for (let i = 1; i <= cantidadDeAyudantes; i++) {
      const nombre = form[`nombreAyudante${i}`]?.value.trim();
      const dni = form[`dniAyudante${i}`]?.value.trim();
      if (!nombre || !dni) {
        mensajeDiv.textContent = `Complete los datos del ayudante ${i}.`;
        return;
      }
    }
  }

  if (form.estadoCarga.value === "con carga" && !form.descripcionCarga.value.trim()) {
    mensajeDiv.textContent = "Completar descripción de la carga.";
    return;
  }

  if (!esFechaValida(form.fecha.value)) {
    mensajeDiv.textContent = "Fecha no válida.";
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      mensajeDiv.textContent = "Debes iniciar sesión para reservar.";
      return;
    }

    let ayudantesData = [];
    if (form.ayudante.value === "si") {
      for (let i = 1; i <= cantidadDeAyudantes; i++) {
        ayudantesData.push({
          nombre: form[`nombreAyudante${i}`].value.trim(),
          dni: form[`dniAyudante${i}`].value.trim()
        });
      }
    }

    const reserva = {
      planta: "SIKA MBCC PERU",
      motivo: form.motivo.value,
      fecha: form.fecha.value,
      hora: form.hora.value,
      cliente: form.cliente.value,
      ayudante: form.ayudante.value,
      cantidadAyudantes: cantidadDeAyudantes,
      ayudantes: ayudantesData,
      nombreTransportista: form.nombreTransportista.value,
      dniTransportista: form.dniTransportista.value,
      celular: form.celular.value,
      operador: form.operador.value,
      placa: form.placa.value,
      estadoCarga: form.estadoCarga.value,
      descripcionCarga: form.descripcionCarga?.value || "",
      estado: "pendiente",
      timestamp: Timestamp.now(),
      usuarioId: user.uid
    };

    try {
      await addDoc(collection(db, "reservas"), reserva);
      mensajeDiv.style.color = "green";
      mensajeDiv.textContent = "Reserva exitosa.";
      form.reset();
      datosAyudante.classList.add("oculto");
      descripcionCargaContainer.classList.add("oculto");
      ayudantesContainer.innerHTML = '';
      horaSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
      horaSelect.disabled = true;
      cantidadDeAyudantes = 0;
    } catch (err) {
      mensajeDiv.textContent = "Error al guardar la reserva: " + err.message;
    }
  });
});

// Cerrar formulario con botón "X"
const btnCerrarReserva = document.getElementById("btnCerrarReserva");
if (btnCerrarReserva) {
  btnCerrarReserva.addEventListener("click", () => {
    window.location.href = "./usuario.html";
  });
}
s