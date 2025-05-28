// VerSalir.js

document.addEventListener("DOMContentLoaded", () => {
  // Botón para regresar al login usuario
  const btnVolverUsuario = document.getElementById("btnVolverUsuario");
  if (btnVolverUsuario) {
    btnVolverUsuario.addEventListener("click", () => {
      window.location.href = "../login/login.html";
    });
  }

  // Botón salir en el encabezado (opcional: agregar en HTML con id="btnSalir")
  const btnSalir = document.getElementById("btnSalir");
  if (btnSalir) {
    btnSalir.addEventListener("click", () => {
      window.location.href = "../login/login.html";
    });
  }
});
