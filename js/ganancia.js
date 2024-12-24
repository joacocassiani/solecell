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

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", async () => {
  const profitTableBody = document.getElementById("profitTableBody");
  const searchInput = document.getElementById("searchInput"); // Input para buscar
  let sales = []; // Variable para almacenar las ventas obtenidas de Firebase

  // Función para obtener ventas desde Firestore
  const fetchSalesFromFirestore = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "sales"));
      sales = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      renderProfitTable(); // Renderizar la tabla después de obtener los datos
    } catch (error) {
      console.error("Error al obtener ventas desde Firestore:", error);
    }
  };

  // Renderizar la tabla de ganancias
  const renderProfitTable = (filter = "") => {
    profitTableBody.innerHTML = ""; // Limpiar la tabla

    // Filtrar ventas basadas en el término de búsqueda
    const filteredSales = sales.filter((sale) => {
      return (
        sale.product.toLowerCase().includes(filter.toLowerCase()) ||
        sale.saleDate.includes(filter)
      );
    });

    filteredSales.forEach((sale) => {
      const totalVenta = sale.total || 0;
      const cost = sale.productCost || 0;

      // Calcular ganancias
      const gananciaMarcelo = ((totalVenta - cost) * 0.5) + cost;
      const gananciaColo = totalVenta - gananciaMarcelo;

      // Crear fila
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${sale.saleDate}</td>
        <td>${sale.product}</td>
        <td>$${Math.round(sale.productCost).toLocaleString("es-AR")}</td>
        <td>$${Math.round(totalVenta).toLocaleString("es-AR")}</td>
        <td>$${Math.round(gananciaMarcelo).toLocaleString("es-AR")}</td>
        <td>$${Math.round(gananciaColo).toLocaleString("es-AR")}</td>
      `;
      profitTableBody.appendChild(row);
    });
  };

  // Escuchar eventos en el campo de búsqueda
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value;
    renderProfitTable(searchTerm); // Filtrar las ganancias basadas en el término
  });

  await fetchSalesFromFirestore(); // Obtener las ventas desde Firebase
});