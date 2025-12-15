// ==========================================
// 1. GESTIÓN DE CARRITO Y PERSISTENCIA (LOCALSTORAGE)
// ==========================================

// Estado Global del Carrito
let cart = {}; // { "NombreItem": { price: 10.00, qty: 2 } }

// Cargar estado guardado al iniciar
function loadState() {
  // 1. Cargar Carrito
  const savedCart = localStorage.getItem('curarteCart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateUI();
  }

  // 2. Cargar Datos del Formulario
  const savedForm = localStorage.getItem('curarteForm');
  if (savedForm) {
    const formData = JSON.parse(savedForm);
    const nameInput = document.getElementById('resName');
    const notesInput = document.getElementById('resNotes');
    const dateInput = document.getElementById('resDate'); // Nuevo campo fecha
    
    if (nameInput) nameInput.value = formData.name || '';
    if (notesInput) notesInput.value = formData.notes || '';
    if (dateInput) dateInput.value = formData.date || '';
  }
}

// Guardar Carrito en Storage
function saveCart() {
  localStorage.setItem('curarteCart', JSON.stringify(cart));
}

// Guardar Formulario en Storage
function saveForm() {
  const name = document.getElementById('resName')?.value || '';
  const notes = document.getElementById('resNotes')?.value || '';
  const date = document.getElementById('resDate')?.value || ''; // Capturar fecha
  localStorage.setItem('curarteForm', JSON.stringify({ name, notes, date }));
}

// Inicializar Listeners del Menú (Botones + y -)
function setupCartListeners() {
  const menuItems = document.querySelectorAll('.menu-list li');
  
  menuItems.forEach(item => {
    const name = item.getAttribute('data-name');
    const price = parseFloat(item.getAttribute('data-price'));
    const minusBtn = item.querySelector('.minus');
    const plusBtn = item.querySelector('.plus');
    
    if (minusBtn && plusBtn) {
      minusBtn.addEventListener('click', () => updateItemQty(name, price, -1));
      plusBtn.addEventListener('click', () => updateItemQty(name, price, 1));
    }
  });

  // Listeners para inputs del formulario (guardado automático)
  document.getElementById('resName')?.addEventListener('input', saveForm);
  document.getElementById('resNotes')?.addEventListener('input', saveForm);
  document.getElementById('resDate')?.addEventListener('input', saveForm); // Listener fecha
}

// Actualizar Cantidad
function updateItemQty(name, price, change) {
  if (!cart[name]) {
    cart[name] = { price: price, qty: 0 };
  }
  
  cart[name].qty += change;
  
  if (cart[name].qty <= 0) {
    delete cart[name];
  }
  
  saveCart(); // Guardar cambios
  updateUI();
}

// Actualizar toda la interfaz (Contadores Menú, Burbuja y Modal)
function updateUI() {
  // 1. Actualizar contadores en la lista del menú
  const menuItems = document.querySelectorAll('.menu-list li');
  menuItems.forEach(item => {
    const name = item.getAttribute('data-name');
    const qtyDisplay = item.querySelector('.qty-val');
    if (qtyDisplay) {
      qtyDisplay.textContent = cart[name] ? cart[name].qty : 0;
    }
  });

  // 2. Actualizar Burbuja Flotante Total
  const totalItems = Object.values(cart).reduce((acc, item) => acc + item.qty, 0);
  const globalCount = document.getElementById('globalCartCount');
  if (globalCount) globalCount.textContent = totalItems;

  // 3. Renderizar Modal si está abierto
  renderCartInModal();
}

// Renderizar tabla en el Modal
function renderCartInModal() {
  const container = document.getElementById('cartItemsContainer');
  const totalVal = document.getElementById('cartTotalValue');
  
  if (!container || !totalVal) return;
  
  container.innerHTML = '';
  let totalPrice = 0;
  
  const itemNames = Object.keys(cart);
  
  if (itemNames.length === 0) {
    // ESTADO VACÍO CON BOTÓN
    container.innerHTML = `
        <div class="empty-state-container">
            <p class="empty-cart-msg">Aún no has seleccionado productos.</p>
            <button id="btnGoToMenu" class="btn-ghost-sm" style="margin: 0 auto; display: block;">Ir al Menú</button>
        </div>
    `;
    
    // Listener para cerrar modal y navegar al menú
    document.getElementById('btnGoToMenu').addEventListener('click', (e) => {
        e.preventDefault();
        const modal = document.getElementById("reservationModal");
        if(modal) modal.style.display = "none";
        
        const menuSec = document.getElementById('menu');
        if(menuSec) {
            const y = menuSec.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    });

  } else {
    itemNames.forEach(name => {
      const item = cart[name];
      const subtotal = item.price * item.qty;
      totalPrice += subtotal;
      
      const row = document.createElement('div');
      row.className = 'cart-item-row';
      row.innerHTML = `
        <div class="cart-item-controls">
           <button onclick="updateItemQty('${name}', ${item.price}, -1)">-</button>
           <span>${item.qty}</span>
           <button onclick="updateItemQty('${name}', ${item.price}, 1)">+</button>
        </div>
        <div style="padding-left:10px;">${name}</div>
        <div style="font-weight:bold;">$${subtotal.toFixed(2)}</div>
      `;
      container.appendChild(row);
    });
  }
  
  totalVal.textContent = `$${totalPrice.toFixed(2)}`;
}

// Botón Vaciar Carrito
document.getElementById('btnClearCart')?.addEventListener('click', (e) => {
  e.preventDefault();
  cart = {};
  saveCart();
  updateUI();
});

// NUEVO: LÓGICA SELECTOR DE PAGO
function setupPaymentSelector() {
  const selector = document.getElementById('paymentMethodSelector');
  const infoLoja = document.getElementById('infoLoja');
  const infoDeuna = document.getElementById('infoDeuna');

  if (selector && infoLoja && infoDeuna) {
    selector.addEventListener('change', (e) => {
      const val = e.target.value;
      
      // Ocultar ambos primero
      infoLoja.classList.add('hidden');
      infoDeuna.classList.add('hidden');

      // Mostrar según selección
      if (val === 'loja') {
        infoLoja.classList.remove('hidden');
      } else if (val === 'deuna') {
        infoDeuna.classList.remove('hidden');
      }
    });
  }
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
  setupCartListeners();
  setupPaymentSelector(); // Activar selector de pago
  loadState(); // Restaurar datos
});


// ==========================================
// 2. GESTIÓN DE MENÚS FLOTANTES (FAB)
// ==========================================

function setupFab(triggerId, containerId) {
  const trigger = document.getElementById(triggerId);
  const container = document.getElementById(containerId);

  if (trigger && container) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      // Cerrar otros menús activos
      document.querySelectorAll('.fab-container').forEach(fab => {
        if (fab !== container && fab.id !== 'fabCartContainer') { 
           fab.classList.remove('active');
        }
        // Si clickeo el mismo, toggle
        if (fab === container) fab.classList.toggle('active');
        else fab.classList.remove('active');
      });
    });
  }
}

// Menú Comida (Derecha Abajo)
setupFab('fabTriggerFood', 'fabFood');
// Menú Navegación (Derecha Arriba)
setupFab('fabTriggerNav', 'fabNav');

// Click fuera para cerrar FABs
document.addEventListener('click', (e) => {
  document.querySelectorAll('.fab-container').forEach(container => {
    // No cerrar si clickeo dentro del modal o dentro del FAB
    if (!container.contains(e.target) && !e.target.closest('.qty-btn') && !e.target.closest('.fab-main')) {
      container.classList.remove('active');
    }
  });
});


// ==========================================
// 3. BOTONES DE APERTURA DE MODAL (FABs)
// ==========================================
const fabBtnReserva = document.getElementById('fabBtnReserva'); // Desde Nav
const fabTriggerCart = document.getElementById('fabTriggerCart'); // Desde Carrito Independiente
const reservationModal = document.getElementById("reservationModal");

function openModal(e) {
  if (e) e.preventDefault();
  document.getElementById('fabNav').classList.remove('active');
  if (reservationModal) {
      reservationModal.style.display = "flex";
      renderCartInModal(); // Asegurar renderizado
  }
}

if (fabBtnReserva) fabBtnReserva.addEventListener('click', openModal);
if (fabTriggerCart) fabTriggerCart.addEventListener('click', openModal);


// ==========================================
// 4. NAVEGACIÓN INTELIGENTE (SCROLL + CENTER)
// ==========================================
const allNavButtons = document.querySelectorAll('.tab-btn');

allNavButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Si es botón del FAB, cerrar FAB
    if (btn.classList.contains('fab-item')) {
        document.getElementById('fabFood').classList.remove('active');
    }

    // Activar clase visual
    allNavButtons.forEach(t => t.classList.remove('active'));
    // Ojo: hay duplicados (en tabs y en FAB), activar ambos si coinciden data-target
    const targetId = btn.getAttribute('data-target');
    document.querySelectorAll(`.tab-btn[data-target="${targetId}"]`).forEach(b => b.classList.add('active'));
    
    const targetCard = document.getElementById(targetId);
    
    if (targetCard) {
      // VERTICAL
      const cardRect = targetCard.getBoundingClientRect();
      const absoluteTop = cardRect.top + window.scrollY;
      const windowHeight = window.innerHeight;
      const cardHeight = cardRect.height;
      
      let centerVert = absoluteTop - (windowHeight / 2) + (cardHeight / 2);
      if (cardHeight > windowHeight) { centerVert = absoluteTop - 140; }

      window.scrollTo({ top: centerVert, behavior: 'smooth' });

      // HORIZONTAL
      const parentGrid = targetCard.closest('.menu-grid, .vinos-grid');
      if (parentGrid && parentGrid.scrollWidth > parentGrid.clientWidth) {
          const scrollLeftPos = targetCard.offsetLeft - (parentGrid.clientWidth / 2) + (targetCard.clientWidth / 2);
          parentGrid.scrollTo({ left: scrollLeftPos, behavior: 'smooth' });
      }
    }
  });
});

// ==========================================
// 5. SCROLL LINKS GENERALES (NAV SUP)
// ==========================================
document.addEventListener("click", (e) => {
  const targetLink = e.target.closest("a[href^='#']");
  const targetBtn = e.target.closest("[data-scroll]");
  
  if (e.target.closest('.tab-btn')) return; // Ignorar tabs

  let selector;
  if (targetBtn) selector = targetBtn.getAttribute("data-scroll");
  else if (targetLink) selector = targetLink.getAttribute("href");
  else return;

  if (!selector || selector === "#") return;
  const section = document.querySelector(selector);
  if (!section) return;

  e.preventDefault();
  
  const fabNav = document.getElementById('fabNav');
  if (fabNav) fabNav.classList.remove('active');

  const y = section.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top: y, behavior: "smooth" });
});

// ==========================================
// 6. ANIMACIONES
// ==========================================
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll(".hero-card, .menu-card, .vino-card, .section-header, .experience-content, .wine-guide-card").forEach((el) => {
  if (!el.classList.contains("hero-card")) {
      el.classList.add("reveal");
  }
  observer.observe(el);
});

// ==========================================
// 7. MODAL FORMULARIO Y ENVÍO WHATSAPP
// ==========================================
const btnReservaMain = document.getElementById("btnReserva");
const closeModalSpan = document.querySelector(".close-modal");
const reservationForm = document.getElementById("reservationForm");

if (reservationModal) {
  if (btnReservaMain) {
    btnReservaMain.addEventListener("click", (e) => {
      e.preventDefault();
      reservationModal.style.display = "flex";
      renderCartInModal();
    });
  }
  if (closeModalSpan) {
    closeModalSpan.addEventListener("click", () => {
      reservationModal.style.display = "none";
    });
  }
  window.addEventListener("click", (e) => {
    if (e.target === reservationModal) {
      reservationModal.style.display = "none";
    }
  });

  if (reservationForm) {
    reservationForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("resName").value;
      const notes = document.getElementById("resNotes").value;
      const date = document.getElementById("resDate").value; // Capturar fecha
      const time = document.getElementById("resTime").value;

      // CONSTRUIR MENSAJE DEL CARRITO
      let orderText = "";
      let grandTotal = 0;
      const items = Object.keys(cart);
      
      if (items.length > 0) {
        orderText = "📋 *DETALLE DEL PEDIDO:*%0A";
        items.forEach(itemName => {
           const item = cart[itemName];
           const subtotal = item.qty * item.price;
           grandTotal += subtotal;
           orderText += `▫️ ${item.qty}x ${itemName} ($${subtotal.toFixed(2)})%0A`;
        });
        orderText += `💰 *TOTAL A PAGAR: $${grandTotal.toFixed(2)}*%0A`;
      } else {
        orderText = "📋 *PEDIDO:* (Sin items seleccionados en web)%0A";
      }

      const message = `Hola CurArte, deseo realizar una reserva.%0A%0A` +
                      `👤 *Nombre:* ${name}%0A` +
                      `📅 *Fecha:* ${date}%0A` + // Incluir fecha
                      `⏰ *Hora:* ${time}%0A` +
                      `📝 *Notas:* ${notes}%0A%0A` +
                      `${orderText}%0A` +
                      `📎 *Adjunto mi comprobante de pago.*`;

      const phone = "593999777870";
      const url = `https://wa.me/${phone}?text=${message}`;
      window.open(url, '_blank');
      
       reservationModal.style.display = "none";
    });
  }
}