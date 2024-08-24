let db;
let products = [];
let branches = [];
let orders = [];
let currentOrder = [];
let orderList = [];
let selectedProductName = null;
let selectedBranchName = null;
let selectedOrderName = null;

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
        orderList = orders;
        displayOrderListTable();
    };
}

function addNewProduct() {
    let productName = document.getElementById('newProductName').value;
    let productQuantity = parseInt(document.getElementById('newProductQuantity').value);
    let productPresentation = document.getElementById('productPresentation').value;
    
    if (productName.trim() === "" || isNaN(productQuantity) || productQuantity <= 0) {
        alert("Por favor, ingrese un nombre de producto válido, una cantidad mayor que cero, y seleccione una presentación.");
        return;
    }

    let product = { name: productName, initialQuantity: productQuantity, currentQuantity: productQuantity, presentation: productPresentation };
    
    addProduct(product);
    products.push(product);
    updateProductSelect();
    updateFilterOptions();
    updateAdjustProductSelect();
    updateExistingProductSelect();
    displayProductTable();
    document.getElementById('newProductName').value = '';
    document.getElementById('newProductQuantity').value = '';
    document.getElementById('productPresentation').value = 'Unidad';
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
        selectedProduct.currentQuantity -= quantity;
        updateProduct(selectedProduct);
        currentOrder.push({ branch, product, presentation: selectedProduct.presentation, quantity });
        displayProductTable();
        displayOrderItems();
        document.getElementById('orderForm').reset();
    } else {
        alert('No hay suficiente inventario para agregar este producto.');
    }

    document.getElementById('branchSelect').value = '';
    document.getElementById('productSelect').value = '';
    document.getElementById('orderQuantity').value = '';
});

function confirmOrderCompletion() {
    if (currentOrder.length > 0) {
        openModal('confirmDownloadModal');
    } else {
        alert('Debe agregar productos al pedido antes de completarlo.');
    }
}

function downloadOrderImage() {
    let orderName = document.getElementById('orderName').value;
    let orderDate = document.getElementById('orderDate').value;
    
    if (orderName && orderDate) {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 300;
        ctx.fillStyle = "#FFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#000";
        ctx.font = "16px Arial";
        ctx.fillText(`Nombre del Pedido: ${orderName}`, 10, 30);
        ctx.fillText(`Fecha del Pedido: ${orderDate}`, 10, 60);
        ctx.fillText("Detalles del Pedido:", 10, 90);

        currentOrder.forEach((item, index) => {
            ctx.fillText(`${index + 1}. ${item.product} (${item.presentation}), Cantidad: ${item.quantity}, Sucursal: ${item.branch}`, 10, 120 + index * 30);
        });

        let link = document.createElement('a');
        link.download = `${orderName}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        completeOrder();
    } else {
        alert('Debe ingresar un nombre de pedido y una fecha antes de completarlo.');
    }
}

function completeOrder() {
    let orderDate = document.getElementById('orderDate').value;
    let orderName = document.getElementById('orderName').value;

    if (currentOrder.length > 0 && orderDate && orderName) {
        let orderDetails = { name: orderName, date: orderDate, items: currentOrder.slice() };
        orderList.push(orderDetails);
        currentOrder.forEach(order => {
            order.date = orderDate;
            orders.push(order);
            addOrder(order); 
        });
        currentOrder = [];
        document.getElementById('orderItems').innerHTML = '';
        displayOrderListTable();
        closeModal('confirmDownloadModal');
        alert('Pedido completado y agregado al reporte.');
        document.getElementById('orderForm').reset();
        document.getElementById('orderName').value = '';
    } else {
        alert('Debe ingresar un nombre de pedido, agregar productos al pedido y seleccionar una fecha.');
    }
}

function displayOrderListTable() {
    let orderListTableBody = document.getElementById('orderListTableBody');
    orderListTableBody.innerHTML = '';
    orderList.forEach(order => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${order.name}</td><td>${order.date}</td>`;
        row.onclick = function() { toggleOrderSelection(row, order.name); };
        orderListTableBody.appendChild(row);
    });
}

function toggleOrderSelection(row, orderName) {
    if (selectedOrderName === orderName) {
        row.classList.remove('selected-row');
        selectedOrderName = null;
        disableOrderActionButtons();
    } else {
        document.querySelectorAll('#orderListTableBody tr').forEach(tr => tr.classList.remove('selected-row'));
        row.classList.add('selected-row');
        selectedOrderName = orderName;
        enableOrderActionButtons();
    }
}

function enableOrderActionButtons() {
    document.getElementById('viewOrderBtn').disabled = false;
    document.getElementById('deleteOrderBtn').disabled = false;
    document.getElementById('downloadOrderBtn').disabled = false;
}

function disableOrderActionButtons() {
    document.getElementById('viewOrderBtn').disabled = true;
    document.getElementById('deleteOrderBtn').disabled = true;
    document.getElementById('downloadOrderBtn').disabled = true;
}

function viewSelectedOrder() {
    if (selectedOrderName) {
        viewOrderDetails(selectedOrderName);
    }
}

function openDeleteOrderModal() {
    if (selectedOrderName) {
        openModal('confirmDeleteOrderModal');
    }
}

function deleteSelectedOrder() {
    if (selectedOrderName) {
        orderList = orderList.filter(o => o.name !== selectedOrderName);
        orders = orders.filter(o => o.name !== selectedOrderName);
        displayOrderListTable();
        selectedOrderName = null;
        alert('Pedido eliminado correctamente.');
        closeModal('confirmDeleteOrderModal');
        disableOrderActionButtons();
    } else {
        alert('Por favor, seleccione un pedido para eliminar.');
    }
}

function viewOrderDetails(orderName) {
    let order = orderList.find(o => o.name === orderName);
    if (order) {
        let orderDetailsContent = document.getElementById('orderDetailsContent');
        orderDetailsContent.innerHTML = `<h4>Detalle del Pedido: ${order.name}</h4><p>Fecha: ${order.date}</p>`;
        order.items.forEach(item => {
            let itemDiv = document.createElement('div');
            itemDiv.innerHTML = `<p><strong>Sucursal:</strong> ${item.branch}, <strong>Producto:</strong> ${item.product} (${item.presentation}), <strong>Cantidad:</strong> ${item.quantity}</p>`;
            orderDetailsContent.appendChild(itemDiv);
        });
        openModal('viewOrderModal');
    }
}

document.getElementById('generateReport').addEventListener('click', function () {
    generateProductReport();
});

function exportReport(format) {
    let reportContent = document.getElementById('report').innerHTML;
    if (format === 'png') {
        exportReportAsImage();
    } else if (format === 'pdf') {
        exportReportAsPDF();
    } else if (format === 'excel') {
        exportReportAsExcel();
    }
}

function exportReportAsImage() {
    html2canvas(document.getElementById('report')).then(canvas => {
        let link = document.createElement('a');
        link.download = 'reporte.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

function exportReportAsPDF() {
    let doc = new jsPDF();
    doc.fromHTML(document.getElementById('report').innerHTML, 10, 10);
    doc.save('reporte.pdf');
}

function exportReportAsExcel() {
    let tableHTML = document.getElementById('report').innerHTML;
    let uri = 'data:application/vnd.ms-excel,' + encodeURIComponent(tableHTML);
    let link = document.createElement('a');
    link.href = uri;
    link.style = 'visibility:hidden';
    link.download = 'reporte.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

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
        option.textContent = `${product.name} (${product.presentation})`;
        productSelect.appendChild(option);
    });
}

function updateExistingProductSelect() {
    let existingProductSelect = document.getElementById('existingProductSelect');
    existingProductSelect.innerHTML = '';
    products.forEach(product => {
        let option = document.createElement('option');
        option.value = product.name;
        option.textContent = `${product.name} (${product.presentation})`;
        existingProductSelect.appendChild(option);
    });
}

function updateAdjustProductSelect() {
    let adjustProductSelect = document.getElementById('adjustProductSelect');
    adjustProductSelect.innerHTML = '';
    products.forEach(product => {
        let option = document.createElement('option');
        option.value = product.name;
        option.textContent = `${product.name} (${product.presentation})`;
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
        option.textContent = `${product.name} (${product.presentation})`;
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
        orderItem.innerHTML = `<p><strong>Sucursal:</strong> ${order.branch}, <strong>Producto:</strong> ${order.product} (${order.presentation}), <strong>Cantidad:</strong> ${order.quantity}</p>`;
        orderItemsDiv.appendChild(orderItem);
    });
}

function displayProductTable() {
    let productTableBody = document.getElementById('productTableBody');
    productTableBody.innerHTML = '';
    products.forEach(product => {
        let row = document.createElement('tr');
        row.innerHTML = `<td>${product.name}</td><td>${product.presentation}</td><td>${product.initialQuantity}</td><td>${product.currentQuantity}</td>`;
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
            productTitleCell.innerHTML = `<strong>${product.name} (${product.presentation})</strong>`;
            productTitleRow.appendChild(productTitleCell);
            table.appendChild(productTitleRow);

            let initialStockRow = document.createElement('tr');
            initialStockRow.innerHTML = `<td>${product.initialQuantity}</td><td>-</td><td>-</td><td>-</td><td>${currentStock}</td>`;
            table.appendChild(initialStockRow);

            relevantOrders.forEach(order => {
                currentStock -= order.quantity;
                let orderRow = document.createElement('tr');
                orderRow.innerHTML = `<td>-</td><td>${order.branch}</td><td>${order.quantity}</td><td>${order.date}</td><td>${currentStock}</td>`;
                table.appendChild(orderRow);
            });

            report.appendChild(table);
        }
    });
}
