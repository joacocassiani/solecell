import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Configuración de Firebase (reemplaza con tus datos de Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyB-6CBhIb2PPPoY1Bdw59Qrmre2sGLDWaQ",
  authDomain: "solecell-2024.firebaseapp.com",
  projectId: "solecell-2024",
  storageBucket: "solecell-2024.firebasestorage.app",
  messagingSenderId: "306473949436",
  appId: "1:306473949436:web:154f9cdd50148acd901f79",
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const newSaleForm = document.getElementById("newSaleForm");

  newSaleForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Obtener los valores del formulario
    const clientName = document.getElementById("clientName").value;
    const dni = document.getElementById("clientDni").value;
    const phone = document.getElementById("clientNumber").value;
    const product = document.getElementById("product").value;
    const quantity = parseInt(document.getElementById("quantity").value, 10);
    const saleDate = document.getElementById("saleDate").value;
    const paymentCount = parseInt(document.getElementById("saleCant").value, 10);
    const periodicity = document.getElementById("periodicidad").value;
    const amount = parseFloat(document.getElementById("saleAmount").value); // Monto unitario
    const cost = parseFloat(document.getElementById("productCost").value);

    // Calcular el total como cantidad * monto
    const total = quantity * amount;

    // Calcular la fecha de finalización
    const startDate = new Date(saleDate);
    let endDate = new Date(startDate);

    if (periodicity === "Semanal") {
      endDate.setDate(startDate.getDate() + paymentCount * 7);
    } else if (periodicity === "Quincenal") {
      endDate.setDate(startDate.getDate() + paymentCount * 15);
    } else if (periodicity === "Mensual") {
      endDate.setMonth(startDate.getMonth() + paymentCount);
    }

    // Crear un objeto con los datos de la venta
    const newSale = {
      dni,
      clientName,
      saleDate,
      endDate: endDate.toISOString().split("T")[0], // Fecha final en formato YYYY-MM-DD
      product,
      quantity, // Nuevo campo
      periodicity, // Periodicidad
      payments: paymentCount,
      productCost: cost, // Capturar costo
      total,
      phone,
    };

    try {
      // Guardar la venta en Firestore
      await addDoc(collection(db, "sales"), newSale);

      // Mostrar mensaje de éxito
      alert("Venta registrada exitosamente");

      // Redirigir a la página de ventas
      window.location.href = "../html/ventas.html";
    } catch (error) {
      console.error("Error al registrar la venta:", error);
      alert("Ocurrió un error al registrar la venta. Por favor, inténtalo nuevamente.");
    }
  });
});

// Deshabilitar el scroll en los campos de número
document.querySelectorAll('input[type="number"]').forEach((input) => {
  input.addEventListener('wheel', (e) => e.preventDefault());
});