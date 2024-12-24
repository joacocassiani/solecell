document.addEventListener("DOMContentLoaded", () => {
  // Obtener las ventas del localStorage
  const sales = JSON.parse(localStorage.getItem("sales")) || [];

  // Calcular los eventos de pagos
  const events = [];
  const dailyTotals = {}; // Objeto para almacenar totales diarios

  sales.forEach((sale) => {
    const startDate = new Date(sale.saleDate);
    const payments = sale.payments || 0;
    const periodicity = sale.periodicity;
    const paymentAmount = sale.total / payments;

    for (let i = 0; i < payments; i++) {
      const paymentDate = new Date(startDate);

      // Calcular la fecha de cada pago según la periodicidad
      if (periodicity === "Semanal") {
        paymentDate.setDate(startDate.getDate() + i * 7);
      } else if (periodicity === "Quincenal") {
        paymentDate.setDate(startDate.getDate() + i * 15);
      } else if (periodicity === "Mensual") {
        paymentDate.setMonth(startDate.getMonth() + i);
      }

      const formattedDate = paymentDate.toISOString().split("T")[0];

      // Agregar el pago al total diario
      dailyTotals[formattedDate] = (dailyTotals[formattedDate] || 0) + paymentAmount;

      // Agregar un evento al calendario
      events.push({
        title: `${sale.clientName} - $${Math.round(paymentAmount)} - ${sale.product}`, // Redondear el monto
        allDay: true,
        start: formattedDate,
        backgroundColor: "#3498db",
        borderColor: "#2980b9",
      });
    }
  });

  // Inicializar el calendario
  const calendarEl = document.getElementById("calendar");
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth", // Vista inicial
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    },
    views: {
      timeGridWeek: {
        allDaySlot: true, // Solo mostrar eventos "all-day"
        allDayContent: "",
        slotMinTime: "00:00:00", // Desde la medianoche
        slotMaxTime: "00:00:00", // Hasta la medianoche
        dayHeaderFormat: { weekday: "long" }, // Formato del encabezado del día
      },
      timeGridDay: {
        allDaySlot: true, // Solo mostrar eventos "all-day"
        allDayContent: "",
        slotMinTime: "00:00:00", // Desde la medianoche
        slotMaxTime: "00:00:00", // Hasta la medianoche
      },
    },
    events: events,
    locale: "es",
    editable: false,
    dayCellDidMount: (info) => {
      // Renderizar contenido adicional para cada día
      const date = info.date.toISOString().split("T")[0];
      const totalForDay = dailyTotals[date] || 0;

      // Crear un contenedor para el total diario
      if (totalForDay > 0) {
        const totalDiv = document.createElement("div");
        totalDiv.textContent = `Total: $${Math.round(totalForDay)}`;
        totalDiv.style.fontSize = "14px";
        totalDiv.style.fontWeight = "bold";
        totalDiv.style.textAlign = "center";
        totalDiv.style.marginBottom = "6px";

        // Insertar el total encima del contenido del día
        const cellContent = info.el.querySelector(".fc-daygrid-day-frame");
        if (cellContent) {
          cellContent.prepend(totalDiv);
        }
      }
    },
  });

  calendar.render();
});
