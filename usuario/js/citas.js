import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../../firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
let userId = null;

// Inicializa selects de mes y año
function initSelects() {
  // Meses
  monthNames.forEach((m, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = m;
    selectMes.appendChild(option);
  });
  selectMes.value = currentMonth;

  // Años (desde 5 años atrás hasta 5 años adelante)
  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    const option = document.createElement("option");
    option.value = y;
    option.textContent = y;
    selectAnio.appendChild(option);
  }
  selectAnio.value = currentYear;
}

// Escucha cambios en selects para recargar calendario
selectMes.addEventListener("change", () => {
  currentMonth = parseInt(selectMes.value);
  cargarCalendario(currentMonth, currentYear);
});
selectAnio.addEventListener("change", () => {
  currentYear = parseInt(selectAnio.value);
  cargarCalendario(currentMonth, currentYear);
});

cerrarCalendarioBtn.addEventListener("click", () => {
  window.location.href = "./inicio.html";
});


onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Vaya... no se pudo obtener acceso a esta página.");
    window.location.href = "../../login/login.html";
    return;
  }
  userId = user.uid;
  initSelects();
  cargarCalendario(currentMonth, currentYear);
});

async function cargarCalendario(mes, año) {
  cuerpoCalendario.innerHTML = "";

  const primerDiaSemana = new Date(año, mes, 1).getDay();
  const diasEnMes = new Date(año, mes + 1, 0).getDate();

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
        // Número del día en negrita
        const diaNumero = document.createElement("div");
        diaNumero.textContent = diaActual;
        diaNumero.style.fontWeight = "bold";
        celda.appendChild(diaNumero);

        const fechaStr = new Date(año, mes, diaActual).toISOString().split("T")[0];

        (async (celdaRef, fecha) => {
          try {
            const reservasRef = collection(db, "reservas");
            const q = query(
              reservasRef,
              where("usuarioId", "==", userId),
              where("fecha", "==", fecha)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
              const reservas = snapshot.docs.map(doc => doc.data());

              // Contenedor para franjas de colores
              const barrasContenedor = document.createElement("div");
              barrasContenedor.style.display = "flex";
              barrasContenedor.style.marginTop = "4px";
              barrasContenedor.style.height = "10px";
              barrasContenedor.style.borderRadius = "3px";
              barrasContenedor.style.overflow = "hidden";

              reservas.forEach(reserva => {
                const barra = document.createElement("div");
                barra.style.flex = "1";
                barra.style.height = "100%";
                barra.style.marginRight = "1px";

                // Colores según estado
                const estado = reserva.estado.toLowerCase();
                if (estado === "anulado") barra.style.backgroundColor = "#e74c3c";
                else if (estado === "atendida") barra.style.backgroundColor = "#2ecc71";
                else if (estado === "reprogramado") barra.style.backgroundColor = "#3498db";
                else barra.style.backgroundColor = "#f39c12";

                // Tooltip con hora
                barra.title = reserva.hora || "Hora no disponible";

                barrasContenedor.appendChild(barra);
              });

              celdaRef.appendChild(barrasContenedor);
            }
          } catch (error) {
            console.error("Error al cargar reservas:", error);
          }
        })(celda, fechaStr);

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

