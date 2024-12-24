document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Obtener valores de los campos
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Validar credenciales
    if (email === "admin" && password === "admin") {
      // Redirigir al dashboard
      window.location.href = "html/dashboard.html";
    } else {
      alert("Credenciales incorrectas. Intenta de nuevo.");
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard cargado");

  // Ejemplo: Puedes usar Chart.js para un gráfico aquí
  // Chart.js o cualquier otra librería puede integrar fácilmente datos en la sección de gráficos
});