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
  const events = [];
  const dailyTotals = {};

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
    console.error("Error al obtener datos:", error);
  }

  const calendarEl = document.getElementById("calendar");

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: window.innerWidth <= 768 ? "listWeek" : "dayGridMonth",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: window.innerWidth <= 768 ? "listWeek" : "dayGridMonth,timeGridWeek",
    },
    locale: "es",
    editable: false,
    events: events,
    height: "auto",
    dayCellDidMount: (info) => {
      const date = info.date.toISOString().split("T")[0];
      const totalForDay = dailyTotals[date] || 0;

      if (totalForDay > 0) {
        const totalDiv = document.createElement("div");
        totalDiv.textContent = `Total: $${Math.round(totalForDay)}`;
        totalDiv.style.fontSize = "12px";
        totalDiv.style.fontWeight = "bold";
        totalDiv.style.textAlign = "center";
        info.el.appendChild(totalDiv);
      }
    },
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