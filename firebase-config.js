// Importar las funciones necesarias desde Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

// Configuración de Firebase de tu proyecto
export const firebaseConfig = {
  apiKey: "AIzaSyCBIFvoUrwHP3ldrTLca-5MB5Oby8tjY_k",
  authDomain: "proyecto1-a6d0b.firebaseapp.com",
  projectId: "proyecto1-a6d0b",
  storageBucket: "proyecto1-a6d0b.firebasestorage.app",
  messagingSenderId: "798646307083",
  appId: "1:798646307083:web:72855ce417055e9fc8fa0e",
  measurementId: "G-T9W2X52KTY"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);
