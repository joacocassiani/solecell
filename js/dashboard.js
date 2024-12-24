document.addEventListener("DOMContentLoaded", () => {
  const sales = JSON.parse(localStorage.getItem("sales")) || [];
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
    const saleDate = new Date().toISOString().split("T")[0]; // Ejemplo de formato correcto
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

      if (paymentDate.toISOString().split("T")[0] <= today) {
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

  // Manejar clics en los botones de WhatsApp
  todayPaymentsList.addEventListener("click", (e) => {
    if (e.target.classList.contains("whatsapp-button")) {
      const phone = e.target.getAttribute("data-phone");
      const name = e.target.getAttribute("data-name");
      const amount = e.target.getAttribute("data-amount");

      if (phone) {
        const message = encodeURIComponent(`Hola ${name}, le recordamos que hoy tiene un pago pendiente de $${amount}.`);
        const whatsappURL = `https://wa.me/${phone}?text=${message}`;
        window.open(whatsappURL);
      } else {
        alert("Número de teléfono no disponible.");
      }
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const sales = JSON.parse(localStorage.getItem("sales")) || [];

  // Elementos del rango de fechas
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const calculateButton = document.getElementById("calculateRangeProfit");
  const rangeProfitResult = document.getElementById("rangeProfitResult");

  // Función para calcular ganancias en un rango
  const calculateRangeProfit = (startDate, endDate) => {
    let totalCobrado = 0;
    let marceloTotal = 0;
    let coloTotal = 0;

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

        if (paymentDate >= startDate && paymentDate <= endDate) {
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
      <p><strong>Ganancia Marcelo:</strong> $${Math.round(marceloTotal).toLocaleString("es-AR")}</p>
      <p><strong>Ganancia Colo:</strong> $${Math.round(coloTotal).toLocaleString("es-AR")}</p>
    `;
  };

  // Evento al hacer clic en el botón
  calculateButton.addEventListener("click", () => {
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);

    if (startDateInput.value === "" || endDateInput.value === "") {
      alert("Por favor, seleccione un rango de fechas.");
      return;
    }

    if (startDate > endDate) {
      alert("La fecha de inicio no puede ser mayor a la fecha de fin.");
      return;
    }

    calculateRangeProfit(startDate, endDate);
  });
});