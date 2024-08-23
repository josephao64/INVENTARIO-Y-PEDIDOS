let db;
let products = [];
let branches = [];
let orders = [];
let currentOrder = [];
let selectedProductName = null;
let selectedBranchName = null;

window.onload = function () {
    let request = indexedDB.open('InventoryDB', 1);

    request.onerror = function (event) {
        alert('Error al abrir la base de datos');
    };

    request.onsuccess = function (event) {
        db = event.target.result;
        alert('Base de datos abierta con éxito');
        loadInitialData();
    };

    request.onupgradeneeded = function (event) {
        db = event.target.result;

        if (!db.objectStoreNames.contains('products')) {
            db.createObjectStore('products', { keyPath: 'name' });
        }

        if (!db.objectStoreNames.contains('branches')) {
            db.createObjectStore('branches', { keyPath: 'name' });
        }

        if (!db.objectStoreNames.contains('orders')) {
            db.createObjectStore('orders', { autoIncrement: true });
        }
    };
};

function addProduct(product) {
    let transaction = db.transaction(['products'], 'readwrite');
    let store = transaction.objectStore('products');
    store.add(product);
}

function updateProduct(product) {
    let transaction = db.transaction(['products'], 'readwrite');
    let store = transaction.objectStore('products');
    store.put(product);
}

function deleteProduct(productName) {
    let transaction = db.transaction(['products'], 'readwrite');
    let store = transaction.objectStore('products');
    store.delete(productName);
}

function addBranch(branch) {
    let transaction = db.transaction(['branches'], 'readwrite');
    let store = transaction.objectStore('branches');
    store.add(branch);
}

function updateBranch(branch) {
    let transaction = db.transaction(['branches'], 'readwrite');
    let store = transaction.objectStore('branches');
    store.put(branch);
}

function deleteBranch(branchName) {
    let transaction = db.transaction(['branches'], 'readwrite');
    let store = transaction.objectStore('branches');
    store.delete(branchName);
}

function addOrder(order) {
    let transaction = db.transaction(['orders'], 'readwrite');
    let store = transaction.objectStore('orders');
    store.add(order);
}

function loadInitialData() {
    let transaction = db.transaction(['products'], 'readonly');
    let store = transaction.objectStore('products');
    let request = store.getAll();

    request.onsuccess = function (event) {
        products = event.target.result;
        updateProductSelect();
        updateFilterOptions();
        updateAdjustProductSelect();
        updateExistingProductSelect();
        displayProductTable();
    };

    let branchTransaction = db.transaction(['branches'], 'readonly');
    let branchStore = branchTransaction.objectStore('branches');
    let branchRequest = branchStore.getAll();

    branchRequest.onsuccess = function (event) {
        branches = event.target.result;
        updateBranchSelect();
        displayBranchTable();
        updateFilterOptions();
    };

    let orderTransaction = db.transaction(['orders'], 'readonly');
    let orderStore = orderTransaction.objectStore('orders');
    let orderRequest = orderStore.getAll();

    orderRequest.onsuccess = function (event) {
        orders = event.target.result;
    };
}

function addNewProduct() {
    let productName = document.getElementById('newProductName').value;
    let productQuantity = parseInt(document.getElementById('newProductQuantity').value);
    
    if (productName.trim() === "" || isNaN(productQuantity) || productQuantity <= 0) {
        alert("Por favor, ingrese un nombre de producto válido y una cantidad mayor que cero.");
        return;
    }

    let product = { name: productName, initialQuantity: productQuantity, currentQuantity: productQuantity };
    
    addProduct(product);
    products.push(product);
    updateProductSelect();
    updateFilterOptions();
    updateAdjustProductSelect();
    updateExistingProductSelect();
    displayProductTable();
    document.getElementById('newProductName').value = '';
    document.getElementById('newProductQuantity').value = '';
    closeModal('addProductModal');
}

function addToExistingProduct() {
    let productName = document.getElementById('existingProductSelect').value;
    let addQuantity = parseInt(document.getElementById('addQuantity').value);
    
    if (isNaN(addQuantity) || addQuantity <= 0) {
        alert("Por favor, ingrese una cantidad mayor que cero.");
        return;
    }

    let product = products.find(p => p.name === productName);
    if (product) {
        product.currentQuantity += addQuantity;
        updateProduct(product);
        alert('Cantidad agregada exitosamente.');
        displayProductTable();
    } else {
        alert('Producto no encontrado.');
    }
    document.getElementById('existingProductSelect').value = '';
    document.getElementById('addQuantity').value = '';
    closeModal('addExistingProductModal');
}

function adjustInventory() {
    let productName = document.getElementById('adjustProductSelect').value;
    let adjustQuantity = parseInt(document.getElementById('adjustQuantity').value);
    
    if (isNaN(adjustQuantity)) {
        alert("Por favor, ingrese un valor numérico válido para ajustar.");
        return;
    }

    let product = products.find(p => p.name === productName);
    if (product) {
        product.currentQuantity += adjustQuantity;
        updateProduct(product);
        alert('Inventario ajustado correctamente.');
        displayProductTable();
    } else {
        alert('Producto no encontrado.');
    }
    document.getElementById('adjustProductSelect').value = '';
    document.getElementById('adjustQuantity').value = '';
    closeModal('adjustInventoryModal');
}

function deleteSelectedProduct() {
    if (selectedProductName) {
        deleteProduct(selectedProductName);
        products = products.filter(p => p.name !== selectedProductName);
        displayProductTable();
        selectedProductName = null;
        alert('Producto eliminado correctamente.');
        closeModal('confirmDeleteProductModal');
    } else {
        alert('Por favor, seleccione un producto para eliminar.');
    }
}

function addNewBranch() {
    let branchName = document.getElementById('branchName').value;

    if (branchName.trim() === "") {
        alert("Por favor, ingrese un nombre de sucursal válido.");
        return;
    }

    let branch = { name: branchName };
    
    addBranch(branch);
    branches.push(branch);
    updateBranchSelect();
    displayBranchTable();
    updateFilterOptions();
    document.getElementById('branchName').value = '';
    closeModal('addBranchModal');
}

function deleteSelectedBranch() {
    if (selectedBranchName) {
        deleteBranch(selectedBranchName);
        branches = branches.filter(b => b.name !== selectedBranchName);
        displayBranchTable();
        updateBranchSelect();
        updateFilterOptions();
        selectedBranchName = null;
        alert('Sucursal eliminada correctamente.');
        closeModal('confirmDeleteBranchModal');
    } else {
        alert('Por favor, seleccione una sucursal para eliminar.');
    }
}

document.getElementById('branchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    addNewBranch();
});

document.getElementById('addOrderItem').addEventListener('click', function () {
    let branch = document.getElementById('branchSelect').value;
    let product = document.getElementById('productSelect').value;
    let quantity = parseInt(document.getElementById('orderQuantity').value);

    if (isNaN(quantity) || quantity <= 0) {
        alert("Por favor, ingrese una cantidad de pedido mayor que cero.");
        return;
    }

    let selectedProduct = products.find(p => p.name === product);
    if (selectedProduct && selectedProduct.currentQuantity >= quantity) {
        selectedProduct.currentQuantity -= quantity; // Restar la cantidad del pedido
        updateProduct(selectedProduct); // Actualizar en la base de datos
        currentOrder.push({ branch, product, quantity });
        displayProductTable(); // Actualizar la tabla de productos
        displayOrderItems();
        document.getElementById('orderForm').reset();
    } else {
        alert('No hay suficiente inventario para agregar este producto.');
    }

    // Limpiar las casillas de selección después de agregar un pedido
    document.getElementById('branchSelect').value = '';
    document.getElementById('productSelect').value = '';
    document.getElementById('orderQuantity').value = '';
});

document.getElementById('completeOrder').addEventListener('click', function () {
    let orderDate = document.getElementById('orderDate').value;
    if (currentOrder.length > 0 && orderDate) {
        currentOrder.forEach(order => {
            order.date = orderDate;
            orders.push(order);
            addOrder(order);
        });
        currentOrder = [];
        document.getElementById('orderItems').innerHTML = '';
        alert('Pedido completado y agregado al reporte.');
        document.getElementById('orderForm').reset();
    } else {
        alert('Debe agregar productos al pedido y seleccionar una fecha.');
    }
});

document.getElementById('generateReport').addEventListener('click', function () {
    generateProductReport();
});

function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => view.style.display = 'none');
    document.getElementById(viewId).style.display = 'block';
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function updateProductSelect() {
    let productSelect = document.getElementById('productSelect');
    productSelect.innerHTML = '';
    products.forEach(product => {
        let option = document.createElement('option');
        option.value = product.name;
        option.textContent = product.name;
        productSelect.appendChild(option);
    });
}

function updateExistingProductSelect() {
    let existingProductSelect = document.getElementById('existingProductSelect');
    existingProductSelect.innerHTML = '';
    products.forEach(product => {
        let option = document.createElement('option');
        option.value = product.name;
        option.textContent = product.name;
        existingProductSelect.appendChild(option);
    });
}

function updateAdjustProductSelect() {
    let adjustProductSelect = document.getElementById('adjustProductSelect');
    adjustProductSelect.innerHTML = '';
    products.forEach(product => {
        let option = document.createElement('option');
        option.value = product.name;
        option.textContent = product.name;
        adjustProductSelect.appendChild(option);
    });
}

function updateBranchSelect() {
    let branchSelect = document.getElementById('branchSelect');
    branchSelect.innerHTML = '';
    branches.forEach(branch => {
        let option = document.createElement('option');
        option.value = branch.name;
        option.textContent = branch.name;
        branchSelect.appendChild(option);
    });
}

function updateFilterOptions() {
    let filterProduct = document.getElementById('filterProduct');
    let filterBranch = document.getElementById('filterBranch');
    filterProduct.innerHTML = '<option value="">Todos los productos</option>';
    filterBranch.innerHTML = '<option value="">Todas las sucursales</option>';

    products.forEach(product => {
        let option = document.createElement('option');
        option.value = product.name;
        option.textContent = product.name;
        filterProduct.appendChild(option);
    });

    branches.forEach(branch => {
        let option = document.createElement('option');
        option.value = branch.name;
        option.textContent = branch.name;
        filterBranch.appendChild(option);
    });
}

function displayOrderItems() {
    let orderItemsDiv = document.getElementById('orderItems');
    orderItemsDiv.innerHTML = '';
    currentOrder.forEach(order => {
        let orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `<p><strong>Sucursal:</strong> ${order.branch}</p>
                               <p><strong>Producto:</strong> ${order.product}</p>
                               <p><strong>Cantidad:</strong> ${order.quantity}</p>`;
        orderItemsDiv.appendChild(orderItem);
    });
}

function displayProductTable() {
    let productTableBody = document.getElementById('productTableBody');
    productTableBody.innerHTML = '';
    products.forEach(product => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${product.name}</td><td>${product.initialQuantity}</td><td>${product.currentQuantity}</td>`;
        row.onclick = function() { toggleProductSelection(row, product.name); };
        productTableBody.appendChild(row);
    });
}

function displayBranchTable() {
    let branchTableBody = document.getElementById('branchTableBody');
    branchTableBody.innerHTML = '';
    branches.forEach(branch => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${branch.name}</td>`;
        row.onclick = function() { toggleBranchSelection(row, branch.name); };
        branchTableBody.appendChild(row);
    });
}

function toggleProductSelection(row, productName) {
    if (selectedProductName === productName) {
        row.classList.remove('selected-row');
        selectedProductName = null;
    } else {
        document.querySelectorAll('#productTableBody tr').forEach(tr => tr.classList.remove('selected-row'));
        row.classList.add('selected-row');
        selectedProductName = productName;
    }
}

function toggleBranchSelection(row, branchName) {
    if (selectedBranchName === branchName) {
        row.classList.remove('selected-row');
        selectedBranchName = null;
    } else {
        document.querySelectorAll('#branchTableBody tr').forEach(tr => tr.classList.remove('selected-row'));
        row.classList.add('selected-row');
        selectedBranchName = branchName;
    }
}

function generateProductReport() {
    let report = document.getElementById('report');
    report.innerHTML = '';

    let filterProduct = document.getElementById('filterProduct').value;
    let filterBranch = document.getElementById('filterBranch').value;
    let filterStartDate = document.getElementById('filterStartDate').value;
    let filterEndDate = document.getElementById('filterEndDate').value;

    let filteredOrders = orders.filter(order => {
        return (filterProduct === '' || order.product === filterProduct) &&
               (filterBranch === '' || order.branch === filterBranch) &&
               (filterStartDate === '' || new Date(order.date) >= new Date(filterStartDate)) &&
               (filterEndDate === '' || new Date(order.date) <= new Date(filterEndDate));
    });

    products.forEach(product => {
        let relevantOrders = filteredOrders.filter(order => order.product === product.name);
        let currentStock = product.initialQuantity;

        if (relevantOrders.length > 0 || filterProduct === '' || filterProduct === product.name) {
            let table = document.createElement('table');
            let headerRow = document.createElement('tr');
            headerRow.innerHTML = `<th>Inventario Inicial</th><th>Sucursal</th><th>Cantidad Pedida</th><th>Fecha del Pedido</th><th>Stock Actual</th>`;
            table.appendChild(headerRow);

            let productTitleRow = document.createElement('tr');
            let productTitleCell = document.createElement('td');
            productTitleCell.colSpan = 5;
            productTitleCell.style.textAlign = 'center';
            productTitleCell.innerHTML = `<strong>${product.name}</strong>`;
            productTitleRow.appendChild(productTitleCell);
            table.appendChild(productTitleRow);

            let initialStockRow = document.createElement('tr');
            initialStockRow.innerHTML = `<td>${product.initialQuantity}</td><td>-</td><td>-</td><td>-</td><td>${currentStock}</td>`;
            table.appendChild(initialStockRow);

            relevantOrders.forEach(order => {
                currentStock -= order.quantity;  // Restar cantidad pedida del stock actual
                let orderRow = document.createElement('tr');
                orderRow.innerHTML = `<td>-</td><td>${order.branch}</td><td>${order.quantity}</td><td>${order.date}</td><td>${currentStock}</td>`;
                table.appendChild(orderRow);
            });

            report.appendChild(table);
        }
    });
}
