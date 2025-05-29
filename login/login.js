import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const adminLoginForm = document.getElementById('adminLoginForm');
const adminEmailInput = document.getElementById('adminEmail');
const adminPasswordInput = document.getElementById('adminPassword');

const formularioUsuario = document.getElementById('formularioUsuario');
const formularioAdmin = document.getElementById('formularioAdmin');
const btnVolverUsuario = document.getElementById('btnVolverUsuario');

function showError(msg, container) {
  let msgError = container.querySelector('.msgError');
  if (!msgError) {
    msgError = document.createElement('p');
    msgError.className = 'msgError';
    msgError.style.color = 'red';
    container.appendChild(msgError);
  }
  msgError.textContent = msg;
  msgError.style.display = 'block';
}

function clearError(container) {
  const msgError = container.querySelector('.msgError');
  if (msgError) {
    msgError.textContent = '';
    msgError.style.display = 'none';
  }
}

btnVolverUsuario.addEventListener('click', () => {
  formularioAdmin.classList.add('oculto');
  formularioUsuario.classList.remove('oculto');
});

const enlaceAdminLogin = document.querySelector('#formularioUsuario a[href="../admin/html/admin.html"]');
if (enlaceAdminLogin) {
  enlaceAdminLogin.addEventListener('click', e => {
    e.preventDefault();
    formularioUsuario.classList.add('oculto');
    formularioAdmin.classList.remove('oculto');
  });
}

async function emailExists(email) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// Login Usuario
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError(formularioUsuario);

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showError('Por favor, complete todos los campos', formularioUsuario);
    return;
  }

  const exists = await emailExists(email);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocSnap = await getDoc(doc(db, 'users', user.uid));
    const userData = userDocSnap.data();

    if (!userData) {
      showError('Datos del usuario incompletos', formularioUsuario);
      await signOut(auth);
      return;
    }

    if (userData.isAdmin === true) {
      showError('Este usuario es administrador, por favor ingrese por el login de administrador', formularioUsuario);
      await signOut(auth);
      return;
    }

    window.location.href = '../usuario/html/usuario.html';

  } catch (error) {
    if (exists) {
      showError('Contraseña incorrecta', formularioUsuario);
    } else {
      showError('Correo no registrado, intente ingresar con otro correo', formularioUsuario);
    }
  }
});

// Login Administrador
adminLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError(formularioAdmin);

  const email = adminEmailInput.value.trim();
  const password = adminPasswordInput.value.trim();

  if (!email || !password) {
    showError('Por favor, complete todos los campos', formularioAdmin);
    return;
  }

  const exists = await emailExists(email);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userDocSnap = await getDoc(doc(db, 'users', user.uid));
    const userData = userDocSnap.data();

    if (!userData) {
      showError('Datos del usuario incompletos', formularioAdmin);
      await signOut(auth);
      return;
    }

    if (userData.isAdmin === true) {
      window.location.href = '../admin/html/VerInicio.html';
    } else {
      showError('No tienes permisos de administrador', formularioAdmin);
      await signOut(auth);
    }

  } catch (error) {
    if (exists) {
      showError('Contraseña incorrecta', formularioAdmin);
    } else {
      showError('Correo no registrado, intente ingresar con otro correo', formularioAdmin);
    }
  }
});
