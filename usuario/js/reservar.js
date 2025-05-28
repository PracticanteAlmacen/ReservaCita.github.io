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
const datosAyudante = document.getElementById("datosAyudante");
const estadoCarga = document.getElementById("estadoCarga");
const descripcionCargaContainer = document.getElementById("descripcionCargaContainer");
const fechaInput = document.getElementById("fecha");
const horaSelect = document.getElementById("hora");

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

// Función para verificar si fecha es feriado o fin de semana
function esFechaNoDisponible(fechaStr) {
  const fecha = new Date(fechaStr);
  const dia = fecha.getDay();
  if (dia === 0 || dia === 6) return true; // domingo o sábado
  if (feriados.includes(fechaStr)) return true; // feriado
  return false;
}

// Mostrar/ocultar campos según selección
ayudante.addEventListener("change", () => {
  datosAyudante.classList.toggle("oculto", ayudante.value === "no");
});
estadoCarga.addEventListener("change", () => {
  descripcionCargaContainer.classList.toggle("oculto", estadoCarga.value !== "con carga");
});

// Establecer fecha mínima (24h después) excluyendo fines de semana y feriados
function setMinDate() {
  const today = new Date();
  let nextDay = new Date(today);
  nextDay.setDate(nextDay.getDate() + 1);
  while (esFechaNoDisponible(nextDay.toISOString().split("T")[0])) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  fechaInput.min = nextDay.toISOString().split("T")[0];
}
setMinDate();

// Genera horarios base de lunes a viernes 7:00 a 15:30 con intervalos de 30 min
function generarHorariosBase() {
  const horarios = [];
  for (let h = 7; h <= 15; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 15 && m > 30) continue; // no pasar de 15:30
      horarios.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }
  return horarios;
}

// Actualizar horarios disponibles según reservas y estado
async function actualizarHorasDisponibles(fecha) {
  horaSelect.innerHTML = '<option value="">-- Seleccionar --</option>';

  if (!fecha || esFechaNoDisponible(fecha)) {
    horaSelect.innerHTML = '<option value="">Fecha no disponible (sábado, domingo o feriado)</option>';
    horaSelect.disabled = true;
    return;
  }

  horaSelect.disabled = false;

  const horariosBase = generarHorariosBase();

  // Obtener todas las reservas para la fecha seleccionada
  const q = query(collection(db, "reservas"), where("fecha", "==", fecha));
  const snapshot = await getDocs(q);

  // Contar reservas activas (atendida o pendiente) por hora
  const horasOcupadas = {};
  snapshot.forEach(doc => {
    const data = doc.data();
    const horaReserva = data.hora;
    const estado = data.estado?.toLowerCase();

    if (horaReserva && (estado === "atendida" || estado === "pendiente")) {
      horasOcupadas[horaReserva] = (horasOcupadas[horaReserva] || 0) + 1;
    }
    // No contamos horas con estado "reprogramada" o "anulada"
  });

  // Filtrar horarios base con menos de 2 reservas activas
  const horariosDisponibles = horariosBase.filter(hora => !horasOcupadas[hora] || horasOcupadas[hora] < 2);

  // Añadir opciones al select
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

// Al cambiar la fecha, actualizar horarios disponibles
fechaInput.addEventListener("change", async () => {
  await actualizarHorasDisponibles(fechaInput.value);
});

// Enviar formulario
document.getElementById("formReserva").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;

  if (!form.fecha.value || !form.hora.value) {
    alert("Por favor selecciona fecha y hora válidas.");
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Debes iniciar sesión para reservar.");
      return;
    }

    const reserva = {
      planta: "SIKA MBCC PERU",
      motivo: form.motivo.value,
      fecha: form.fecha.value,
      hora: form.hora.value,
      cliente: form.cliente.value,
      ayudante: form.ayudante.value,
      nombreAyudante: form.nombreAyudante?.value || "",
      dniAyudante: form.dniAyudante?.value || "",
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
      alert("Cita reservada exitosamente.");
      window.location.href = "./citas.html"; // redirige al calendario para refrescar y ver colores actualizados
    } catch (err) {
      alert("Error al guardar la reserva: " + err.message);
    }
  });
});

// Cerrar formulario con botón "X" redirige a inicio.html
const btnCerrarReserva = document.getElementById("btnCerrarReserva");
if(btnCerrarReserva){
  btnCerrarReserva.addEventListener("click", () => {
    window.location.href = "./inicio.html";
  });
}

// Mostrar/ocultar campos según selección
ayudante.addEventListener("change", () => {
  datosAyudante.classList.toggle("oculto", ayudante.value === "no");
});
estadoCarga.addEventListener("change", () => {
  descripcionCargaContainer.classList.toggle("oculto", estadoCarga.value !== "con carga");
});
