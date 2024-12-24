document.addEventListener("DOMContentLoaded", () => {
  const stockTableBody = document.getElementById("inventoryTableBody");
  const addProductButton = document.getElementById("addProduct");
  const productNameInput = document.getElementById("productName");
  const productQuantityInput = document.getElementById("productQuantity");

  // Obtener el stock del localStorage
  let stock = JSON.parse(localStorage.getItem("stock")) || [];

  // Función para renderizar el inventario
  const renderStock = () => {
    stockTableBody.innerHTML = "";
    stock.forEach((product, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${product.name}</td>
        <td>${product.quantity}</td>
        <td class="actions">
          <button class="edit-product" data-index="${index}" title="Editar">
            <span class="edit">✏️</span>
          </button>
          <button class="delete-product" data-index="${index}" title="Eliminar">
            <span class="delete">❌</span>
          </button>
        </td>
      `;
      stockTableBody.appendChild(row);
    });
  };

  // Agregar un nuevo producto
  addProductButton.addEventListener("click", () => {
    const productName = productNameInput.value.trim();
    const productQuantity = parseInt(productQuantityInput.value, 10);

    // Validación básica
    if (!productName || isNaN(productQuantity) || productQuantity <= 0) {
      alert("Por favor, ingrese un nombre y una cantidad válida.");
      return;
    }

    // Verificar si el producto ya existe
    const existingProduct = stock.find((p) => p.name.toLowerCase() === productName.toLowerCase());
    if (existingProduct) {
      existingProduct.quantity += productQuantity;
    } else {
      stock.push({ name: productName, quantity: productQuantity });
    }

    localStorage.setItem("stock", JSON.stringify(stock));
    renderStock();
    productNameInput.value = "";
    productQuantityInput.value = "";
  });

  // Manejar clics en editar o eliminar
  stockTableBody.addEventListener("click", (e) => {
    if (e.target.closest(".delete-product")) {
      const index = e.target.closest(".delete-product").getAttribute("data-index");
      if (confirm(`¿Seguro que deseas eliminar "${stock[index].name}" del inventario?`)) {
        stock.splice(index, 1);
        localStorage.setItem("stock", JSON.stringify(stock));
        renderStock();
      }
    }

    if (e.target.closest(".edit-product")) {
      const index = e.target.closest(".edit-product").getAttribute("data-index");
      const product = stock[index];

      const newQuantity = prompt(`Editar cantidad de "${product.name}":`, product.quantity);
      if (newQuantity !== null && !isNaN(newQuantity) && parseInt(newQuantity, 10) >= 0) {
        stock[index].quantity = parseInt(newQuantity, 10);
        localStorage.setItem("stock", JSON.stringify(stock));
        renderStock();
      } else if (newQuantity !== null) {
        alert("Por favor, ingrese una cantidad válida.");
      }
    }
  });

  renderStock();
});