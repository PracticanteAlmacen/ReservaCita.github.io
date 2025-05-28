// usuario.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../../firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ======== Autenticación y bienvenida ========
const mensajeBienvenida = document.getElementById("mensajeBienvenida");
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Vaya... no se pudo obtener acceso a esta página.");
    window.location.href = "../../login/login.html";
    return;
  }
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    mensajeBienvenida.textContent = `Bienvenido(a), ${data.razon}`;
  }
});

// ======== Navegación ========
document.getElementById("btnInicio").onclick = () => location.href = "./usuario.html";
document.getElementById("btnCitas").onclick = () => location.href = "./citas.html";
document.getElementById("btnHistorial").onclick = () => location.href = "./historial.html";
document.getElementById("btnCuenta").onclick = () => location.href = "./cuenta.html";
document.getElementById("btnSalir").onclick = async () => {
  await signOut(auth);
  location.href = "../../login/login.html";
};

// ======== Mostrar modal reserva ========
const btnReservarCita = document.getElementById("btnReservarCita");
const modalReserva = document.getElementById("modalReserva");
const cerrarFormulario = document.getElementById("cerrarFormulario");
btnReservarCita.onclick = () => modalReserva.classList.remove("oculto");
cerrarFormulario.onclick = () => modalReserva.classList.add("oculto");

// ======== Formulario de reserva ========
const formReserva = document.getElementById("formReserva");
const fechaInput = document.getElementById("fecha");
const horaSelect = document.getElementById("hora");
const ayudanteSelect = document.getElementById("ayudante");
const datosAyudante = document.getElementById("datosAyudante");
const estadoCarga = document.getElementById("estadoCarga");
const descripcionCargaContainer = document.getElementById("descripcionCargaContainer");

// Mostrar campos según opciones
document.getElementById("ayudante").addEventListener("change", () => {
  datosAyudante.classList.toggle("oculto", ayudanteSelect.value === "no");
});
document.getElementById("estadoCarga").addEventListener("change", () => {
  descripcionCargaContainer.classList.toggle("oculto", estadoCarga.value !== "con carga");
});

// Rellenar horas disponibles
function generarHoras() {
  horaSelect.innerHTML = '<option value="">-- Seleccionar --</option>';
  const inicio = 7 * 60;
  const fin = 15 * 60 + 30;
  for (let min = inicio; min <= fin; min += 30) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const label = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    const option = document.createElement("option");
    option.value = label;
    option.textContent = label;
    horaSelect.appendChild(option);
  }
}
generarHoras();

// Validar fecha válida (mínimo mañana, sin fines de semana)
fechaInput.addEventListener("change", async () => {
  const fecha = new Date(fechaInput.value);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);
  const dia = fecha.getDay();
  if (fecha < manana || dia === 0 || dia === 6) {
    alert("Seleccione una fecha válida (desde mañana, sin sábados ni domingos)");
    fechaInput.value = "";
    return;
  }
  await actualizarDisponibilidad();
});

async function actualizarDisponibilidad() {
  const fecha = fechaInput.value;
  const q = query(collection(db, "reservas"), where("fecha", "==", fecha));
  const snapshot = await getDocs(q);
  const conteo = {};
  snapshot.forEach(doc => {
    const hora = doc.data().hora;
    conteo[hora] = (conteo[hora] || 0) + 1;
  });
  const opciones = horaSelect.querySelectorAll("option");
  opciones.forEach(opt => {
    if (conteo[opt.value] >= 2) opt.disabled = true;
    else opt.disabled = false;
  });
}

// Enviar reserva
formReserva.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    planta: "SIKA MBCC PERU",
    motivo: document.getElementById("motivo").value,
    fecha: fechaInput.value,
    hora: horaSelect.value,
    cliente: document.getElementById("cliente").value,
    ayudante: ayudanteSelect.value,
    nombreAyudante: ayudanteSelect.value === "si" ? document.getElementById("nombreAyudante").value : "",
    dniAyudante: ayudanteSelect.value === "si" ? document.getElementById("dniAyudante").value : "",
    nombreTransportista: document.getElementById("nombreTransportista").value,
    dniTransportista: document.getElementById("dniTransportista").value,
    celular: document.getElementById("celular").value,
    operador: document.getElementById("operador").value,
    placa: document.getElementById("placa").value,
    estadoCarga: estadoCarga.value,
    descripcionCarga: estadoCarga.value === "con carga" ? document.getElementById("descripcionCarga").value : ""
  };

  try {
    await addDoc(collection(db, "reservas"), data);
    alert("Reserva registrada correctamente.");
    modalReserva.classList.add("oculto");
    formReserva.reset();
    generarHoras();
  } catch (err) {
    alert("Error al registrar: " + err.message);
  }
});
