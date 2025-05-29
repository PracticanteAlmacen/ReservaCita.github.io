import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  getDocs,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "../../firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const cuerpoCalendario = document.getElementById("cuerpoCalendario");
const selectMes = document.getElementById("selectMes");
const selectAnio = document.getElementById("selectAnio");
const cerrarCalendarioBtn = document.getElementById("cerrarCalendario");

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

function initSelects() {
  selectMes.innerHTML = "";
  selectAnio.innerHTML = "";

  monthNames.forEach((m, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = m;
    selectMes.appendChild(option);
  });
  selectMes.value = currentMonth;

  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    selectAnio.appendChild(option);
  }
  selectAnio.value = currentYear;
}

selectMes.addEventListener("change", () => {
  currentMonth = parseInt(selectMes.value);
  cargarCalendario(currentMonth, currentYear);
});
selectAnio.addEventListener("change", () => {
  currentYear = parseInt(selectAnio.value);
  cargarCalendario(currentMonth, currentYear);
});

cerrarCalendarioBtn.addEventListener("click", () => {
  window.location.href = "./VerInicio.html";
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Vaya... no se pudo obtener acceso a esta página.");
    window.location.href = "../../login/login.html";
    return;
  }
  initSelects();
  cargarCalendario(currentMonth, currentYear);
});

async function cargarCalendario(mes, año) {
  cuerpoCalendario.innerHTML = "";

  const primerDiaSemana = new Date(año, mes, 1).getDay();
  const diasEnMes = new Date(año, mes + 1, 0).getDate();

  const reservasRef = collection(db, "reservas");
  const snapshot = await getDocs(reservasRef);

  const reservasMes = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(reserva => {
      if (!reserva.fecha) return false;
      let fechaStr = reserva.fecha;
      if (reserva.fecha.toDate) {
        fechaStr = reserva.fecha.toDate().toISOString().split("T")[0];
      }
      return fechaStr.startsWith(`${año}-${String(mes + 1).padStart(2, "0")}`);
    });

  let fila;
  let diaActual = 1;

  for (let filaIndex = 0; filaIndex < 6; filaIndex++) {
    fila = document.createElement("tr");
    let filaTieneDias = false;

    for (let diaSemana = 0; diaSemana < 7; diaSemana++) {
      const celda = document.createElement("td");

      if (filaIndex === 0 && diaSemana < primerDiaSemana) {
        celda.textContent = "";
      } else if (diaActual > diasEnMes) {
        celda.textContent = "";
      } else {
        filaTieneDias = true;
        celda.classList.add("calendario-dia");
        celda.style.position = "relative";
        celda.textContent = diaActual;

        const reservasDia = reservasMes.filter(reserva => {
          let fechaStr = reserva.fecha;
          if (reserva.fecha.toDate) {
            fechaStr = reserva.fecha.toDate().toISOString().split("T")[0];
          }
          return fechaStr === `${año}-${String(mes + 1).padStart(2, "0")}-${String(diaActual).padStart(2, "0")}`;
        });

        if (reservasDia.length > 0) {
          const franjasContainer = document.createElement("div");
          franjasContainer.style.display = "flex";
          franjasContainer.style.height = "8px";
          franjasContainer.style.position = "absolute";
          franjasContainer.style.bottom = "2px";
          franjasContainer.style.left = "2px";
          franjasContainer.style.right = "2px";
          franjasContainer.style.borderRadius = "4px";
          franjasContainer.style.overflow = "hidden";

          reservasDia.forEach(reserva => {
            const franja = document.createElement("div");
            franja.style.flex = "1";
            franja.style.height = "100%";
            franja.style.backgroundColor = estadoColor(reserva.estado);
            franja.style.borderRight = "1px solid white";
            // Solo mostrar hora en tooltip
            franja.title = reserva.hora || "";
            franjasContainer.appendChild(franja);
          });

          celda.appendChild(franjasContainer);
        }

        diaActual++;
      }

      fila.appendChild(celda);
    }

    if (filaTieneDias) {
      cuerpoCalendario.appendChild(fila);
    } else {
      break;
    }
  }
}

function estadoColor(estado) {
  if (!estado) return "#f39c12"; // naranja pendiente por defecto
  switch (estado.toLowerCase()) {
    case "atendida": return "#2ecc71"; // verde
    case "anulado":
    case "anulada": return "#e74c3c"; // rojo
    case "pendiente": return "#f39c12"; // naranja
    case "reprogramado":
    case "reprogramada": return "#3498db"; // azul
    default: return "#95a5a6"; // gris para estados no definidos
  }
}
