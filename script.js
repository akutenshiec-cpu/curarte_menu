// ==========================================
// 1. STATE & CART LOGIC (CON PERSISTENCIA)
// ==========================================
let cart = {}; 
const STORAGE_KEY = 'curarte_cart_v1'; // Clave para guardar en el navegador
const STORAGE_NAME = 'curarte_user_name'; // Clave para guardar nombre

document.addEventListener('DOMContentLoaded', () => {
    // 1. Recuperar datos guardados
    loadCartData();
    
    // 2. Iniciar UI
    injectMenuControls();
    
    // Configurar FABs
    setupFab('fabTriggerFood', 'fabFood');
    setupFab('fabTriggerNav', 'fabNav');
    
    // Configurar nueva burbuja del carrito (Direct Action, no menu)
    const cartTrigger = document.getElementById('fabCartTrigger');
    if(cartTrigger) {
        cartTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    setupScrollLogic();
    setupModalLogic();
    
    // 3. Restaurar nombre si existe
    const savedName = localStorage.getItem(STORAGE_NAME);
    if(savedName && document.getElementById('resName')) {
        document.getElementById('resName').value = savedName;
    }

    // 4. Actualizar contadores iniciales
    Object.keys(cart).forEach(name => {
        updateDisplay(name, cart[name].qty);
    });
    updateTotalBadge();
});

function loadCartData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            cart = JSON.parse(saved);
        } catch (e) {
            console.error("Error cargando carrito", e);
            cart = {};
        }
    }
}

function saveCartData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function injectMenuControls() {
    const menuItems = document.querySelectorAll('.menu-list li');

    menuItems.forEach((li) => {
        const nameEl = li.querySelector('.item-name');
        const priceEl = li.querySelector('.item-price');
        const metaEl = li.querySelector('.item-meta');

        if (nameEl && priceEl) {
            const name = nameEl.innerText.trim();
            // Limpieza del precio para convertir a número
            let rawPrice = priceEl.innerText
                .replace('$', '')
                .replace('Desde', '')
                .replace('Copa', '')
                .replace('Botella', '')
                .split('·')[0] // Por si tiene "Botella x · Copa y", toma el primero
                .trim()
                .replace(',', '.');
                
            const price = parseFloat(rawPrice) || 0;
            const meta = metaEl ? metaEl.innerText : '';

            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'item-controls';
            controlsDiv.innerHTML = `
                <button class="qty-btn minus" data-name="${name}">-</button>
                <span class="qty-display" id="qty-${cleanId(name)}">0</span>
                <button class="qty-btn plus" data-name="${name}">+</button>
            `;

            li.appendChild(controlsDiv);

            controlsDiv.querySelector('.plus').addEventListener('click', () => updateCart(name, price, meta, 1));
            controlsDiv.querySelector('.minus').addEventListener('click', () => updateCart(name, price, meta, -1));
        }
    });
}

function cleanId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '');
}

function updateCart(name, price, meta, change) {
    if (!cart[name]) {
        cart[name] = { price: price, qty: 0, meta: meta };
    }

    cart[name].qty += change;

    if (cart[name].qty <= 0) {
        delete cart[name];
        updateDisplay(name, 0);
    } else {
        updateDisplay(name, cart[name].qty);
    }

    // Guardar cambios en memoria
    saveCartData();
    
    updateTotalBadge();
    updateModalCart(); 
}

function updateDisplay(name, qty) {
    const display = document.getElementById(`qty-${cleanId(name)}`);
    if (display) {
        display.innerText = qty;
        const li = display.closest('li');
        if (qty > 0) li.classList.add('has-items');
        else li.classList.remove('has-items');
    }
}

function updateTotalBadge() {
    const totalQty = Object.values(cart).reduce((acc, item) => acc + item.qty, 0);
    const cartBadge = document.getElementById('cartBadge');
    
    // Actualizamos la burbuja roja
    if (cartBadge) {
        cartBadge.innerText = totalQty;
        if (totalQty > 0) {
            cartBadge.style.display = "flex";
            // Pequeña animación de pulso
            cartBadge.style.animation = 'none';
            cartBadge.offsetHeight; /* trigger reflow */
            cartBadge.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        } else {
            cartBadge.style.display = "none";
        }
    }
}

// ==========================================
// 2. MODAL & CART RENDERING
// ==========================================
const reservationModal = document.getElementById("reservationModal");
const cartContainer = document.getElementById("cart-container");
const totalDisplay = document.getElementById("cartTotalDisplay");
const cartInput = document.getElementById("cartData");

function updateModalCart() {
    if (!cartContainer) return;

    cartContainer.innerHTML = '';
    let total = 0;
    
    const items = Object.entries(cart);

    if (items.length === 0) {
        cartContainer.innerHTML = '<p style="text-align:center; color:#999; font-style:italic; padding:1rem;">Tu carrito está vacío. Agrega platos del menú.</p>';
        cartInput.value = ""; 
    } else {
        cartInput.value = "ok"; 
        
        items.forEach(([name, data]) => {
            const subtotal = data.price * data.qty;
            total += subtotal;

            const row = document.createElement('div');
            row.className = 'cart-item-row';
            row.innerHTML = `
                <div class="cart-item-info">
                    <strong>${name}</strong>
                    <span>${data.meta}</span>
                </div>
                <div class="cart-item-price">
                    $${subtotal.toFixed(2)}
                </div>
                <div class="cart-item-actions">
                    <button class="qty-btn minus-modal" style="width:24px; height:24px; font-size:0.8rem;">-</button>
                    <span style="font-weight:bold; min-width:15px; text-align:center;">${data.qty}</span>
                    <button class="qty-btn plus-modal" style="width:24px; height:24px; font-size:0.8rem;">+</button>
                    <button class="btn-trash"><i class="fas fa-trash"></i>×</button>
                </div>
            `;

            row.querySelector('.plus-modal').addEventListener('click', (e) => { e.preventDefault(); updateCart(name, data.price, data.meta, 1); });
            row.querySelector('.minus-modal').addEventListener('click', (e) => { e.preventDefault(); updateCart(name, data.price, data.meta, -1); });
            row.querySelector('.btn-trash').addEventListener('click', (e) => { e.preventDefault(); updateCart(name, data.price, data.meta, -data.qty); }); 

            cartContainer.appendChild(row);
        });
    }

    totalDisplay.innerText = `$${total.toFixed(2)}`;
}

// Botón "Vaciar carrito"
document.getElementById('btnClearCart')?.addEventListener('click', (e) => {
    e.preventDefault();
    Object.keys(cart).forEach(name => updateDisplay(name, 0));
    cart = {};
    saveCartData(); // Guardar el vaciado
    updateTotalBadge();
    updateModalCart();
});

// ==========================================
// 3. WHATSAPP GENERATOR & MODAL LOGIC
// ==========================================
const closeModalSpan = document.querySelector(".close-modal");
const reservationForm = document.getElementById("reservationForm");
const inputName = document.getElementById('resName');

// Guardar nombre al escribir
if(inputName) {
    inputName.addEventListener('input', (e) => {
        localStorage.setItem(STORAGE_NAME, e.target.value);
    });
}

function openModal() {
    updateModalCart(); 
    reservationModal.style.display = "flex";
    // Si algún menú FAB está abierto, cerrarlo
    document.querySelectorAll('.fab-container').forEach(fab => fab.classList.remove('active'));
}

function setupModalLogic() {
    // Ya no usamos btnReservaMain o fabBtnReserva antiguos
    if (closeModalSpan) closeModalSpan.addEventListener("click", () => reservationModal.style.display = "none");
    window.addEventListener("click", (e) => { if (e.target === reservationModal) reservationModal.style.display = "none"; });

    if (reservationForm) {
        reservationForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            if (Object.keys(cart).length === 0) {
                alert("Por favor, agrega productos al carrito antes de reservar.");
                return;
            }

            const name = document.getElementById("resName").value;
            const time = document.getElementById("resTime").value;
            
            let orderText = "";
            let finalTotal = 0;
            
            Object.entries(cart).forEach(([itemName, itemData]) => {
                const subtotal = itemData.price * itemData.qty;
                finalTotal += subtotal;
                orderText += `▪ ${itemData.qty}x ${itemName} ($${subtotal.toFixed(2)})\n`;
            });

            const message = `Hola CurArte, deseo realizar una reserva.%0A%0A` +
                            `👤 *Nombre:* ${name}%0A` +
                            `⏰ *Hora:* ${time}%0A%0A` +
                            `🍽️ *PEDIDO:*%0A${encodeURIComponent(orderText)}` +
                            `%0A💰 *TOTAL ESTIMADO: $${finalTotal.toFixed(2)}*%0A%0A` +
                            `📎 *Adjunto mi comprobante de pago.*`;

            const phone = "593999777870";
            const url = `https://wa.me/${phone}?text=${message}`;
            window.open(url, '_blank');
            
            // Opcional: Cerrar modal después de enviar
            reservationModal.style.display = "none";
        });
    }
}

// ==========================================
// 4. FUNCIONES DE UI GENERALES (FAB & SCROLL)
// ==========================================
function setupFab(triggerId, containerId) {
    const trigger = document.getElementById(triggerId);
    const container = document.getElementById(containerId);
    if (trigger && container) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Cerrar otros menús si hay más de uno abierto
            document.querySelectorAll('.fab-container').forEach(fab => {
                if (fab !== container) fab.classList.remove('active');
            });
            container.classList.toggle('active');
        });
    }
}

function setupScrollLogic() {
    const allNavButtons = document.querySelectorAll('.tab-btn');
    allNavButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('fab-item')) return; 
            
            allNavButtons.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            const targetCard = document.getElementById(targetId);
            if (targetCard) {
                const y = targetCard.getBoundingClientRect().top + window.scrollY - 140;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in-view");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(".hero-card, .menu-card, .vino-card, .section-header, .experience-content, .wine-guide-card").forEach((el) => {
        if (!el.classList.contains("hero-card")) el.classList.add("reveal");
        observer.observe(el);
    });
    
    // Scroll links generales (navbar superior)
    document.addEventListener("click", (e) => {
      const targetLink = e.target.closest("a[href^='#']");
      if (targetLink && !e.target.closest('.tab-btn')) {
          e.preventDefault();
          const selector = targetLink.getAttribute("href");
          const section = document.querySelector(selector);
          if (section) {
              const y = section.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top: y, behavior: "smooth" });
          }
      }
    });
}