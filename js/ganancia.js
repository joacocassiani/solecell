document.addEventListener("DOMContentLoaded", () => {
    const profitTableBody = document.getElementById("profitTableBody");
    const searchInput = document.getElementById("searchInput"); // Input para buscar
  
    // Obtener las ventas desde el localStorage
    const sales = JSON.parse(localStorage.getItem("sales")) || [];
  
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
        const gananciaMarcelo = ((totalVenta - cost) * 0.5 ) + cost;
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
  
    renderProfitTable(); // Renderizar la tabla al cargar la página
  });