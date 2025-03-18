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

const loadDeletedSales = async () => {
  const deletedSalesList = document.getElementById("deletedSalesList"); // Asegúrate de tener un <div> con este ID en tu HTML
  deletedSalesList.innerHTML = "<p>Cargando ventas eliminadas...</p>";

  try {
    const deletedSalesSnapshot = await getDocs(collection(db, "deleted_sales"));
    const deletedSales = deletedSalesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (deletedSales.length === 0) {
      deletedSalesList.innerHTML = "<p>No hay ventas eliminadas.</p>";
      return;
    }

    deletedSalesList.innerHTML = ""; // Limpiar antes de agregar elementos

    deletedSales.forEach((sale) => {
      const saleItem = document.createElement("div");
      saleItem.classList.add("deleted-sale-item");

      // ✅ Validar que sale.total no sea undefined antes de llamar .toLocaleString()
      const totalFormatted = sale.total ? `$${sale.total.toLocaleString("es-AR")}` : "Monto no disponible";

      saleItem.innerHTML = `
        <p><strong>${sale.clientName || "Cliente desconocido"}</strong> - ${sale.product || "Producto desconocido"} - ${totalFormatted}</p>
        <button class="restore-sale-btn" data-id="${sale.id}">Restaurar</button>
      `;

      deletedSalesList.appendChild(saleItem);
    });

    // Agregar eventos a los botones de restauración
    document.querySelectorAll(".restore-sale-btn").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const saleId = e.target.getAttribute("data-id");
        restoreSale(saleId);
      });
    });
  } catch (error) {
    console.error("Error al cargar ventas eliminadas:", error);
    deletedSalesList.innerHTML = "<p>Error al cargar las ventas eliminadas.</p>";
  }
};

// Función para restaurar una venta eliminada
const restoreSale = async (saleId) => {
  try {
    const saleDoc = await getDocs(collection(db, "deleted_sales"));
    const saleData = saleDoc.docs.find((doc) => doc.id === saleId)?.data();

    if (!saleData) {
      alert("No se encontró la venta.");
      return;
    }

    // Agregar la venta nuevamente a la colección "sales"
    await setDoc(doc(db, "sales", saleId), saleData);

    // Eliminar la venta de "deleted_sales"
    await deleteDoc(doc(db, "deleted_sales", saleId));

    alert("Venta restaurada con éxito.");
    loadDeletedSales(); // Recargar la lista de ventas eliminadas
  } catch (error) {
    console.error("Error al restaurar la venta:", error);
    alert("Error al restaurar la venta.");
  }
};

// Cargar las ventas eliminadas al cargar la página
document.addEventListener("DOMContentLoaded", loadDeletedSales);

document.addEventListener("DOMContentLoaded", async () => {

  //const today = new Date();
  //today.setHours(0, 0, 0, 0);
  //const todayFormatted = today.toISOString().split("T")[0];

  const salesCollection = collection(db, "sales");
  const querySnapshot = await getDocs(salesCollection);

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
  let marceloPaymentsToday = 0;
  let coloPaymentsToday = 0;
  let gananciaMarcelo = 0;
  let gananciaColo = 0;

  todayPaymentsList.innerHTML = ""; // Limpiar lista antes de agregar elementos

  sales.forEach((sale) => {
    const saleDate = new Date(sale.saleDate);
    const payments = sale.payments || 0;
    const periodicity = sale.periodicity;
    const cost = Number(sale.productCost) || 0;
    const total = Number(sale.total) || 0;

    let totalPagosPendientes = 0;
    let totalPagosRealizados = 0;
    let gananciaMarceloPendiente = 0;
    let gananciaColoPendiente = 0;

    for (let i = 0; i < payments; i++) {
      const paymentDate = new Date(saleDate);

      if (periodicity === "Semanal") paymentDate.setDate(saleDate.getDate() + i * 7);
      if (periodicity === "Quincenal") paymentDate.setDate(saleDate.getDate() + i * 15);
      if (periodicity === "Mensual") paymentDate.setMonth(saleDate.getMonth() + i);

      //paymentDate.setHours(0, 0, 0, 0);
      //const formattedPaymentDate = paymentDate.toISOString().split("T")[0];

      const paymentAmount = total / payments;

      if (paymentDate.toISOString().split("T")[0] < today) {
        totalPagosRealizados += paymentAmount;
      } else {
        totalPagosPendientes += paymentAmount;

        // Calcular ganancias de pagos pendientes
        const marceloShare = ((paymentAmount - cost / payments) * 0.5) + (cost / payments);
        const coloShare = paymentAmount - marceloShare;

        gananciaMarceloPendiente += marceloShare;
        gananciaColoPendiente += coloShare;
      }

      if (paymentDate.toISOString().split("T")[0] === today) {
        pagosHoy++;
        totalPaymentsToday += paymentAmount;

        const marceloShare = ((paymentAmount - cost / payments) * 0.5) + (cost / payments);
        const coloShare = paymentAmount - marceloShare;

        marceloPaymentsToday += marceloShare;
        coloPaymentsToday += coloShare;

        const paymentItem = document.createElement("li");
        paymentItem.innerHTML = `
          <span>${sale.clientName}</span>: 
          $${Math.round(paymentAmount).toLocaleString("es-AR")} - ${sale.product} 
          (Marcelo: $${Math.round(marceloShare).toLocaleString("es-AR")}, Colo: $${Math.round(coloShare).toLocaleString("es-AR")})
          <button class="whatsapp-button" data-phone="${sale.phone}" data-name="${sale.clientName}" data-amount="${Math.round(paymentAmount)}" title="Enviar mensaje por WhatsApp">📞</button>
        `;
        todayPaymentsList.appendChild(paymentItem);
      }
    }

    totalCobrado += totalPagosRealizados;
    totalPendiente += totalPagosPendientes;
    gananciaMarcelo += gananciaMarceloPendiente;
    gananciaColo += gananciaColoPendiente;
  });

  if (pagosHoy === 0) {
    todayPaymentsList.innerHTML = "<li>No hay pagos programados para hoy.</li>";
  } else {
    const totalItem = document.createElement("li");
    totalItem.innerHTML = `
      <strong>Total a cobrar hoy:</strong> 
      $${Math.round(totalPaymentsToday).toLocaleString("es-AR")} 
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

/*
document.addEventListener("DOMContentLoaded", async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayFormatted = today.toISOString().split("T")[0]; // Formato YYYY-MM-DD

  const todayPaymentsList = document.getElementById("todayPaymentsList");

  try {
    const salesSnapshot = await getDocs(collection(db, "sales"));
    const sales = salesSnapshot.docs.map((doc) => doc.data());

    let totalPaymentsToday = 0;
    let marceloPaymentsToday = 0;
    let coloPaymentsToday = 0;

    todayPaymentsList.innerHTML = ""; // Limpiar lista antes de agregar elementos

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

        paymentDate.setHours(0, 0, 0, 0);
        
        const formattedPaymentDate = paymentDate.toISOString().split("T")[0]; // Comparar en formato UTC YYYY-MM-DD

        if (formattedPaymentDate === todayFormatted) {
          const paymentAmount = total / payments;

          const marceloShare = ((paymentAmount - cost / payments) * 0.5) + (cost / payments);
          const coloShare = paymentAmount - marceloShare;

          totalPaymentsToday += paymentAmount;
          marceloPaymentsToday += marceloShare;
          coloPaymentsToday += coloShare;

          // Crear el elemento de la lista con los valores corregidos
          const paymentItem = document.createElement("li");
          paymentItem.innerHTML = `
            <span>${sale.clientName}</span>: 
            $${Math.round(paymentAmount).toLocaleString("es-AR")} - ${sale.product} 
            (Marcelo: $${Math.round(marceloShare).toLocaleString("es-AR")}, Gaston: $${Math.round(coloShare).toLocaleString("es-AR")})
            <button class="whatsapp-button" data-phone="${sale.phone}" data-name="${sale.clientName}" data-amount="${Math.round(paymentAmount)}" title="Enviar mensaje por WhatsApp">📞</button>
          `;
          todayPaymentsList.appendChild(paymentItem);
        }
      }
    });

    if (totalPaymentsToday === 0) {
      todayPaymentsList.innerHTML = "<li>No hay pagos programados para hoy.</li>";
    } else {
      const totalItem = document.createElement("li");
      totalItem.innerHTML = `
        <strong>Total a cobrar hoy:</strong> 
        $${Math.round(totalPaymentsToday).toLocaleString("es-AR")} 
        (Marcelo: $${Math.round(marceloPaymentsToday).toLocaleString("es-AR")}, Gaston: $${Math.round(coloPaymentsToday).toLocaleString("es-AR")})
      `;
      todayPaymentsList.appendChild(totalItem);
    }
  } catch (error) {
    console.error("Error cargando pagos a cobrar hoy:", error);
    todayPaymentsList.innerHTML = "<li>Error al cargar los datos.</li>";
  }
});
*/

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

