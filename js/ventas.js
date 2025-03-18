import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc, deleteDoc, updateDoc, setDoc  } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";


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

        // Asignar eventos a los botones "Ficha"
        document.querySelectorAll(".pdf-sale").forEach((button) => {
          button.addEventListener("click", (e) => {
            const saleData = JSON.parse(e.target.getAttribute("data-client"));
            generatePDF(saleData);
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

// Función para generar un PDF con los datos de la venta
const generatePDF = (sale) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Función para formatear fecha correctamente en zona horaria local
  const formatDate = (dateString) => {
      const date = new Date(dateString);
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset()); // 🔹 Corrige desfase de zona horaria
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
  };

  // Encabezado del PDF
  const addHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("SOLÉCELL", 105, 15, { align: "center" });
      doc.setFontSize(12);
      doc.text("MÁS TECNOLOGÍA POR SEMANA", 105, 22, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text("CELULARES · SMART TV · ART. DEL HOGAR · PERFUMES IMPORTADOS", 105, 28, { align: "center" });
      doc.text("Atención al cliente:  11-53834227", 105, 34, { align: "center" });
      doc.text("@solecelll", 105, 40, { align: "center" });

      // Línea separadora
      doc.setDrawColor(0, 0, 0);
      doc.line(10, 45, 200, 45);
  };

  // Información del cliente
  const addClientInfo = () => {
      doc.setFont("helvetica", "bold");
      doc.text("Fecha de entrega:", 10, 55);
      doc.setFont("helvetica", "normal");
      doc.text(formatDate(sale.saleDate) || "N/A", 50, 55);

      doc.setFont("helvetica", "bold");
      doc.text("Nombre:", 10, 65);
      doc.setFont("helvetica", "normal");
      doc.text(sale.clientName || "N/A", 50, 65);

      doc.setFont("helvetica", "bold");
      doc.text("Dirección:", 10, 75);
      doc.setFont("helvetica", "normal");
      doc.text(".....", 50, 75);

      doc.setFont("helvetica", "bold");
      doc.text("Teléfono:", 10, 85);
      doc.setFont("helvetica", "normal");
      doc.text(sale.phone || "N/A", 50, 85);

      doc.setFont("helvetica", "bold");
      doc.text("Productos:", 10, 95);
      doc.setFont("helvetica", "normal");
      doc.text(sale.product || "N/A", 50, 95);

      doc.setFont("helvetica", "bold");
      doc.text("Cuota:", 10, 105);
      doc.setFont("helvetica", "normal");
      doc.text(sale.periodicity || "N/A", 50, 105);

      doc.setFont("helvetica", "bold");
      doc.text("Observaciones:", 10, 115);
      doc.setFont("helvetica", "normal");
      doc.text(".....", 50, 115);
  };

  // Configuración de la tabla
  const lineHeight = 10;
  const colX = [10, 30, 80, 120, 160]; // Posiciones X de las columnas
  const tableWidth = 190;
  const maxRowsPerPage = 16; // Máximo de filas antes de agregar una nueva página
  let currentPageRows = 0;
  let yPosition = 125;

  // Función para agregar encabezados de tabla
  const addTableHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.text("N°", colX[0] + 2, yPosition + 5);
      doc.text("FECHA", colX[1] + 5, yPosition + 5);
      doc.text("DESDE", colX[2] + 5, yPosition + 5);
      doc.text("PAGO", colX[3] + 5, yPosition + 5);
      doc.text("SALDO", colX[4] + 5, yPosition + 5);
      doc.rect(10, yPosition, tableWidth, lineHeight); // Encabezado de la tabla
  };

  // Inicializar el PDF
  addHeader();
  addClientInfo();
  addTableHeader();

  let saldo = sale.total;
  const payments = sale.payments || 0;
  const paymentAmount = Math.round(sale.total / payments);
  const startDate = new Date(sale.saleDate);

  for (let i = 0; i < payments; i++) {
      yPosition += lineHeight;

      // Verificar si hay que agregar una nueva página
      if (currentPageRows >= maxRowsPerPage) {
          doc.addPage();
          yPosition = 20; // Reiniciar la posición en la nueva página
          currentPageRows = 0;

          yPosition += 10;
          addTableHeader();
          yPosition += lineHeight;
      }

      // Calcular la fecha de la cuota sin restar un día
      let paymentDate = new Date(startDate);
      if (sale.periodicity.toLowerCase() === "mensual") {
          paymentDate.setMonth(startDate.getMonth() + i);
      } else if (sale.periodicity.toLowerCase() === "quincenal") {
          paymentDate.setDate(startDate.getDate() + i * 15);
      } else if (sale.periodicity.toLowerCase() === "semanal") {
          paymentDate.setDate(startDate.getDate() + i * 7);
      }

      // 🔹 Convertir la fecha correctamente para evitar restas inesperadas
      const formattedDate = formatDate(paymentDate.toISOString().split("T")[0]);

      saldo -= paymentAmount;

      // Dibujar fila
      doc.setFont("helvetica", "normal");
      doc.text(`${i + 1}`, colX[0] + 2, yPosition + 5);
      doc.text(formattedDate, colX[1] + 5, yPosition + 5);
      doc.text("...", colX[2] + 5, yPosition + 5);
      doc.text(`$${paymentAmount.toLocaleString("es-AR")}`, colX[3] + 5, yPosition + 5);
      doc.text(`$${saldo.toLocaleString("es-AR")}`, colX[4] + 5, yPosition + 5);

      // Dibujar borde de la fila
      doc.rect(10, yPosition, tableWidth, lineHeight);

      currentPageRows++;
  }

  if (!window.pdfOpened) {
      window.pdfOpened = true; // Evita múltiples aperturas
      setTimeout(() => {
          window.open(doc.output("bloburl"), "_blank");
          window.pdfOpened = false; // Restablecer después de abrir
      }, 500);
  }
};

// 🔹 Función para eliminar una venta (mover a "deleted_sales")
const deleteSale = async (saleId) => {
  try {
    const saleDocRef = doc(db, "sales", saleId); // Referencia en "sales"
    const saleDocSnap = await getDoc(saleDocRef);

    if (!saleDocSnap.exists()) {
      alert("Error: La venta no existe.");
      return;
    }

    const saleData = saleDocSnap.data();

    // 🔹 Guardar en "deleted_sales"
    const deletedSaleDocRef = doc(db, "deleted_sales", saleId);
    await setDoc(deletedSaleDocRef, saleData);

    // 🔹 Verificar que la copia se realizó correctamente antes de eliminar
    const verifyDeleteSnap = await getDoc(deletedSaleDocRef);
    if (!verifyDeleteSnap.exists()) {
      alert("Error: No se pudo mover la venta a eliminados.");
      return;
    }

    // 🔹 Eliminar de "sales"
    await deleteDoc(saleDocRef);

    alert("Venta eliminada y movida a 'Eliminados'. Puedes restaurarla desde la página de Inicio.");

    // Recargar la lista de ventas para reflejar el cambio
    loadSales(); 
  } catch (error) {
    console.error("Error al eliminar la venta:", error);
    //alert("Hubo un error al eliminar la venta.");
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

