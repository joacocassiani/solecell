import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";


// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB-6CBhIb2PPPoY1Bdw59Qrmre2sGLDWaQ",
  authDomain: "solecell-2024.firebaseapp.com",
  projectId: "solecell-2024",
  storageBucket: "solecell-2024.firebasestorage.app",
  messagingSenderId: "306473949436",
  appId: "1:306473949436:web:154f9cdd50148acd901f79",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const today = new Date().toISOString().split("T")[0];

document.addEventListener("DOMContentLoaded", async () => {

  function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
  }
  
  const salesCollection = collection(db, "sales"); // Conexión a la colección "sales"
  const querySnapshot = await getDocs(salesCollection); // Obtener datos desde Firebase

  const sales = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const today = new Date().toISOString().split("T")[0];

  // Elementos donde se mostrarán los indicadores clave
  const totalCobradoEl = document.getElementById("totalCobrado");
  const totalPendienteEl = document.getElementById("totalPendiente");
  const pagosHoyEl = document.getElementById("pagosHoy");
  const todayPaymentsList = document.getElementById("todayPaymentsList");
  const gananciaMarceloEl = document.getElementById("gananciaMarcelo");
  const gananciaColoEl = document.getElementById("gananciaColo");

  // Variables para cálculos
  let totalCobrado = 0;
  let totalPendiente = 0;
  let pagosHoy = 0;
  let totalPaymentsToday = 0;
  let marceloPaymentsToday = 0; // Total Marcelo hoy
  let coloPaymentsToday = 0; // Total Colo hoy
  let gananciaMarcelo = 0;
  let gananciaColo = 0;

  // Procesar cada venta
  sales.forEach((sale) => {
    const saleDate = new Date(sale.saleDate);
    const payments = sale.payments || 0;
    const periodicity = sale.periodicity;
    const cost = Number(sale.productCost) || 0;
    const total = Number(sale.total) || 0;

    // Calcular la ganancia de Marcelo y Colo
    const gananciaMarceloVenta = ((total - cost) * 0.5) + cost;
    const gananciaColoVenta = total - gananciaMarceloVenta;

    gananciaMarcelo += gananciaMarceloVenta;
    gananciaColo += gananciaColoVenta;

    // Inicializar total pendiente y cobrado dinámico
    let totalPagosPendientes = 0;
    let totalPagosRealizados = 0;

    // Calcular los pagos realizados y pendientes
    for (let i = 0; i < payments; i++) {
      const paymentDate = new Date(sale.saleDate);

      if (periodicity === "Semanal") paymentDate.setDate(paymentDate.getDate() + i * 7);
      if (periodicity === "Quincenal") paymentDate.setDate(paymentDate.getDate() + i * 15);
      if (periodicity === "Mensual") paymentDate.setMonth(paymentDate.getMonth() + i);

      const paymentAmount = total / payments;

      if (paymentDate.toISOString().split("T")[0] === today) {
        totalPagosRealizados += paymentAmount;
      } else {
        totalPagosPendientes += paymentAmount;
      }

      if (paymentDate.toISOString().split("T")[0] === today) {
        pagosHoy++;
        totalPaymentsToday += paymentAmount;

        // Calcular cuánto corresponde a Marcelo y Colo para este pago
        const marceloShare = ((paymentAmount - cost / payments) * 0.5) + (cost / payments);
        const coloShare = paymentAmount - marceloShare;

        marceloPaymentsToday += marceloShare;
        coloPaymentsToday += coloShare;

        const paymentItem = document.createElement("li");
        paymentItem.innerHTML = `
          <span>${sale.clientName}</span>: $${Math.round(paymentAmount).toLocaleString("es-AR")} - ${sale.product} 
          
          (Marcelo: $${Math.round(marceloShare).toLocaleString("es-AR")}, Colo: $${Math.round(coloShare).toLocaleString("es-AR")})
          <button class="whatsapp-button" data-phone="${sale.phone}" data-name="${sale.clientName}" data-amount="${Math.round(paymentAmount)}" title="Enviar mensaje por WhatsApp">📞</button>
        `;
        todayPaymentsList.appendChild(paymentItem);
      }
    }

    // Sumar al total cobrado o pendiente general
    totalCobrado += totalPagosRealizados;
    totalPendiente += totalPagosPendientes;
  });

  // Si no hay pagos hoy, mostrar mensaje
  if (pagosHoy === 0) {
    todayPaymentsList.innerHTML = "<li>No hay pagos programados para hoy.</li>";
  } else {
    const totalItem = document.createElement("li");
    totalItem.innerHTML = `
      <strong>Total a cobrar hoy:</strong> $${Math.round(totalPaymentsToday).toLocaleString("es-AR")} 
      
      (Marcelo: $${Math.round(marceloPaymentsToday).toLocaleString("es-AR")}, Colo: $${Math.round(coloPaymentsToday).toLocaleString("es-AR")})
    `;
    todayPaymentsList.appendChild(totalItem);
  }

  // Actualizar los elementos en el DOM
  totalCobradoEl.textContent = `$${Math.round(totalCobrado).toLocaleString("es-AR")}`;
  totalPendienteEl.textContent = `$${Math.round(totalPendiente).toLocaleString("es-AR")}`;
  pagosHoyEl.textContent = pagosHoy;
  gananciaMarceloEl.textContent = `$${Math.round(gananciaMarcelo).toLocaleString("es-AR")}`;
  gananciaColoEl.textContent = `$${Math.round(gananciaColo).toLocaleString("es-AR")}`;
});

document.addEventListener("DOMContentLoaded", () => {
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const calculateButton = document.getElementById("calculateRangeProfit");
  const rangeProfitResult = document.getElementById("rangeProfitResult");

  const normalizeDate = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const calculateRangeProfit = async (startDate, endDate) => {
    // Normalizar fechas
    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);

    // Variables para resultados
    let totalCobrado = 0;
    let marceloTotal = 0;
    let coloTotal = 0;

    try {
      const salesSnapshot = await getDocs(collection(db, "sales"));
      const sales = salesSnapshot.docs.map((doc) => doc.data());

      // Iterar sobre las ventas
      sales.forEach((sale) => {
        const payments = sale.payments || 0;
        const periodicity = sale.periodicity;
        const cost = Number(sale.productCost) || 0;
        const total = Number(sale.total) || 0;

        for (let i = 0; i < payments; i++) {
          const paymentDate = new Date(sale.saleDate);

          if (periodicity === "Semanal") paymentDate.setDate(paymentDate.getDate() + i * 7);
          if (periodicity === "Quincenal") paymentDate.setDate(paymentDate.getDate() + i * 15);
          if (periodicity === "Mensual") paymentDate.setMonth(paymentDate.getMonth() + i);

          const normalizedPaymentDate = normalizeDate(paymentDate);

          if (normalizedPaymentDate >= normalizedStart && normalizedPaymentDate <= normalizedEnd) {
            const paymentAmount = total / payments;

            const marceloShare = ((paymentAmount - cost / payments) * 0.5) + (cost / payments);
            const coloShare = paymentAmount - marceloShare;

            totalCobrado += paymentAmount;
            marceloTotal += marceloShare;
            coloTotal += coloShare;
          }
        }
      });

      // Mostrar resultados
      rangeProfitResult.innerHTML = `
        <p><strong>Total Cobrado:</strong> $${Math.round(totalCobrado).toLocaleString("es-AR")}</p>
        <p><strong>Marcelo:</strong> $${Math.round(marceloTotal).toLocaleString("es-AR")}</p>
        <p><strong>Colo:</strong> $${Math.round(coloTotal).toLocaleString("es-AR")}</p>
      `;
    } catch (error) {
      console.error("Error calculando ganancias:", error);
      rangeProfitResult.innerHTML = `<p>Error al calcular las ganancias.</p>`;
    }
  };

  calculateButton.addEventListener("click", () => {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!startDate || !endDate) {
      alert("Por favor, seleccione un rango de fechas.");
      return;
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (parsedStartDate > parsedEndDate) {
      alert("La fecha de inicio no puede ser mayor a la fecha de fin.");
      return;
    }

    calculateRangeProfit(parsedStartDate, parsedEndDate);
  });
});

todayPaymentsList.addEventListener("click", (e) => {
  if (e.target.classList.contains("whatsapp-button")) {
    const phone = e.target.getAttribute("data-phone"); // Obtener número de teléfono
    const name = e.target.getAttribute("data-name"); // Obtener nombre del cliente
    const amount = e.target.getAttribute("data-amount"); // Obtener el monto del pago

    if (phone) {
      const message = encodeURIComponent(
        `Hola ${name}, le recordamos que hoy tiene un pago pendiente de $${amount}.`
      );
      const whatsappURL = `https://wa.me/${phone}?text=${message}`;
      window.open(whatsappURL, "_blank"); // Abrir WhatsApp en una nueva pestaña
    } else {
      alert("Número de teléfono no disponible.");
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const sendAllWhatsAppBtn = document.getElementById("sendAllWhatsApp");
  const todayPaymentsList = document.getElementById("todayPaymentsList");

  // Manejar clic en el botón para enviar mensajes a todos
  sendAllWhatsAppBtn.addEventListener("click", () => {
    const paymentButtons = todayPaymentsList.querySelectorAll(".whatsapp-button");

    if (paymentButtons.length === 0) {
      alert("No hay pagos pendientes para hoy.");
      return;
    }

    paymentButtons.forEach((button) => {
      const phone = button.getAttribute("data-phone");
      const name = button.getAttribute("data-name");
      const amount = button.getAttribute("data-amount");

      if (phone) {
        const message = encodeURIComponent(
          `Hola ${name}, le recordamos que hoy tiene un pago pendiente de $${amount}.`
        );
        const whatsappURL = `https://wa.me/${phone}?text=${message}`;
        window.open(whatsappURL, "_blank");
      }
    });

    alert("Se han enviado los mensajes a todos los clientes con pagos pendientes hoy.");
  });
});

