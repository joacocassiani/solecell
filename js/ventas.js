import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc  } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";


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
  const editForm = document.getElementById("editForm");
  const saveEditButton = document.getElementById("save-edit");
  let currentEditId = null; // ID de la venta que se está editando

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
          <div><strong>Telefono:</strong> ${sale.phone}</div>
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
            <button class="pdf-sale" data-client='${JSON.stringify(sale)}'>🖨️ Ficha</button>
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
          <td>${sale.phone || "Sin Número"}</td>
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
            <button class="pdf-sale" data-client='${JSON.stringify(sale)}'>🖨️ Ficha</button>
            <button class="edit-sale" data-id="${sale.id}">✏️</button>
            <button class="delete-sale" data-id="${sale.id}">❌</button>
          </td>
        `;
        salesTableBody.appendChild(row);
      }

          // Asignar eventos a los botones de edición
    document.querySelectorAll(".edit-sale").forEach((button) => {
      button.addEventListener("click", (e) => {
        const saleId = e.target.getAttribute("data-id");
        const saleToEdit = sales.find((sale) => sale.id === saleId);
        if (saleToEdit) {
          showEditForm(saleToEdit);
        }
      });
    });

      // Función para mostrar el formulario de edición
  const showEditForm = (sale) => {
    currentEditId = sale.id;
    editForm.style.display = "block"; // Mostrar el formulario

    // Llenar el formulario con los datos de la venta
    document.getElementById("edit-dni").value = sale.dni || "";
    document.getElementById("edit-clientName").value = sale.clientName || "";
    document.getElementById("edit-saleDate").value = sale.saleDate || "";
    document.getElementById("edit-endDate").value = sale.endDate || "";
    document.getElementById("edit-product").value = sale.product || "";
    document.getElementById("edit-periodicity").value = sale.periodicity || "Semanal";
    document.getElementById("edit-payments").value = sale.payments || 0;
    document.getElementById("edit-productCost").value = sale.productCost || 0;
    document.getElementById("edit-total").value = sale.total || 0;
  };

  // Función para guardar los cambios
  saveEditButton.addEventListener("click", async () => {
    if (!currentEditId) {
      alert("No se ha seleccionado ninguna venta para editar.");
      return;
    }

    const updatedSale = {
      dni: document.getElementById("edit-dni").value,
      clientName: document.getElementById("edit-clientName").value,
      saleDate: document.getElementById("edit-saleDate").value,
      endDate: document.getElementById("edit-endDate").value,
      product: document.getElementById("edit-product").value,
      periodicity: document.getElementById("edit-periodicity").value,
      payments: parseInt(document.getElementById("edit-payments").value, 10),
      productCost: parseFloat(document.getElementById("edit-productCost").value),
      total: parseFloat(document.getElementById("edit-total").value),
    };

    try {
      await updateDoc(doc(db, "sales", currentEditId), updatedSale);

      // Actualizar localmente
      sales = sales.map((sale) =>
        sale.id === currentEditId ? { id: currentEditId, ...updatedSale } : sale
      );

      renderSales();
      editForm.style.display = "none";
      
    } catch (error) {
      console.error("Error al actualizar la venta:", error);
      alert("Hubo un problema al actualizar la venta.");
    }
    });


    });
    

    // Actualizar contadores
    monthlyCounter.textContent = monthlySales;
    biweeklyCounter.textContent = biweeklySales;
    weeklyCounter.textContent = weeklySales;

    // Actualizar total de ventas
    totalSalesElement.textContent = filteredSales.length;
  };

  const deleteSale = async (id) => {
    try {
      // Eliminar el documento de Firestore
      await deleteDoc(doc(db, "sales", id));
      // Filtrar las ventas para eliminar del estado local
      sales = sales.filter((sale) => sale.id !== id);
      // Volver a renderizar las ventas
      renderSales();
      alert("Venta eliminada correctamente.");
    } catch (error) {
      console.error("Error al eliminar la venta:", error);
      alert("Hubo un problema al eliminar la venta.");
    }
  };


  // Manejo de clics en los botones de acción
  document.addEventListener("click", async (e) => {
    // Verificar si se hizo clic en un botón de eliminar
    if (e.target.classList.contains("delete-sale")) {
      const id = e.target.getAttribute("data-id"); // Obtener el ID de la venta
      if (id && confirm("¿Estás seguro de que deseas eliminar esta venta?")) {
        await deleteSale(id);
      }
    }});


  searchInput.addEventListener("input", (e) => {
    renderSales(e.target.value);
  });

  // Inicializar
  await fetchSales();
  renderSales();
});

