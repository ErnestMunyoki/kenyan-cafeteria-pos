const BASE_URL = "https://kenyan-cafeteria-pos.onrender.com";

let cart = {};
let menuItems = {};
let salesHistory = [];


document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadMenu();
    setupEventListeners();
    updateDashboard();
    updateTime();
    setInterval(updateTime, 1000);
}


function setupEventListeners() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger?.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    const searchInput = document.getElementById('search-menu');
    searchInput?.addEventListener('input', (e) => {
        filterMenuItems(e.target.value);
    });

    const categoryFilter = document.getElementById('category-filter');
    categoryFilter?.addEventListener('change', (e) => {
        filterByCategory(e.target.value);
    });

    const clearCartBtn = document.getElementById('clear-cart');
    clearCartBtn?.addEventListener('click', clearCart);

    document.getElementById('dailyTotalsBtn')?.addEventListener('click', getDailyTotals);
    document.getElementById('exportBtn')?.addEventListener('click', exportReport);
    document.getElementById('stockReportBtn')?.addEventListener('click', getStockReport);
    document.getElementById('salesHistoryBtn')?.addEventListener('click', showSalesHistory);

    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filterKioskMenu(e.target.textContent);
        });
    });
}


function showToast(message, type = 'success') {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    
    document.getElementById("toast-container").appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}


function updateDashboard() {
    updateDailyRevenue();
    updateLowStockCount();
    updateCartCount();
}

function updateDailyRevenue() {
    getDailyTotals().then(total => {
        const revenueEl = document.getElementById('daily-revenue');
        if (revenueEl) revenueEl.textContent = `Ksh ${total}`;
    }).catch(err => console.error('Error updating revenue:', err));
}

function updateLowStockCount() {
    let lowStockCount = 0;
    for (let name in menuItems) {
        if (menuItems[name].stock <= menuItems[name].threshold) {
            lowStockCount++;
        }
    }
    const lowStockEl = document.getElementById('low-stock-count');
    if (lowStockEl) lowStockEl.textContent = lowStockCount;
}

function updateCartCount() {
    let itemCount = 0;
    for (let name in cart) {
        itemCount += cart[name].qty;
    }
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.textContent = itemCount;
}

function updateTime() {
    const timeEl = document.getElementById('current-time');
    if (timeEl) {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString('en-KE', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }
}


async function loadMenu() {
    try {
        let res = await fetch(`${BASE_URL}/items`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        let response = await res.json();
        let items = response.items; 
        menuItems = items;

        renderMenu('menu', items);
        renderMenu('kiosk-menu', items);
        updateDashboard();
        
    } catch (err) {
        console.error('Error loading menu:', err);
        showToast("Error loading menu: " + err.message, 'error');
    }
}

function renderMenu(menuId, items) {
    let menuDiv = document.getElementById(menuId);
    if (!menuDiv) return;
    
    menuDiv.innerHTML = "";

    for (let name in items) {
        let item = items[name];
        let div = createMenuItemElement(name, item, menuId === 'kiosk-menu');
        menuDiv.appendChild(div);
    }
}

function createMenuItemElement(name, item, isKiosk = false) {
    let div = document.createElement("div");
    div.className = "item";
    
    div.dataset.category = item.category;
    
    if (item.stock <= item.threshold) {
        div.classList.add('low-stock');
    }

    let img = document.createElement("img");
    const filename = name.toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[()]/g, "")
        .replace(/_/g, "_");
    
    const nameMap = {
        'beans_stew': 'beans_stew',
        'chicken_stew': 'chicken_stew',
        'chicken_curry': 'chicken_curry',
        'coffee': 'coffee',
        'dawa': 'dawa',
        'fresh_passion_juice': 'fresh_passion_juice',
        'fruit_salad': 'fruit_salad',
        'githeri': 'githeri',
        'juice': 'juice',
        'kachumbari': 'kachumbari',
        'mahamri': 'mahamri',
        'mandazi': 'mandazi',
        'maziwa_lala': 'maziwa_lala',
        'mukimo': 'mukimo',
        'nyama_choma': 'nyama_choma',
        'pilau_rice': 'pilau_rice',
        'rice_plate': 'rice_plate',
        'samosa': 'samosa',
        'sukuma_wiki': 'sukuma_wiki',
        'tangawizi_tea': 'tangawizi_tea',
        'tilapia_fish': 'tilapia_fish',
        'ugali': 'ugali',
        'uji_porridge': 'uji_porridge',
        'viazi_karai': 'viazi_karai',
        'water_bottle': 'water_bottle',
        'chapati': 'chapati'
    };
    
    const mappedName = nameMap[filename] || filename;
    
    img.src = `images/${mappedName}.jpg`;
    img.onerror = function() {
        this.src = `images/${mappedName}.svg`;
        this.onerror = function() {
            this.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjhGOEY4Ii8+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjI4MCIgaGVpZ2h0PSIxODAiIHJ4PSIxMCIgZmlsbD0iI0UwRTBFMEIvPgo8dGV4dCB4PSIxNTAiIHk9IjEwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzMzMzMzMyI+J3tuYW1lfTwvdGV4dD4KPHRleHQgeD0iMTUwIiB5PSIxMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NjY2NiI+S2VueWFuIEN1aXNpbmU8L3RleHQ+Cjwvc3ZnPgo=';
        };
    };

    let content = document.createElement("div");
    content.className = "item-content";
    
    let info = document.createElement("div");
    info.className = "item-info";
    info.innerHTML = `
        <strong>${name}</strong>
        <div class="item-price">Ksh ${item.price}</div>
        <div class="item-stock ${item.stock <= item.threshold ? 'low-stock' : ''}" id="stock-${name}">
            Stock: ${item.stock}
        </div>
    `;

    let btn = document.createElement("button");
    btn.innerText = isKiosk ? "Order" : "Add to Cart";
    btn.onclick = () => addToCart(name, item.price);

    content.appendChild(img);
    content.appendChild(info);
    div.appendChild(content);
    div.appendChild(btn);

    return div;
}


function filterMenuItems(searchTerm) {
    const items = document.querySelectorAll('#menu .item');
    const term = searchTerm.toLowerCase();
    
    items.forEach(item => {
        const name = item.querySelector('strong').textContent.toLowerCase();
        if (name.includes(term)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterByCategory(category) {
    const items = document.querySelectorAll('#menu .item');
    console.log('Filtering by category:', category);
    console.log('Found items:', items.length);
    
    items.forEach(item => {
        const itemCategory = item.dataset.category;
        console.log(`Item "${item.querySelector('strong').textContent}" category: ${itemCategory}`);
        
        if (!category || itemCategory === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterKioskMenu(category) {
    const items = document.querySelectorAll('#kiosk-menu .item');
    
    items.forEach(item => {
        const name = item.querySelector('strong').textContent.toLowerCase();
        let shouldShow = true;
        
        if (category.includes('Main') && !name.includes('ugali') && !name.includes('nyama') && !name.includes('chicken') && !name.includes('beans') && !name.includes('githeri') && !name.includes('mukimo') && !name.includes('pilau') && !name.includes('tilapia')) {
            shouldShow = false;
        }
        if (category.includes('Snacks') && !name.includes('mandazi') && !name.includes('samosa') && !name.includes('mahamri') && !name.includes('viazi')) {
            shouldShow = false;
        }
        if (category.includes('Beverages') && !name.includes('uji') && !name.includes('tea') && !name.includes('dawa') && !name.includes('juice') && !name.includes('maziwa')) {
            shouldShow = false;
        }
        
        item.style.display = shouldShow ? 'block' : 'none';
    });
}


function addToCart(name, price) {
    if (menuItems[name] && menuItems[name].stock <= 0) {
        showToast(`${name} is out of stock!`, 'error');
        return;
    }
    
    cart[name] = cart[name]
        ? { qty: cart[name].qty + 1, price }
        : { qty: 1, price };
    
    renderCart();
    updateCartCount();
    showToast(`${name} added to cart!`, 'success');
}

function removeFromCart(name) {
    delete cart[name];
    renderCart();
    updateCartCount();
    showToast(`${name} removed from cart!`, 'success');
}

function updateQuantity(name, change) {
    if (!cart[name]) return;
    
    const newQty = cart[name].qty + change;
    if (newQty <= 0) {
        removeFromCart(name);
    } else if (menuItems[name] && menuItems[name].stock >= newQty) {
        cart[name].qty = newQty;
        renderCart();
        updateCartCount();
    } else {
        showToast(`Not enough stock for ${name}!`, 'error');
    }
}

function clearCart() {
    if (Object.keys(cart).length === 0) {
        showToast('Cart is already empty!', 'warning');
        return;
    }
    
    if (confirm('Are you sure you want to clear the cart?')) {
        cart = {};
        renderCart();
        updateCartCount();
        showToast('Cart cleared!', 'success');
    }
}

function renderCart() {
    let cartList = document.getElementById("cart-list");
    if (!cartList) return;
    
    cartList.innerHTML = "";

    if (Object.keys(cart).length === 0) {
        cartList.innerHTML = '<div class="text-center" style="padding: 2rem; color: var(--text-secondary);">Your cart is empty</div>';
        updateCartTotals();
        return;
    }

    for (let name in cart) {
        let item = cart[name];
        let cartItem = document.createElement("div");
        cartItem.className = "cart-item";
        
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${name}</div>
                <div class="cart-item-price">Ksh ${item.price} each</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateQuantity('${name}', -1)">-</button>
                <span>${item.qty}</span>
                <button class="quantity-btn" onclick="updateQuantity('${name}', 1)">+</button>
            </div>
            <div style="margin-left: 1rem; font-weight: 600;">Ksh ${item.qty * item.price}</div>
        `;
        
        cartList.appendChild(cartItem);
    }

    updateCartTotals();
}

function updateCartTotals() {
    let subtotal = 0;
    for (let name in cart) {
        subtotal += cart[name].qty * cart[name].price;
    }
    
    const tax = subtotal * 0.16; 
    const total = subtotal + tax;
    
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('cart-total');
    
    if (subtotalEl) subtotalEl.textContent = `Ksh ${subtotal.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `Ksh ${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `Ksh ${total.toFixed(2)}`;
}


async function checkout() {
    try {
        if (!cart || Object.keys(cart).length === 0) {
            showToast('Your cart is empty! Add some items first.', 'error');
            return;
        }

        const checkoutBtn = document.querySelector('button[onclick="checkout()"]');
        const originalText = checkoutBtn.innerHTML;
        checkoutBtn.innerHTML = '⏳ Processing...';
        checkoutBtn.disabled = true;

        let receipt = "";
        let totalAmount = 0;
        let tableNumber = document.getElementById("table-number")?.value || "N/A";
        
        console.log('Starting checkout for items:', Object.keys(cart));

        for (const [itemName, itemData] of Object.entries(cart)) {
            console.log(`Processing: ${itemName}, Qty: ${itemData.qty}, Price: ${itemData.price}`);
            
            try {
                const response = await fetch(`${BASE_URL}/sale`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: JSON.stringify({
                        item: itemName,
                        qty: itemData.qty,
                        price: itemData.price
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const saleData = await response.json();
                console.log(`Sale data for ${itemName}:`, saleData);

                const itemTotal = itemData.qty * itemData.price;
                totalAmount += itemTotal;
                
                receipt += `${itemName} x${itemData.qty} = Ksh ${itemTotal.toFixed(2)}<br>`;

                if (saleData.remaining !== undefined && menuItems[itemName]) {
                    const stockEl = document.getElementById(`stock-${itemName}`);
                    if (stockEl) {
                        stockEl.textContent = `Stock: ${saleData.remaining}`;
                        if (saleData.remaining <= menuItems[itemName].threshold) {
                            stockEl.classList.add('low-stock');
                        } else {
                            stockEl.classList.remove('low-stock');
                        }
                    }
                    menuItems[itemName].stock = saleData.remaining;
                }

            } catch (itemError) {
                console.error(`Error processing ${itemName}:`, itemError);
                showToast(`Error processing ${itemName}: ${itemError.message}`, 'error');
                throw itemError;
            }
        }

        const tax = totalAmount * 0.16;
        const finalTotal = totalAmount + tax;

        receipt += `<hr style="margin: 10px 0;">`;
        receipt += `<div style="text-align: right;">`;
        receipt += `<strong>Subtotal: Ksh ${totalAmount.toFixed(2)}</strong><br>`;
        receipt += `<strong>Tax (16%): Ksh ${tax.toFixed(2)}</strong><br>`;
        receipt += `<strong style="color: #2ecc71;">Total: Ksh ${finalTotal.toFixed(2)}</strong><br>`;
        receipt += `</div>`;
        receipt += `<hr style="margin: 10px 0;">`;
        receipt += `<small>Table: ${tableNumber}</small><br>`;
        receipt += `<small>${new Date().toLocaleString()}</small>`;

        salesHistory.push({
            date: new Date().toISOString(),
            items: {...cart},
            total: finalTotal,
            table: tableNumber,
            subtotal: totalAmount,
            tax: tax
        });

        const receiptBody = document.getElementById("receipt-body");
        if (receiptBody) {
            receiptBody.innerHTML = receipt;
            document.getElementById("receipt-modal").classList.remove("hidden");
        }

        cart = {};
        renderCart();
        updateCartCount();
        updateDashboard();

        showToast('Order completed successfully! 🎉', 'success');

        checkoutBtn.innerHTML = originalText;
        checkoutBtn.disabled = false;

        console.log('Checkout completed successfully (Real Backend Mode)');

    } catch (error) {
        console.error('Checkout failed:', error);
        showToast(`Checkout failed: ${error.message}`, 'error');
        
        const checkoutBtn = document.querySelector('button[onclick="checkout()"]');
        if (checkoutBtn) {
            checkoutBtn.innerHTML = '💳 Checkout';
            checkoutBtn.disabled = false;
        }
    }
}

function closeModal() {
    document.getElementById("receipt-modal").classList.add("hidden");
}

function printReceipt() {
    const receiptContent = document.getElementById("receipt-body").innerHTML;
    if (!receiptContent) {
        showToast('No receipt to print!', 'warning');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h2 { text-align: center; }
                    .receipt-details { margin: 20px 0; }
                </style>
            </head>
            <body>
                <h2>Cafeteria POS Receipt</h2>
                <div class="receipt-details">${receiptContent}</div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
    showToast('Receipt sent to printer!', 'success');
}

async function getDailyTotals() {
    try {
        let res = await fetch(`${BASE_URL}/dailyTotals`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        let data = await res.json();
        return parseFloat(data.dailyTotal || 0);
    } catch (err) {
        console.error('Error fetching totals:', err);
        showToast("Error fetching totals: " + err.message, 'error');
        return 0;
    }
}

async function exportReport() {
    try {
        let res = await fetch(`${BASE_URL}/exportReport`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        let text = await res.text();
        showToast(text, 'success');
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `end_of_day_report_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
        
    } catch (err) {
        console.error('Error exporting report:', err);
        showToast("Error exporting report: " + err.message, 'error');
    }
}

async function getStockReport() {
    try {
        let res = await fetch(`${BASE_URL}/items`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        let items = await res.json();
        let report = "📦 Stock Status Report\n";
        report += "========================\n\n";
        
        let lowStockItems = [];
        let outOfStockItems = [];
        
        for (let name in items) {
            let item = items[name];
            report += `${name}: ${item.stock} units (Threshold: ${item.threshold})\n`;
            
            if (item.stock === 0) {
                outOfStockItems.push(name);
            } else if (item.stock <= item.threshold) {
                lowStockItems.push(name);
            }
        }
        
        if (lowStockItems.length > 0) {
            report += "\n⚠️ Low Stock Items (Reorder Soon):\n";
            lowStockItems.forEach(item => {
                report += `- ${item}\n`;
            });
        }
        
        if (outOfStockItems.length > 0) {
            report += "\n❌ Out of Stock Items:\n";
            outOfStockItems.forEach(item => {
                report += `- ${item}\n`;
            });
        }
        
        showToast(report, 'success');
        
    } catch (err) {
        console.error('Error generating stock report:', err);
        showToast("Error generating stock report: " + err.message, 'error');
    }
}

function showSalesHistory() {
    if (salesHistory.length === 0) {
        showToast('No sales history available yet!', 'warning');
        return;
    }
    
    let history = "📋 Sales History\n";
    history += "==================\n\n";
    
    salesHistory.slice(-10).reverse().forEach((sale, index) => {
        const date = new Date(sale.date).toLocaleString();
        history += `Sale #${salesHistory.length - index}\n`;
        history += `Date: ${date}\n`;
        history += `Table: ${sale.table}\n`;
        history += `Total: Ksh ${sale.total.toFixed(2)}\n`;
        history += "Items:\n";
        
        for (let item in sale.items) {
            history += `  - ${item} x${sale.items[item].qty}\n`;
        }
        history += "\n";
    });
    
    showToast(history, 'success');
}


function joinLoyalty() {
    const emailInput = document.querySelector("#loyalty-section .email-input");
    const phoneInput = document.querySelector("#loyalty-section .phone-input");
    
    const email = emailInput?.value;
    const phone = phoneInput?.value;
    
    if (!email || !email.includes('@')) {
        showToast("Please enter a valid email address.", 'error');
        return;
    }
    
    const loyaltyData = {
        email: email,
        phone: phone,
        joinDate: new Date().toISOString(),
        points: 50 
    };
    
    let loyaltyMembers = JSON.parse(localStorage.getItem('loyaltyMembers') || '[]');
    loyaltyMembers.push(loyaltyData);
    localStorage.setItem('loyaltyMembers', JSON.stringify(loyaltyMembers));
    
    showToast(`Welcome to our loyalty program, ${email}! 🎉 You've earned 50 bonus points!`, 'success');
    
    if (emailInput) emailInput.value = '';
    if (phoneInput) phoneInput.value = '';
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
