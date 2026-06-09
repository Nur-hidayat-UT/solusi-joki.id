/**
 * SolusiJoki.id - Core Application Script
 * Integrasi Kalkulator Biaya, Form Order, Akordion FAQ, dan Manajemen Tema
 */

// 1. Konfigurasi Global Biaya yang Ramah Kantong Mahasiswa
const CONFIG = {
  whatsappNumber: '6283153145931', // Nomor WhatsApp Admin Resmi
  emailTarget: 'nurhidayatbswdayataka23.2@gmail.com', // Email Sementara

  basePricePerPage: {
    'makalah': 6000,
    'resume': 5000,
    'esai': 7000,
    'lainnya': 9000
  },

  levelMultiplier: {
    'sma': 0.85,
    's1': 1.0,
    's2': 1.25
  },

  deadlineMultiplier: {
    'standard': 1.0,
    'express': 1.15,
    'kilat': 1.35
  }
};

// 2. Inisialisasi Aplikasi Saat DOM Siap
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileNav();
  initPriceCalculator();
  initOrderForm();
  initFaqAccordion(); // Mengaktifkan interaksi FAQ
  initScrollAnimations();
});

/**
 * 3. Manajemen Tema (Light / Dark Mode) - Default Mode Terang
 */
function initThemeToggle() {
  const themeToggleBtn = document.querySelector('.theme-toggle');
  if (!themeToggleBtn) return;

  const themeIcon = themeToggleBtn.querySelector('.material-symbols-outlined') || themeToggleBtn;

  function syncThemeVisual() {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      if (themeIcon && themeIcon.textContent) themeIcon.textContent = 'light_mode'; // Ikon matahari saat gelap
    } else {
      if (themeIcon && themeIcon.textContent) themeIcon.textContent = 'dark_mode';  // Ikon bulan saat terang
    }
  }

  // 1. Cek memori penyimpanan browser
  const savedTheme = localStorage.getItem('color-theme');
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    // Selalu paksa masuk mode terang jika tidak ada riwayat memilih mode gelap
    document.documentElement.classList.remove('dark');
    localStorage.setItem('color-theme', 'light');
  }

  // Jalankan penyesuaian visual ikon tombol
  syncThemeVisual();

  // 2. Aksi tombol penukar tema ketika diklik
  themeToggleBtn.addEventListener('click', () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('color-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('color-theme', 'dark');
    }
    syncThemeVisual();
  });
}
/**
 * 4. Kontrol Navigasi Menu Mobile (Drawer)
 */
function initMobileNav() {
  const menuToggle = document.getElementById('menu-toggle');
  const closeMenu = document.getElementById('close-menu');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');

  if (!menuToggle || !mobileNavDrawer) return;

  const openDrawer = () => {
    mobileNavDrawer.classList.add('open');
    document.body.classList.add('overflow-hidden');
  };

  const closeDrawer = () => {
    mobileNavDrawer.classList.remove('open');
    document.body.classList.remove('overflow-hidden');
  };

  menuToggle.addEventListener('click', openDrawer);
  if (closeMenu) closeMenu.addEventListener('click', closeDrawer);

  const navLinks = mobileNavDrawer.querySelectorAll('a');
  navLinks.forEach(link => link.addEventListener('click', closeDrawer));
}

/**
 * 5. Logika Kalkulator Estimasi Biaya (Bergerak Real-time)
 */
function initPriceCalculator() {
  const calcService = document.getElementById('calc-service');
  const calcLevel = document.getElementById('calc-level');
  const calcPages = document.getElementById('calc-pages');
  const calcDeadline = document.getElementById('calc-deadline');

  const pagesValue = document.getElementById('pages-value');
  const calcMinPrice = document.getElementById('calc-min-price');
  const calcMaxPrice = document.getElementById('calc-max-price');

  if (!calcService || !calcLevel || !calcPages || !calcDeadline) return;

  function calculatePrice() {
    const service = calcService.value;
    const level = calcLevel.value;
    const pages = parseInt(calcPages.value) || 1;
    const deadline = calcDeadline.value;

    if (pagesValue) pagesValue.textContent = pages;

    const basePrice = CONFIG.basePricePerPage[service] || 15000;
    const levelMultiplier = CONFIG.levelMultiplier[level] || 1.0;
    const deadlineMultiplier = CONFIG.deadlineMultiplier[deadline] || 1.0;

    const midPrice = basePrice * pages * levelMultiplier * deadlineMultiplier;

    const minPrice = Math.round((midPrice * 0.9) / 1000) * 1000;
    const maxPrice = Math.round((midPrice * 1.1) / 1000) * 1000;

    if (calcMinPrice) calcMinPrice.textContent = `Rp ${minPrice.toLocaleString('id-ID')}`;
    if (calcMaxPrice) calcMaxPrice.textContent = `Rp ${maxPrice.toLocaleString('id-ID')}`;
  }

  calcService.addEventListener('change', calculatePrice);
  calcLevel.addEventListener('change', calculatePrice);
  calcDeadline.addEventListener('change', calculatePrice);
  calcPages.addEventListener('input', calculatePrice);

  calculatePrice();

  const useEstimateBtn = document.getElementById('use-estimate-btn');
  if (useEstimateBtn) {
    useEstimateBtn.addEventListener('click', () => {
      const orderSection = document.getElementById('order-form');
      if (orderSection) {
        orderSection.scrollIntoView({ behavior: 'smooth' });

        const formPages = document.getElementById('form-pages');
        if (formPages) formPages.value = calcPages.value;
      }
    });
  }
}

/**
 * 6. Validasi & Pengiriman Formulir Pemesanan (Dual Destination)
 */
function initOrderForm() {
  const orderForm = document.getElementById('order-form');
  const formDeadline = document.getElementById('form-deadline');

  if (!orderForm) return;

  if (formDeadline) {
    const hariIni = new Date().toISOString().split('T')[0];
    formDeadline.setAttribute('min', hariIni);
  }

  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('form-name').value.trim();
    const service = document.getElementById('form-service').value;
    const level = document.getElementById('form-level').value;
    const pages = document.getElementById('form-pages').value;
    const deadline = document.getElementById('form-deadline').value;
    const details = document.getElementById('form-details').value.trim();

    const destinationElement = document.querySelector('input[name="form-destination"]:checked');
    const destination = destinationElement ? destinationElement.value : 'whatsapp';

    if (!name || name.length < 2) {
      alert('Mohon masukkan nama lengkap Anda dengan benar!');
      return;
    }

    if (!deadline) {
      alert('Mohon tentukan tanggal deadline pengerjaan tugas!');
      return;
    }

    const formattedDeadline = formatDateString(deadline);

    // ✅ PERBAIKAN: Simpan data ke sessionStorage dan arahkan ke payment.html
    const orderData = {
      name: name,
      service: service,
      level: level,
      pages: pages,
      deadline: deadline,
      formattedDeadline: formattedDeadline,
      details: details,
      destination: destination
    };

    // Simpan data ke sessionStorage
    sessionStorage.setItem('orderData', JSON.stringify(orderData));

    // Arahkan ke halaman payment
    window.location.href = 'payment.html';
  });

  const waContactBtns = document.querySelectorAll('.wa-contact-trigger');
  waContactBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const genericMsg = 'Halo SolusiJoki.id, saya tertarik dengan layanan pengerjaan tugas akademik Anda. Bisa bantu saya?';
      const encodedMsg = encodeURIComponent(genericMsg);

      const mobileNav = document.getElementById('mobile-nav-drawer');
      if (mobileNav && mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        document.body.classList.remove('overflow-hidden');
      }

      window.open(`https://api.whatsapp.com/send?phone=${CONFIG.whatsappNumber}&text=${encodedMsg}`, '_blank');
    });
  });
}

function formatDateString(dateString) {
  if (!dateString) return '';
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', options);
}

/**
 * 7. Kontrol Logika Buka-Tutup Akordion FAQ (Smooth Accordion)
 */
function initFaqAccordion() {
  const faqHeaders = document.querySelectorAll('.faq-header');

  faqHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      const isCurrentlyActive = header.classList.contains('active');

      // TUTUP SEMUA FAQ YANG SEDANG TERBUKA (Efek Akordion Tunggal)
      faqHeaders.forEach(otherHeader => {
        otherHeader.classList.remove('active');
        if (otherHeader.nextElementSibling) {
          otherHeader.nextElementSibling.style.maxHeight = null;
        }
      });

      // JIKA YANG DIKLIK SEBELUMNYA TIDAK AKTIF, MAKA BUKA SEKARANG
      if (!isCurrentlyActive) {
        header.classList.add('active');
        // Gunakan scrollHeight agar tinggi animasi beradaptasi otomatis sesuai teks
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });
}

/**
 * 8. Animasi Efek Scroll Menggunakan Intersection Observer API
 */
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.scroll-animate');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => observer.observe(el));
  } else {
    animatedElements.forEach(el => el.classList.add('animated'));
  }
}
