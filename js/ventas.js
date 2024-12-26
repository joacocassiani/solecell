import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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

document.addEventListener("DOMContentLoaded", async () => {
  const salesTableBody = document.getElementById("salesTableBody");
  const cardContainer = document.getElementById("responsiveCardContainer"); // Contenedor de tarjetas para móviles
  const searchInput = document.getElementById("searchInput");
  const totalSalesElement = document.getElementById("totalSales");

  // Elementos para las cartas de acumuladores
  let monthlyCounter = document.getElementById("monthlyCounter");
  let biweeklyCounter = document.getElementById("biweeklyCounter");
  let weeklyCounter = document.getElementById("weeklyCounter");

  let sales = [];

  // Función para obtener ventas desde Firestore
  const fetchSales = async () => {
    const salesCollection = collection(db, "sales");
    const salesSnapshot = await getDocs(salesCollection);
    sales = salesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };

  // Función para determinar el estado de una venta
  const getSaleStatus = (sale) => {
    const today = new Date();
    const endDate = new Date(sale.endDate);
    return today <= endDate ? "Activo" : "Pagado";
  };

  // Función para renderizar las ventas
  const renderSales = (filter = "") => {
    const isMobile = window.innerWidth <= 768; // Verificar si es móvil
    salesTableBody.innerHTML = ""; // Limpiar la tabla
    cardContainer.innerHTML = ""; // Limpiar tarjetas

    // Inicializar acumuladores
    let monthlySales = 0;
    let biweeklySales = 0;
    let weeklySales = 0;

    // Filtrar las ventas
    const filteredSales = sales.filter((sale) => {
      return (
        sale.clientName.toLowerCase().includes(filter.toLowerCase()) ||
        sale.product.toLowerCase().includes(filter.toLowerCase()) ||
        (sale.dni || "").toString().includes(filter)
      );
    });

    // Procesar las ventas filtradas
    filteredSales.forEach((sale) => {
      const status = getSaleStatus(sale);

      // Contar las ventas según la periodicidad
      if (sale.periodicity && sale.periodicity.toLowerCase() === "mensual") {
        monthlySales++;
      } else if (sale.periodicity && sale.periodicity.toLowerCase() === "quincenal") {
        biweeklySales++;
      } else if (sale.periodicity?.toLowerCase() === "semanal"){
        weeklySales++;
      }

      if (isMobile) {
        // Renderizar como tarjetas en móvil
        const card = document.createElement("div");
        card.className = "responsive-card";
        card.innerHTML = `
          <div><strong>DNI:</strong> ${sale.dni || "Sin DNI"}</div>
          <div><strong>Cliente:</strong> ${sale.clientName}</div>
          <div><strong>Fecha Inicio:</strong> ${sale.saleDate}</div>
          <div><strong>Fecha Fin:</strong> ${sale.endDate}</div>
          <div><strong>Producto:</strong> ${sale.product}</div>
          <div><strong>Cantidad:</strong> ${sale.quantity}</div>
          <div><strong>Periodicidad:</strong> ${sale.periodicity}</div>
          <div><strong>Pagos:</strong> ${sale.payments}</div>
          <div><strong>Costo:</strong> $${Math.round(sale.productCost || 0).toLocaleString("es-AR")}</div>
          <div><strong>Venta:</strong> $${Math.round(sale.total || 0).toLocaleString("es-AR")}</div>
          <div><strong>Estado:</strong> ${status}</div>
          <div class="action-buttons">
            <button class="whatsapp-sale" data-id="${sale.id}">📞</button>
            <button class="edit-sale" data-id="${sale.id}">✏️</button>
            <button class="delete-sale" data-id="${sale.id}">❌</button>
          </div>
        `;
        cardContainer.appendChild(card);
      } else {
        // Renderizar como tabla en escritorio
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${sale.dni || "Sin DNI"}</td>
          <td>${sale.clientName}</td>
          <td>${sale.saleDate}</td>
          <td>${sale.endDate}</td>
          <td>${sale.product}</td>
          <td>${sale.quantity}</td>
          <td>${sale.periodicity}</td>
          <td>${sale.payments}</td>
          <td>$${Math.round(sale.productCost || 0).toLocaleString("es-AR")}</td>
          <td>$${Math.round(sale.total || 0).toLocaleString("es-AR")}</td>
          <td>${status}</td>
          <td>
            <button class="whatsapp-sale" data-id="${sale.id}">📞</button>
            <button class="edit-sale" data-id="${sale.id}">✏️</button>
            <button class="delete-sale" data-id="${sale.id}">❌</button>
          </td>
        `;
        salesTableBody.appendChild(row);
      }
    });

    // Actualizar contadores
    monthlyCounter.textContent = monthlySales;
    biweeklyCounter.textContent = biweeklySales;
    weeklyCounter.textContent = weeklySales;

    // Actualizar total de ventas
    totalSalesElement.textContent = filteredSales.length;
  };

  // Función para eliminar una venta
  const deleteSale = async (id) => {
    try {
      await deleteDoc(doc(db, "sales", id));
      sales = sales.filter((sale) => sale.id !== id);
      renderSales();
    } catch (error) {
      console.error("Error al eliminar la venta:", error);
    }
  };

  // Manejo de eventos
  cardContainer.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-sale")) {
      const id = e.target.getAttribute("data-id");
      if (confirm("¿Seguro que deseas eliminar esta venta?")) {
        await deleteSale(id);
      }
    }
  });

  searchInput.addEventListener("input", (e) => {
    renderSales(e.target.value);
  });

  // Inicializar
  await fetchSales();
  renderSales();
});