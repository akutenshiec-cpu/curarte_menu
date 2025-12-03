// ==========================================
// 1. GESTIÓN DE MENÚS FLOTANTES (DOBLE BURBUJA)
// ==========================================

function setupFab(triggerId, containerId) {
  const trigger = document.getElementById(triggerId);
  const container = document.getElementById(containerId);

  if (trigger && container) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      // Cerrar otros menús
      document.querySelectorAll('.fab-container').forEach(fab => {
        if (fab !== container) fab.classList.remove('active');
      });
      container.classList.toggle('active');
    });
  }
}

// Menú Comida (Abajo)
setupFab('fabTriggerFood', 'fabFood');
// Menú Navegación (Arriba)
setupFab('fabTriggerNav', 'fabNav');

document.addEventListener('click', (e) => {
  document.querySelectorAll('.fab-container').forEach(container => {
    if (!container.contains(e.target)) {
      container.classList.remove('active');
    }
  });
});

// ==========================================
// 2. BOTÓN RESERVA DESDE BURBUJA
// ==========================================
const fabBtnReserva = document.getElementById('fabBtnReserva');
const reservationModal = document.getElementById("reservationModal");

if (fabBtnReserva && reservationModal) {
  fabBtnReserva.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('fabNav').classList.remove('active');
    reservationModal.style.display = "flex";
  });
}

// ==========================================
// 3. NAVEGACIÓN INTELIGENTE (SCROLL + CENTER)
// ==========================================
const allNavButtons = document.querySelectorAll('.tab-btn');

allNavButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    allNavButtons.forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    
    const targetId = btn.getAttribute('data-target');
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
    
    // Cerrar burbuja comida si está abierta
    const fabFood = document.getElementById('fabFood');
    if (fabFood) fabFood.classList.remove('active');
  });
});

// ==========================================
// 4. SCROLL LINKS GENERALES (NAV SUP)
// ==========================================
document.addEventListener("click", (e) => {
  const targetLink = e.target.closest("a[href^='#']");
  const targetBtn = e.target.closest("[data-scroll]");
  
  if (e.target.closest('.tab-btn')) return;

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
// 5. ANIMACIONES
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
// 6. MODAL FORMULARIO
// ==========================================
const btnReservaMain = document.getElementById("btnReserva");
const closeModalSpan = document.querySelector(".close-modal");
const reservationForm = document.getElementById("reservationForm");

if (reservationModal) {
  if (btnReservaMain) {
    btnReservaMain.addEventListener("click", (e) => {
      e.preventDefault();
      reservationModal.style.display = "flex";
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
      const order = document.getElementById("resOrder").value;
      const time = document.getElementById("resTime").value;

      const message = `Hola CurArte, deseo realizar una reserva.%0A%0A` +
                      `👤 *Nombre:* ${name}%0A` +
                      `🍽️ *Pedido:* ${order}%0A` +
                      `⏰ *Hora:* ${time}%0A%0A` +
                      `📎 *Adjunto mi comprobante de pago.*`;

      const phone = "593999777870";
      const url = `https://wa.me/${phone}?text=${message}`;
      window.open(url, '_blank');

      reservationModal.style.display = "none";
      reservationForm.reset();
    });
  }
}