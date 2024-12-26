import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

document.addEventListener("DOMContentLoaded", async () => {
  const calendarEl = document.getElementById("calendar");

  const events = [];
  const dailyTotals = {};
  const weeklyTotals = {};

  // Obtener datos desde Firebase
  try {
    const salesSnapshot = await getDocs(collection(db, "sales"));
    const sales = salesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    sales.forEach((sale) => {
      const startDate = new Date(sale.saleDate);
      const payments = sale.payments || 0;
      const periodicity = sale.periodicity;
      const paymentAmount = sale.total / payments;

      for (let i = 0; i < payments; i++) {
        const paymentDate = new Date(startDate);

        if (periodicity === "Semanal") {
          paymentDate.setDate(startDate.getDate() + i * 7);
        } else if (periodicity === "Quincenal") {
          paymentDate.setDate(startDate.getDate() + i * 15);
        } else if (periodicity === "Mensual") {
          paymentDate.setMonth(startDate.getMonth() + i);
        }

        const formattedDate = paymentDate.toISOString().split("T")[0];

        dailyTotals[formattedDate] = (dailyTotals[formattedDate] || 0) + paymentAmount;

        const week = `${paymentDate.getFullYear()}-W${Math.ceil(
          (paymentDate.getDate() + 6 - paymentDate.getDay()) / 7
        )}`;
        weeklyTotals[week] = (weeklyTotals[week] || 0) + paymentAmount;

        events.push({
          title: `${sale.clientName} - $${Math.round(paymentAmount)} - ${sale.product}`,
          start: formattedDate,
          allDay: true,
          backgroundColor: "#3498db",
          borderColor: "#2980b9",
        });
      }
    });
  } catch (error) {
    console.error("Error al cargar datos desde Firebase:", error);
  }

  // Crear y renderizar el calendario
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: window.innerWidth <= 768 ? "listWeek" : "dayGridMonth",
    headerToolbar: {
      left: window.innerWidth <= 768 ? "prev,next" : "prev,next today",
      center: "title",
      right: window.innerWidth <= 768 ? "" : "dayGridMonth,listWeek",
    },
    buttonText: {
      today: "Hoy",
      month: "Mes",
      week: "Semana",
      list: "Lista",
    },
    events: events,
    locale: "es",
    height: "auto",
    editable: false,
    dayCellDidMount: (info) => {
      const date = info.date.toISOString().split("T")[0];
      const totalForDay = dailyTotals[date] || 0;

      if (totalForDay > 0) {
        const totalDiv = document.createElement("div");
        totalDiv.textContent = `Total: $${Math.round(totalForDay)}`;
        totalDiv.style.fontSize = "12px";
        totalDiv.style.fontWeight = "bold";
        totalDiv.style.color = "#000";
        totalDiv.style.textAlign = "center";
        totalDiv.style.marginTop = "5px";

        info.el.appendChild(totalDiv);
      }
    },
    datesSet: (info) => {
      const weekTotalDiv = document.getElementById("weekTotal");
      const monthTotalDiv = document.getElementById("monthTotal");
    
      if (info.view.type === "listWeek") {
        const weekStart = info.start;
        const weekEnd = info.end;
    
        let totalForWeek = 0;
    
        for (const [date, total] of Object.entries(dailyTotals)) {
          const currentDate = new Date(date);
          if (currentDate >= weekStart && currentDate < weekEnd) {
            totalForWeek += total;
          }
        }
    
        if (!weekTotalDiv) {
          const newDiv = document.createElement("div");
          newDiv.id = "weekTotal";
          newDiv.style.fontSize = "16px";
          newDiv.style.fontWeight = "bold";
          newDiv.style.textAlign = "center";
          newDiv.style.marginTop = "10px";
          newDiv.style.color = "#000";
          newDiv.textContent = `Total Semana: $${Math.round(totalForWeek)}`;
          calendarEl.parentElement.appendChild(newDiv);
        } else {
          weekTotalDiv.textContent = `Total Semana: $${Math.round(totalForWeek)}`;
        }
      } else if (info.view.type === "dayGridMonth") {
        const monthStart = info.start;
        const monthEnd = info.end;
    
        let totalForMonth = 0;
    
        for (const [date, total] of Object.entries(dailyTotals)) {
          const currentDate = new Date(date);
          if (currentDate >= monthStart && currentDate < monthEnd) {
            totalForMonth += total;
          }
        }
    
        if (!monthTotalDiv) {
          const newDiv = document.createElement("div");
          newDiv.id = "monthTotal";
          newDiv.style.fontSize = "16px";
          newDiv.style.fontWeight = "bold";
          newDiv.style.textAlign = "center";
          newDiv.style.marginTop = "10px";
          newDiv.style.color = "#000";
          newDiv.textContent = `Total Mes: $${Math.round(totalForMonth)}`;
          calendarEl.parentElement.appendChild(newDiv);
        } else {
          monthTotalDiv.textContent = `Total Mes: $${Math.round(totalForMonth)}`;
        }
    
        // Asegurarse de ocultar el total semanal en la vista mensual
        if (weekTotalDiv) weekTotalDiv.style.display = "none";
      }
    
      // Ocultar el total mensual en otras vistas
      if (info.view.type !== "dayGridMonth" && monthTotalDiv) {
        monthTotalDiv.style.display = "none";
      }
    }
  });

  calendar.render();

  // Actualizar tamaño del calendario al redimensionar la ventana
  window.addEventListener("resize", () => {
    calendar.setOption(
      "initialView",
      window.innerWidth <= 768 ? "listWeek" : "dayGridMonth"
    );
  });
});