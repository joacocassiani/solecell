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

  const totalCobradoEl    = document.getElementById("totalCobrado");
  const totalPendienteEl  = document.getElementById("totalPendiente");
  const pagosHoyEl        = document.getElementById("pagosHoy");
  const todayPaymentsList = document.getElementById("todayPaymentsList");

  // ─── Función principal (se puede volver a llamar tras reprogramar) ───────────
  const loadDashboard = async () => {
    const salesCollection = collection(db, "sales");
    const querySnapshot   = await getDocs(salesCollection);
    const sales = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD UTC

    let totalCobrado       = 0;
    let totalPendiente     = 0;
    let pagosHoy           = 0;
    let totalPaymentsToday = 0;

    todayPaymentsList.innerHTML = ""; // limpiar lista

    sales.forEach((sale) => {
      const saleDate    = new Date(sale.saleDate);
      const payments    = sale.payments || 0;
      const periodicity = sale.periodicity;
      const total       = Number(sale.total) || 0;

      let totalPagosPendientes  = 0;
      let totalPagosRealizados  = 0;

      for (let i = 0; i < payments; i++) {
        const paymentDate = new Date(saleDate);

        if (periodicity === "Semanal")   paymentDate.setDate(saleDate.getDate() + i * 7);
        if (periodicity === "Quincenal") paymentDate.setDate(saleDate.getDate() + i * 15);
        if (periodicity === "Mensual")   paymentDate.setMonth(saleDate.getMonth() + i);

        const paymentAmount  = total / payments;
        const cuotaNum       = i + 1;

        // Usar fecha reprogramada si existe, si no la calculada
        const computedDate   = paymentDate.toISOString().split("T")[0];
        const effectiveDate  = (sale.rescheduled && sale.rescheduled[cuotaNum])
          ? sale.rescheduled[cuotaNum]
          : computedDate;
        const isRescheduled  = !!(sale.rescheduled && sale.rescheduled[cuotaNum]);

        if (effectiveDate < today) {
          totalPagosRealizados += paymentAmount;
        } else {
          totalPagosPendientes += paymentAmount;
        }

        if (effectiveDate === today) {
          pagosHoy++;
          totalPaymentsToday += paymentAmount;

          const paymentItem = document.createElement("li");
          paymentItem.dataset.saleId = sale.id;
          paymentItem.dataset.cuota  = cuotaNum;
          paymentItem.innerHTML = `
            <input type="checkbox" class="payment-checkbox">
            <span>${sale.clientName}</span>:
            $${Math.round(paymentAmount).toLocaleString("es-AR")} - ${sale.product}
            <em style="color:#aaa">(Cuota ${cuotaNum}/${payments}${isRescheduled ? " · 📅 Reprogramado" : ""})</em>
            <button class="whatsapp-button"
              data-phone="${sale.phone}"
              data-name="${sale.clientName}"
              data-amount="${Math.round(paymentAmount)}"
              title="Enviar mensaje por WhatsApp">📞</button>
            <button class="reschedule-btn"
              title="Reprogramar esta cuota">📅 Reprogramar</button>
            <span class="reschedule-form" style="display:none; margin-left:8px;">
              <input type="date" class="reschedule-date" min="${today}">
              <button class="reschedule-confirm">✔ Confirmar</button>
              <button class="reschedule-cancel">✖ Cancelar</button>
            </span>
          `;
          todayPaymentsList.appendChild(paymentItem);
        }
      }

      totalCobrado   += totalPagosRealizados;
      totalPendiente += totalPagosPendientes;
    });

    if (pagosHoy === 0) {
      todayPaymentsList.innerHTML = "<li>No hay pagos programados para hoy.</li>";
    } else {
      const totalItem = document.createElement("li");
      totalItem.style.cssText = "font-weight:bold; margin-top:8px; border-top:1px solid #444; padding-top:6px;";
      totalItem.innerHTML = `
        <strong>Total a cobrar hoy:</strong>
        $${Math.round(totalPaymentsToday).toLocaleString("es-AR")}
      `;
      todayPaymentsList.appendChild(totalItem);
    }

    totalCobradoEl.textContent   = `$${Math.round(totalCobrado).toLocaleString("es-AR")}`;
    totalPendienteEl.textContent = `$${Math.round(totalPendiente).toLocaleString("es-AR")}`;
    pagosHoyEl.textContent       = pagosHoy;
  };

  await loadDashboard();

  // ─── Event delegation sobre la lista ────────────────────────────────────────
  todayPaymentsList.addEventListener("click", async (e) => {

    // ── WhatsApp ──────────────────────────────────────────────────────────────
    if (e.target.classList.contains("whatsapp-button")) {
      const phone  = e.target.getAttribute("data-phone");
      const name   = e.target.getAttribute("data-name");
      const amount = e.target.getAttribute("data-amount");
      if (phone) {
        const message     = encodeURIComponent(`Hola ${name}, le recordamos que hoy tiene un pago pendiente de $${amount}.`);
        const whatsappURL = `https://wa.me/${phone}?text=${message}`;
        window.open(whatsappURL, "_blank");
      } else {
        alert("Número de teléfono no disponible.");
      }
    }

    // ── Mostrar formulario de reprogramación ──────────────────────────────────
    if (e.target.classList.contains("reschedule-btn")) {
      const li   = e.target.closest("li");
      const form = li.querySelector(".reschedule-form");
      form.style.display    = "inline";
      e.target.style.display = "none";
    }

    // ── Cancelar reprogramación ───────────────────────────────────────────────
    if (e.target.classList.contains("reschedule-cancel")) {
      const li   = e.target.closest("li");
      const form = li.querySelector(".reschedule-form");
      const btn  = li.querySelector(".reschedule-btn");
      form.style.display = "none";
      btn.style.display  = "inline";
    }

    // ── Confirmar reprogramación ──────────────────────────────────────────────
    if (e.target.classList.contains("reschedule-confirm")) {
      const li      = e.target.closest("li");
      const saleId  = li.dataset.saleId;
      const cuota   = li.dataset.cuota;
      const newDate = li.querySelector(".reschedule-date").value;

      if (!newDate) {
        alert("Por favor seleccioná una fecha.");
        return;
      }

      try {
        // Guarda solo esa cuota en el mapa "rescheduled" del documento
        await updateDoc(doc(db, "sales", saleId), {
          [`rescheduled.${cuota}`]: newDate,
        });

        // Formato DD/MM/YYYY para el mensaje
        const [y, m, d] = newDate.split("-");
        alert(`✅ Cuota reprogramada para el ${d}/${m}/${y}`);

        await loadDashboard(); // recargar la lista
      } catch (error) {
        console.error("Error al reprogramar el pago:", error);
        alert("Hubo un error al reprogramar el pago.");
      }
    }
  });

});

