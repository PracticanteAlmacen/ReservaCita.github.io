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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Vaya... no se pudo obtener acceso a esta página.");
    window.location.href = "../../login/login.html";
    return;
  }

  try {
    const reservasRef = collection(db, "reservas");
    // Filtrar por usuarioId (ajusta si usas otro campo)
    const q = query(reservasRef, where("usuarioId", "==", user.uid));
    const querySnapshot = await getDocs(q);

    const tbody = document.getElementById("tablaHistorial");
    tbody.innerHTML = "";

    if (querySnapshot.empty) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td colspan="10" style="text-align:center;">No se encontraron reservas.</td>`;
      tbody.appendChild(tr);
      return;
    }

    querySnapshot.forEach(doc => {
      const reserva = doc.data();

      // Formatear fecha si es Timestamp o string
      let fechaTexto = "-";
      if (reserva.fecha instanceof Timestamp) {
        fechaTexto = reserva.fecha.toDate().toLocaleDateString("es-PE");
      } else if (typeof reserva.fecha === "string") {
        fechaTexto = reserva.fecha;
      }

      const horaTexto = reserva.hora || "-";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${doc.id}</td>
        <td>${fechaTexto}</td>
        <td>${horaTexto}</td>
        <td>${reserva.cliente || "-"}</td>
        <td>${reserva.nombreTransportista || "-"}</td>
        <td>${reserva.dniTransportista || "-"}</td>
        <td>${reserva.celular || "-"}</td>
        <td>${reserva.placa || "-"}</td>
        <td>${reserva.operador || "-"}</td>
        <td>${reserva.estado || "pendiente"}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (error) {
    alert("Error al cargar el historial: " + error.message);
  }
});

// Botón para cerrar historial y volver a inicio
const btnCerrarHistorial = document.getElementById("btnCerrarHistorial");
if (btnCerrarHistorial) {
  btnCerrarHistorial.addEventListener("click", () => {
    window.location.href = "./inicio.html";
  });
}
