// Importar Firebase
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

document.addEventListener("DOMContentLoaded", () => {
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const generateButton = document.getElementById("generateTable");
  const exportButton = document.getElementById("exportExcel");
  const paymentTableBody = document.getElementById("paymentTable").querySelector("tbody");

  // Filtrar datos por rango de fechas y calcular montos por cuota
  const filterPaymentsByDate = async (startDate, endDate) => {
    const salesCollection = collection(db, "sales");
    const salesSnapshot = await getDocs(salesCollection);
    const sales = salesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const filteredPayments = [];

    sales.forEach((sale) => {
      const startDateSale = new Date(sale.saleDate);
      const paymentAmount = Math.floor(((sale.total - sale.productCost) * 0.5) / sale.payments + (sale.productCost / sale.payments));

      for (let i = 0; i < sale.payments; i++) {
        const paymentDate = new Date(startDateSale);

        if (sale.periodicity === "Semanal") {
          paymentDate.setDate(startDateSale.getDate() + i * 7);
        } else if (sale.periodicity === "Quincenal") {
          paymentDate.setDate(startDateSale.getDate() + i * 15);
        } else if (sale.periodicity === "Mensual") {
          paymentDate.setMonth(startDateSale.getMonth() + i);
        }

        if (paymentDate >= new Date(startDate) && paymentDate <= new Date(endDate)) {
          filteredPayments.push({
            name: sale.clientName,
            amount: paymentAmount.toFixed(2),
            installment: `Cuota ${i + 1}`,
            date: paymentDate.toISOString().split("T")[0],
          });
        }
      }
    });

    return filteredPayments;
  };

  // Renderizar tabla
  const renderTable = (filteredPayments) => {
    paymentTableBody.innerHTML = ""; // Limpiar la tabla

    if (filteredPayments.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="3">No se encontraron resultados</td>`;
      paymentTableBody.appendChild(row);
      return;
    }

    filteredPayments.forEach((payment) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${payment.name}</td>
        <td>$${payment.amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
        <td>${payment.installment}</td>
        <td>${payment.date}</td>
      `;
      paymentTableBody.appendChild(row);
    });
  };

  // Exportar tabla a Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.table_to_book(document.getElementById("paymentTable"), { sheet: "Cobranza" });
    XLSX.writeFile(workbook, "Cobranza.xlsx");
  };

  // Evento para generar la tabla
  generateButton.addEventListener("click", async () => {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (!startDate || !endDate) {
      alert("Por favor, selecciona un rango de fechas válido.");
      return;
    }

    const filteredPayments = await filterPaymentsByDate(startDate, endDate);
    renderTable(filteredPayments);
  });

  // Evento para exportar a Excel
  exportButton.addEventListener("click", exportToExcel);
});
