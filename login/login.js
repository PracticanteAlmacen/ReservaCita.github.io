import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc
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
    // Crear elemento error si no existe
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

// Manejo de mostrar formulario admin y usuario
// En tu HTML el botón para volver usuario ya existe
btnVolverUsuario.addEventListener('click', () => {
  formularioAdmin.classList.add('oculto');
  formularioUsuario.classList.remove('oculto');
});

// Para mostrar admin, puedes agregar un listener a un botón que ya tengas o crear uno (por ejemplo enlace "¿Eres Administrador? Ingresa aquí")
// Lo tienes en HTML como un enlace con href="../admin/html/admin.html", 
// Si quieres manejarlo aquí sin recargar, puedes hacerlo:

const enlaceAdminLogin = document.querySelector('#formularioUsuario a[href="../admin/html/admin.html"]');
if (enlaceAdminLogin) {
  enlaceAdminLogin.addEventListener('click', e => {
    e.preventDefault();
    formularioUsuario.classList.add('oculto');
    formularioAdmin.classList.remove('oculto');
  });
}

// Login para usuarios normales
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError(formularioUsuario);

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showError('Por favor, complete todos los campos.', formularioUsuario);
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user) {
      showError('No se pudo obtener información del usuario.', formularioUsuario);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      showError('Usuario no registrado en la base de datos.', formularioUsuario);
      await signOut(auth);
      return;
    }

    const userData = userDocSnap.data();

    if (!userData) {
      showError('Datos del usuario incompletos.', formularioUsuario);
      await signOut(auth);
      return;
    }

    // Si es admin, impedir acceso por el login de usuario y mostrar error
    if (userData.isAdmin === true) {
      showError('Este usuario es administrador, por favor ingrese por el login de administrador.', formularioUsuario);
      await signOut(auth);
      return;
    }

    if (userData.isAdmin === false) {
      window.location.href = '../usuario/html/usuario.html';
    } else {
      showError('Error: campo isAdmin no definido correctamente.', formularioUsuario);
      await signOut(auth);
    }
  } catch (error) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        showError('Correo o contraseña incorrectos.', formularioUsuario);
        break;
      case 'auth/invalid-email':
        showError('Correo electrónico no válido.', formularioUsuario);
        break;
  
    }
  }
});

// Login para administradores
adminLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError(formularioAdmin);

  const email = adminEmailInput.value.trim();
  const password = adminPasswordInput.value.trim();

  if (!email || !password) {
    showError('Por favor, complete todos los campos.', formularioAdmin);
    return;
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user) {
      showError('No se pudo obtener información del usuario.', formularioAdmin);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      showError('Usuario no registrado en la base de datos.', formularioAdmin);
      await signOut(auth);
      return;
    }

    const userData = userDocSnap.data();

    if (!userData) {
      showError('Datos del usuario incompletos.', formularioAdmin);
      await signOut(auth);
      return;
    }

    // Solo permitir admin
    if (userData.isAdmin === true) {
      window.location.href = '../admin/html/VerInicio.html';
    } else {
      showError('No tienes permisos de administrador.', formularioAdmin);
      await signOut(auth);
    }
  } catch (error) {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        showError('Correo o contraseña incorrectos.', formularioAdmin);
        break;
      case 'auth/invalid-email':
        showError('Correo electrónico no válido.', formularioAdmin);
        break;
      default:
        showError('Error al iniciar sesión: ' + error.message, formularioAdmin);
    }
  }
});
