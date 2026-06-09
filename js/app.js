/**
 * SolusiJoki.id - Core Website Logic
 * Handles cost estimation, theme toggles, accordions, and WhatsApp form submissions.
 */

// Configuration - easily customizable by the user
const CONFIG = {
  whatsappNumber: '6285184852924', // Target WhatsApp number (include country code without +)
  pricing: {
    baseRates: {
      sma: 15000,   // Rate per page for High School (SMA)
      s1: 25000,    // Rate per page for Undergraduate (S1)
      s2: 40000     // Rate per page for Postgraduate (S2/S3)
    },
    serviceMultipliers: {
      makalah: 1.0,
      resume: 0.8,
      esai: 1.2,
      lainnya: 1.1
    },
    deadlineMultipliers: {
      standard: 1.0, // > 5 days
      express: 1.3,  // 2-4 days
      kilat: 1.7     // < 24 hours
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileNav();
  initAccordions();
  initCostCalculator();
  initOrderForm();
  initScrollAnimations();
  initHeaderScroll();
});

/**
 * 0. Header Scroll Shadow Effect
 */
function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 10) {
      header.classList.add('shadow-lg', 'shadow-slate-300/40', 'dark:shadow-black/30');
      header.classList.add('bg-white/85', 'dark:bg-slate-900/85');
      header.classList.remove('bg-white/70', 'dark:bg-slate-900/70');
    } else {
      header.classList.remove('shadow-lg', 'shadow-slate-300/40', 'dark:shadow-black/30');
      header.classList.remove('bg-white/85', 'dark:bg-slate-900/85');
      header.classList.add('bg-white/70', 'dark:bg-slate-900/70');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
}

/**
 * 1. Dark Mode / Theme Toggle Logic
 */
function initTheme() {
  const themeToggles = document.querySelectorAll('.theme-toggle');
  
  // Apply saved theme or system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.classList.add('dark');
    updateThemeToggleIcons('dark');
  } else {
    document.documentElement.classList.remove('dark');
    updateThemeToggleIcons('light');
  }

  themeToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      updateThemeToggleIcons(isDark ? 'dark' : 'light');
    });
  });
}

function updateThemeToggleIcons(mode) {
  const themeToggles = document.querySelectorAll('.theme-toggle');
  themeToggles.forEach(toggle => {
    const icon = toggle.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = mode === 'dark' ? 'light_mode' : 'dark_mode';
    }
  });
}

/**
 * 2. Mobile Navbar Drawer
 */
function initMobileNav() {
  const menuBtn = document.getElementById('menu-btn');
  const closeBtn = document.getElementById('close-menu-btn');
  const mobileNav = document.getElementById('mobile-nav-drawer');
  const navLinks = document.querySelectorAll('.mobile-nav-link');

  if (!menuBtn || !mobileNav) return;

  const openDrawer = () => {
    mobileNav.classList.add('open');
    document.body.classList.add('overflow-hidden');
  };

  const closeDrawer = () => {
    mobileNav.classList.remove('open');
    document.body.classList.remove('overflow-hidden');
  };

  menuBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  // Close drawer when clicking any link
  navLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

/**
 * 3. Accordion FAQ Section
 */
function initAccordions() {
  const accordionHeaders = document.querySelectorAll('.faq-header');

  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const icon = header.querySelector('.faq-icon');
      
      // Close other accordions
      accordionHeaders.forEach(otherHeader => {
        if (otherHeader !== header) {
          const otherContent = otherHeader.nextElementSibling;
          const otherIcon = otherHeader.querySelector('.faq-icon');
          if (otherContent.classList.contains('open')) {
            otherContent.classList.remove('open');
            otherContent.style.maxHeight = null;
            if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
          }
        }
      });

      // Toggle current accordion
      const isOpen = content.classList.toggle('open');
      if (isOpen) {
        content.style.maxHeight = content.scrollHeight + 'px';
        if (icon) icon.style.transform = 'rotate(180deg)';
      } else {
        content.style.maxHeight = null;
        if (icon) icon.style.transform = 'rotate(0deg)';
      }
    });
  });
}

/**
 * 4. Cost Calculator Logic
 */
function initCostCalculator() {
  const calcLevel = document.getElementById('calc-level');
  const calcService = document.getElementById('calc-service');
  const calcPages = document.getElementById('calc-pages');
  const calcDeadline = document.getElementById('calc-deadline');
  
  const pagesValue = document.getElementById('pages-value');
  const calcMinPrice = document.getElementById('calc-min-price');
  const calcMaxPrice = document.getElementById('calc-max-price');
  
  const useEstimateBtn = document.getElementById('use-estimate-btn');

  if (!calcLevel || !calcService || !calcPages || !calcDeadline) return;

  // Update slider label on input
  calcPages.addEventListener('input', () => {
    if (pagesValue) pagesValue.textContent = calcPages.value;
    calculate();
  });

  // Calculate whenever inputs change
  [calcLevel, calcService, calcDeadline].forEach(elem => {
    elem.addEventListener('change', calculate);
  });

  function calculate() {
    const level = calcLevel.value;
    const service = calcService.value;
    const pages = parseInt(calcPages.value) || 1;
    const deadline = calcDeadline.value;

    const baseRate = CONFIG.pricing.baseRates[level] || CONFIG.pricing.baseRates.s1;
    const serviceMultiplier = CONFIG.pricing.serviceMultipliers[service] || 1.0;
    const deadlineMultiplier = CONFIG.pricing.deadlineMultipliers[deadline] || 1.0;

    // Calculate base cost range
    const baseCost = baseRate * serviceMultiplier * deadlineMultiplier * pages;
    
    // Create an estimated price range (-5% to +10% for custom project variations)
    const minPrice = Math.round((baseCost * 0.95) / 1000) * 1000;
    const maxPrice = Math.round((baseCost * 1.10) / 1000) * 1000;

    if (calcMinPrice && calcMaxPrice) {
      calcMinPrice.textContent = formatCurrency(minPrice);
      calcMaxPrice.textContent = formatCurrency(maxPrice);
    }

    return { level, service, pages, deadline, minPrice, maxPrice };
  }

  // Pre-fill order form with calculated inputs when clicking "Gunakan Estimasi Ini"
  if (useEstimateBtn) {
    useEstimateBtn.addEventListener('click', () => {
      const results = calculate();
      
      const formService = document.getElementById('form-service');
      const formLevel = document.getElementById('form-level');
      const formPages = document.getElementById('form-pages');
      const formDeadline = document.getElementById('form-deadline');

      if (formService) formService.value = mapServiceValue(results.service);
      if (formLevel) formLevel.value = mapLevelValue(results.level);
      if (formPages) formPages.value = results.pages;
      
      // Calculate a date target based on deadline speed option
      if (formDeadline) {
        const today = new Date();
        if (results.deadline === 'kilat') {
          today.setDate(today.getDate() + 1);
        } else if (results.deadline === 'express') {
          today.setDate(today.getDate() + 3);
        } else {
          today.setDate(today.getDate() + 6);
        }
        formDeadline.value = today.toISOString().split('T')[0];
      }

      // Scroll smoothly to form section
      const formSection = document.getElementById('order-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Run initial calculation
  calculate();
}

function formatCurrency(amount) {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

// Map calculator values to order form values
function mapServiceValue(calcService) {
  const mapping = {
    makalah: 'Makalah',
    resume: 'Resume Buku',
    esai: 'Esai Akademik',
    lainnya: 'Lainnya'
  };
  return mapping[calcService] || 'Makalah';
}

function mapLevelValue(calcLevel) {
  const mapping = {
    sma: 'SMA / Sederajat',
    s1: 'S1 / Diploma',
    s2: 'S2 / Master'
  };
  return mapping[calcLevel] || 'S1 / Diploma';
}

/**
 * 5. Order Form Submission to WhatsApp
 */
function initOrderForm() {
  const orderForm = document.getElementById('order-form');
  if (!orderForm) return;

  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('form-name').value.trim();
    const service = document.getElementById('form-service').value;
    const level = document.getElementById('form-level').value;
    const pages = document.getElementById('form-pages').value;
    const deadline = document.getElementById('form-deadline').value;
    const details = document.getElementById('form-details').value.trim();

    if (!name || !deadline) {
      alert('Mohon isi nama lengkap dan deadline pengerjaan!');
      return;
    }

    // Format message
    const formattedDeadline = formatDateString(deadline);
    const message = `Halo SolusiJoki.id, saya ingin berkonsultasi untuk pemesanan jasa joki tugas:

*Form Pemesanan:*
• *Nama Lengkap:* ${name}
• *Jenis Layanan:* ${service}
• *Jenjang Pendidikan:* ${level}
• *Jumlah Halaman:* ${pages} Halaman
• *Deadline Pengerjaan:* ${formattedDeadline}

*Detail & Deskripsi Tugas:*
${details ? details : '_(Detail disampaikan saat chat)_'}

Mohon informasi harga resmi dan metode pembayarannya. Terima kasih!`;

    // Encode message for URL
    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${CONFIG.whatsappNumber}&text=${encodedText}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
  });

  // Attach direct WhatsApp contact triggers (for other floating links / buttons)
  const waContactBtns = document.querySelectorAll('.wa-contact-trigger');
  waContactBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const genericMsg = 'Halo SolusiJoki.id, saya tertarik dengan layanan pengerjaan tugas akademik Anda. Bisa bantu saya?';
      const encodedMsg = encodeURIComponent(genericMsg);
      window.open(`https://api.whatsapp.com/send?phone=${CONFIG.whatsappNumber}&text=${encodedMsg}`, '_blank');
    });
  });
}

function formatDateString(dateStr) {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  } catch (e) {
    return dateStr;
  }
}

/**
 * 6. Smooth Scroll Animations using IntersectionObserver
 */
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('opacity-100', 'translate-y-0');
        entry.target.classList.remove('opacity-0', 'translate-y-8');
        observer.unobserve(entry.target); // Trigger only once
      }
    });
  }, observerOptions);

  const animatedElements = document.querySelectorAll('.scroll-animate');
  animatedElements.forEach(el => {
    el.classList.add('transition-all', 'duration-700', 'opacity-0', 'translate-y-8');
    observer.observe(el);
  });
}
