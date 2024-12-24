import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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
  const searchInput = document.getElementById("searchInput");
  const totalSalesElement = document.getElementById("totalSales");

  // Elementos para las cartas de acumuladores
  const monthlyCounter = document.getElementById("monthlyCounter");
  const biweeklyCounter = document.getElementById("biweeklyCounter");
  const weeklyCounter = document.getElementById("weeklyCounter");

  // Obtener las ventas desde Firestore
  let sales = [];
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

  // Función para renderizar las ventas en la tabla
  const renderSales = (filter = "") => {
    console.log("Renderizando ventas con filtro:", filter); // Debug
    console.log("Ventas procesadas:", sales); // Debug
    salesTableBody.innerHTML = ""; // Limpiar la tabla antes de renderizar

    // Inicializar acumuladores
    let monthlySales = 0;
    let biweeklySales = 0;
    let weeklySales = 0;
    let totalSales = 0;

    // Filtrar las ventas según el término de búsqueda
    const filteredSales = sales.filter((sale) => {
      return (
        sale.clientName.toLowerCase().includes(filter.toLowerCase()) ||
        sale.product.toLowerCase().includes(filter.toLowerCase()) ||
        (sale.dni || "").toString().includes(filter)
      );
    });

    // Procesar cada venta filtrada
    filteredSales.forEach((sale) => {
      if (sale.periodicity === "Mensual") {
        monthlySales++;
      } else if (sale.periodicity === "Quincenal") {
        biweeklySales++;
      } else if (sale.periodicity === "Semanal") {
        weeklySales++;
      }

      totalSales++;

      const status = getSaleStatus(sale);
      const row = document.createElement("tr");
      row.innerHTML = `
      <td>${sale.dni || "Sin DNI"}</td>
      <td>${sale.clientName || "Sin Cliente"}</td>
      <td>${sale.saleDate || "Sin Fecha"}</td>
      <td>${sale.endDate || "Sin Fecha"}</td>
      <td>${sale.product || "Sin Producto"}</td>
      <td>${sale.quantity || 0}</td>
      <td>${sale.periodicity || "Sin Periodicidad"}</td>
      <td>${sale.payments || 0}</td>
      <td>$${Math.round(sale.productCost || 0).toLocaleString("es-AR")}</td>
      <td>$${Math.round(sale.total || 0).toLocaleString("es-AR")}</td>
      <td>${getSaleStatus(sale)}</td>
      <td>
        <button class="whatsapp-sale" data-index="${sale.id}" clientNumber="${sale.phone || ""}">📞</button>
        <button class="edit-sale" data-id="${sale.id}">✏️</button>
        <button class="delete-sale" data-id="${sale.id}">❌</button>
      </td>
      `;
      salesTableBody.appendChild(row);
    });

    // Actualizar valores de las cartas
    monthlyCounter.textContent = sales.filter((s) => s.periodicity === "Mensual").length;
    biweeklyCounter.textContent = sales.filter((s) => s.periodicity === "Quincenal").length;
    weeklyCounter.textContent = sales.filter((s) => s.periodicity === "Semanal").length;
  
    // Actualizar el total de ventas en el HTML
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

  // Manejo de clics en la tabla
  salesTableBody.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-sale")) {
      const id = e.target.getAttribute("data-id");
      if (confirm("¿Seguro que deseas eliminar esta venta?")) {
        await deleteSale(id);
      }
    }
  });

  // Escuchar eventos en el campo de búsqueda
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value;
    renderSales(searchTerm);
  });

  // Inicializar la tabla
  await fetchSales();
  renderSales();
});