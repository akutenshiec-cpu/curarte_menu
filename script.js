// ==========================================
// 1. GESTIÓN DE CARRITO Y PERSISTENCIA (LOCALSTORAGE)
// ==========================================

// Estado Global del Carrito
let cart = {}; 

// BASE DE DATOS DE MARIDAJE (La "IA" simulada)
const pairingsDatabase = [
  {
    keywords: ["Pizza", "Serrano", "Margherita", "Ibérica"],
    text: "La acidez del tomate y la grasa del queso fundido requieren un vino que limpie el paladar. La estructura tánica media y las notas frutales de este vino crean el puente perfecto.",
    recommendation: "Sugerencia: Viña Albali Tinto"
  },
  {
    keywords: ["Tabla", "Quesos", "Embutidos", "Solo para mí", "Dúo"],
    text: "Para una variedad de texturas curadas y lácteas, analizamos que se necesita versatilidad. Un vino con cuerpo medio y notas especiadas elevará tanto el queso suave como el jamón intenso.",
    recommendation: "Sugerencia: Viña Albali Reserva"
  },
  {
    keywords: ["Pasta", "Tagliatelle", "Carbonara", "Pesto", "Pomodoro"],
    text: "La cremosidad de la salsa y la textura de la pasta artesanal piden un acompañante elegante. Detectamos afinidad con notas de frutos rojos maduros y un final sedoso.",
    recommendation: "Sugerencia: Circus Malbec"
  },
  {
    keywords: ["Sandwich", "Pernil", "Roast", "Sfumato"],
    text: "Analizando perfiles ahumados y cárnicos: Se recomienda un tinto con carácter que no sea opacado por la intensidad del relleno, pero que respete la crujencia del pan.",
    recommendation: "Sugerencia: Pascual Toso Estate"
  },
  {
    keywords: ["Postre", "Dulce", "Cura de Verano"],
    text: "Para el final dulce, la IA sugiere contraste o armonía. Un tinto suave puede resaltar el chocolate, o un café de especialidad para equilibrar el azúcar con amargor noble.",
    recommendation: "Sugerencia: Café Americano o Peñasol Semidulce"
  },
  {
    keywords: ["Gin", "Aperol", "Cóctel"],
    text: "Estás en modo celebración. Si buscas cambiar de ritmo después del cóctel, sugerimos pasar a una copa ligera y afrutada que mantenga la frescura en el paladar.",
    recommendation: "Sugerencia: Peñasol Tinto (Copa)"
  }
];

// Función para invocar a la IA
function triggerAIAnalysis(itemName) {
  const aiText = document.getElementById('ai-text');
  const aiRec = document.getElementById('ai-recommendation');
  const aiSub = document.getElementById('ai-subtitle');
  
  if (!aiText || !aiRec) return;

  // Buscar coincidencia
  const match = pairingsDatabase.find(group => 
    group.keywords.some(keyword => itemName.includes(keyword))
  );

  if (match) {
    // Efecto visual de "pensando" (fade out/in rápido)
    aiText.style.opacity = 0;
    aiRec.style.opacity = 0;
    
    setTimeout(() => {
      aiSub.textContent = `Analizando: ${itemName}...`;
      aiText.innerHTML = match.text; // Usar innerHTML por si hay negritas
      aiRec.textContent = match.recommendation;
      
      aiText.style.opacity = 1;
      aiRec.style.opacity = 1;
    }, 300);
  }
}

// Cargar estado guardado al iniciar
function loadState() {
  const savedCart = localStorage.getItem('curarteCart');
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateUI();
  }

  const savedForm = localStorage.getItem('curarteForm');
  if (savedForm) {
    const formData = JSON.parse(savedForm);
    const nameInput = document.getElementById('resName');
    const notesInput = document.getElementById('resNotes');
    const dateInput = document.getElementById('resDate');
    
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
  const date = document.getElementById('resDate')?.value || '';
  localStorage.setItem('curarteForm', JSON.stringify({ name, notes, date }));
}

// Inicializar Listeners del Menú (Botones + y -)
function setupCartListeners() {
  // CAMBIO: Ahora seleccionamos items del menú Y opciones de vino
  const buyableItems = document.querySelectorAll('.menu-list li, .wine-option-row');
  
  buyableItems.forEach(item => {
    const name = item.getAttribute('data-name');
    const price = parseFloat(item.getAttribute('data-price'));
    const minusBtn = item.querySelector('.minus');
    const plusBtn = item.querySelector('.plus');
    
    if (minusBtn && plusBtn) {
      // Clonar para evitar listeners duplicados si se reinicia
      const newMinus = minusBtn.cloneNode(true);
      const newPlus = plusBtn.cloneNode(true);
      
      minusBtn.parentNode.replaceChild(newMinus, minusBtn);
      plusBtn.parentNode.replaceChild(newPlus, plusBtn);

      newMinus.addEventListener('click', () => updateItemQty(name, price, -1));
      newPlus.addEventListener('click', () => updateItemQty(name, price, 1));
    }
  });

  document.getElementById('resName')?.addEventListener('input', saveForm);
  document.getElementById('resNotes')?.addEventListener('input', saveForm);
  document.getElementById('resDate')?.addEventListener('input', saveForm);
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

  // --- TRIGGER IA ---
  // Si estamos AÑADIENDO un producto (+1), disparar la recomendación
  if (change > 0) {
    triggerAIAnalysis(name);
  }
  
  saveCart(); 
  updateUI();
}

// Actualizar toda la interfaz
function updateUI() {
  // 1. Actualizar contadores en la lista del menú y vinos
  const buyableItems = document.querySelectorAll('.menu-list li, .wine-option-row');
  buyableItems.forEach(item => {
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
    container.innerHTML = `
        <div class="empty-state-container">
            <p class="empty-cart-msg">Aún no has seleccionado productos.</p>
            <button id="btnGoToMenu" class="btn-ghost-sm" style="margin: 0 auto; display: block;">Ir al Menú</button>
        </div>
    `;
    
    const btnGo = document.getElementById('btnGoToMenu');
    if(btnGo) {
        btnGo.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = document.getElementById("reservationModal");
            if(modal) modal.style.display = "none";
            const menuSec = document.getElementById('menu');
            if(menuSec) {
                const y = menuSec.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top: y, behavior: "smooth" });
            }
        });
    }

  } else {
    itemNames.forEach(name => {
      const item = cart[name];
      const subtotal = item.price * item.qty;
      totalPrice += subtotal;
      
      const row = document.createElement('div');
      row.className = 'cart-item-row';
      row.innerHTML = `
        <div class="cart-item-controls">
           <button class="modal-minus">-</button>
           <span>${item.qty}</span>
           <button class="modal-plus">+</button>
        </div>
        <div style="padding-left:10px;">${name}</div>
        <div style="font-weight:bold;">$${subtotal.toFixed(2)}</div>
      `;
      
      // Listeners directos para el modal
      // Usar closures para asegurar que el nombre/precio es correcto
      row.querySelector('.modal-minus').onclick = () => updateItemQty(name, item.price, -1);
      row.querySelector('.modal-plus').onclick = () => updateItemQty(name, item.price, 1);
      
      container.appendChild(row);
    });
  }
  
  totalVal.textContent = `$${totalPrice.toFixed(2)}`;
}

document.getElementById('btnClearCart')?.addEventListener('click', (e) => {
  e.preventDefault();
  cart = {};
  saveCart();
  updateUI();
});

function setupPaymentSelector() {
  const selector = document.getElementById('paymentMethodSelector');
  const infoLoja = document.getElementById('infoLoja');
  const infoDeuna = document.getElementById('infoDeuna');

  if (selector && infoLoja && infoDeuna) {
    selector.addEventListener('change', (e) => {
      const val = e.target.value;
      infoLoja.classList.add('hidden');
      infoDeuna.classList.add('hidden');
      if (val === 'loja') infoLoja.classList.remove('hidden');
      else if (val === 'deuna') infoDeuna.classList.remove('hidden');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupCartListeners();
  setupPaymentSelector();
  loadState();
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
      document.querySelectorAll('.fab-container').forEach(fab => {
        if (fab !== container && fab.id !== 'fabCartContainer') { 
           fab.classList.remove('active');
        }
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

// CAMBIO: Añadido .ai-pairing-container al selector para que se anime
document.querySelectorAll(".hero-card, .menu-card, .vino-card, .section-header, .experience-content, .wine-guide-card, .ai-pairing-container").forEach((el) => {
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