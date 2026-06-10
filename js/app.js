/**
 * SolusiJoki.id - Core Application Script
 * Integrasi Kalkulator Biaya, Form Order, Akordion FAQ, dan Manajemen Tema
 * (Versi Asinkronus Modular - Bebas Bug)
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

// 2. Inisialisasi Aplikasi Saat DOM Siap (Menggunakan Async/Await agar Komponen Terisi Dulu)
document.addEventListener('DOMContentLoaded', async () => {
  // Muat komponen HTML eksternal terlebih dahulu ke placeholder masing-masing
  await loadComponent('navbar-placeholder', 'components/navbar.html');
  await loadComponent('footer-placeholder', 'components/footer.html');

  // Setelah komponen navbar & footer terpasang di DOM, baru aktifkan fiturnya
  initThemeToggle();
  initMobileNav();
  initPriceCalculator();
  initOrderForm();
  initFaqAccordion();
  initScrollAnimations();
});

// PERBAIKAN: Fungsi Pemuat Komponen HTML Modular (Fetch Engine)
async function loadComponent(placeholderId, componentPath) {
  const placeholder = document.getElementById(placeholderId);
  if (!placeholder) return; // Lewati jika halaman tidak butuh komponen ini (misal di payment.html)

  try {
    const response = await fetch(componentPath);
    if (!response.ok) throw new Error(`Gagal memuat: ${response.statusText}`);
    const htmlText = await response.text();
    placeholder.innerHTML = htmlText;
  } catch (error) {
    console.error(`Error loading ${componentPath}:`, error);
  }
}

/**
 * 3. Manajemen Tema (Light / Dark Mode)
 */
function initThemeToggle() {
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (!themeToggleBtn) return;

  const themeIcon = themeToggleBtn.querySelector('.material-symbols-outlined') || themeToggleBtn;

  function syncThemeVisual() {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      if (themeIcon) themeIcon.textContent = 'light_mode';
    } else {
      if (themeIcon) themeIcon.textContent = 'dark_mode';
    }
  }

  // Cek memori penyimpanan browser
  const savedTheme = localStorage.getItem('color-theme');
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('color-theme', 'light');
  }

  syncThemeVisual();

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
    mobileNavDrawer.classList.remove('translate-x-full'); // Menampilkan drawer Tailwind
    document.body.classList.add('overflow-hidden');
  };

  const closeDrawer = () => {
    mobileNavDrawer.classList.remove('open');
    mobileNavDrawer.classList.add('translate-x-full'); // Menyembunyikan drawer Tailwind
    document.body.classList.remove('overflow-hidden');
  };

  menuToggle.addEventListener('click', openDrawer);
  if (closeMenu) closeMenu.addEventListener('click', closeDrawer);

  const navLinks = mobileNavDrawer.querySelectorAll('a');
  navLinks.forEach(link => link.addEventListener('click', closeDrawer));
}

/**
 * 5. Logika Kalkulator Estimasi Biaya (Real-time)
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

    const basePrice = CONFIG.basePricePerPage[service] || 9000;
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

        const formService = document.getElementById('form-service');
        if (formService && calcService) {
          Array.from(formService.options).forEach(opt => {
            if (opt.value.toLowerCase().includes(calcService.value) || 
               (calcService.value === 'esai' && opt.value.toLowerCase().includes('esai'))) {
              opt.selected = true;
            }
          });
        }

        const formLevel = document.getElementById('form-level');
        if (formLevel && calcLevel) {
          Array.from(formLevel.options).forEach(opt => {
            if (opt.value.toLowerCase().includes(calcLevel.value)) {
              opt.selected = true;
            }
          });
        }

        const formDeadline = document.getElementById('form-deadline');
        if (formDeadline && calcDeadline) {
          const today = new Date();
          let addDays = 7;
          if (calcDeadline.value === 'kilat') addDays = 1;
          else if (calcDeadline.value === 'express') addDays = 3;
          today.setDate(today.getDate() + addDays);
          formDeadline.value = today.toISOString().split('T')[0];
        }
      }
    });
  }
}

/**
 * 6. Validasi & Pengiriman Formulir Pemesanan
 */
function initOrderForm() {
  const form = document.getElementById('order-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('form-name').value;
    const service = document.getElementById('form-service').value;
    const level = document.getElementById('form-level').value;
    const pages = document.getElementById('form-pages').value;
    const deadline = document.getElementById('form-deadline').value;
    const details = document.getElementById('form-details').value;

    // PERBAIKAN: Mengonversi tanggal deadline mentah menjadi format teks Indonesia yang rapi
    const formattedDate = formatDateString(deadline);

    const orderData = {
      name: name,
      service: service,
      level: level,
      pages: pages,
      rawDeadline: deadline, // Tambahan untuk kalkulasi harga deadline di payment.html
      formattedDeadline: formattedDate, // Sekarang terkirim cantik (contoh: "Selasa, 16 Juni 2026")
      details: details
    };

    sessionStorage.setItem('orderData', JSON.stringify(orderData));
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

// Fungsi Formatter Tanggal Indonesia
function formatDateString(dateString) {
  if (!dateString) return '';
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', options);
}

/**
 * 7. Kontrol Logika Buka-Tutup Akordion FAQ
 */
function initFaqAccordion() {
  const faqHeaders = document.querySelectorAll('.faq-header');

  faqHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const content = header.nextElementSibling;
      if (!content) return;
      const isCurrentlyActive = header.classList.contains('active');

      faqHeaders.forEach(otherHeader => {
        otherHeader.classList.remove('active');
        if (otherHeader.nextElementSibling) {
          otherHeader.nextElementSibling.style.maxHeight = null;
        }
      });

      if (!isCurrentlyActive) {
        header.classList.add('active');
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

// =========================================================================
// TALENT PORTFOLIO DATA GENERATOR (KHAS UNTUK HALAMAN TALENTS.HTML)
// =========================================================================
const TALENT_DATA = {
  'talent-1': {
    name: "Rian Hidayat, S.Kom.",
    badge: "IT & Soshum Specialist",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    projects: [
      "💻 Pembuatan Struktur Website Profile Organisasi Daerah berbasis Tailwind CSS (Mendapat Nilai Akhir A)",
      "📝 Penulisan Esai Analisis Ancaman Malware dan Kebocoran Data Nasional Pada Sektor Publik (Lolos Jurnal Kampus)",
      "📊 Resume Komparatif Kritis terhadap 5 Jurnal Internasional Bertopik Integrasi Big Data dalam Ekonomi Kreatif",
      "📚 Penyusunan Berkas Laporan Tugas Akhir Struktur Data & Query Optimasi Basis Data Relasional (PostgreSQL)"
    ]
  },
  'talent-2': {
    name: "Siti Aminah, S.H.",
    badge: "Hukum & Humaniora",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    projects: [
      "⚖️ Makalah Hukum Agraria: Penyelesaian Alternatif Kasus Sengketa Kepemilikan Atas Tanah Adat (Nilai 98/100)",
      "📄 Karya Tulis Analisis Yuridis Implementasi Undang-Undang Perlindungan Data Pribadi di Layanan E-Commerce",
      "🏛️ Penyusunan Berkas Pendapat Hukum (Legal Memorandum) Terkait Sengketa Ingkar Janji Kontrak Dagang Dagang",
      "👥 Esai Sosiologi Politik: Fenomena Pergeseran Budaya Musyawarah Menuju Media Sosial Pada Kelompok Mahasiswa"
    ]
  },
  'talent-3': {
    name: "Fajar Nugraha, M.Pd.",
    badge: "Edukasi & Bahasa",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    projects: [
      "📖 Resume Komprehensif Buku Filsafat Pendidikan Klasik & Modern Sejarah Perkembangan Global (Total 35 Halaman)",
      "🇬🇧 Penerjemahan + Parafrase Akurat Karya Tulis Ilmiah Jurnal Internasional Kedokteran Berbahasa Inggris Kuno",
      "📐 Penyusunan Dokumen Perangkat Pengajaran Rencana Pelaksanaan Pembelajaran (RPP) Berstandar Kurikulum Merdeka",
      "🖊️ Pembuatan Draf Penelitian Tindakan Kelas (PTK) Terkait Efektivitas Media Audio Visual Terhadap Pemahaman Siswa"
    ]
  }
};

function openPortfolio(talentKey) {
  const modal = document.getElementById('portfolio-modal');
  const data = TALENT_DATA[talentKey];

  if (!modal || !data) return;

  document.getElementById('modal-name').textContent = data.name;
  document.getElementById('modal-badge').textContent = data.badge;
  document.getElementById('modal-avatar').innerHTML = `<img src="${data.avatar}" class="w-full h-full object-cover">`;

  const listContainer = document.getElementById('modal-list');
  listContainer.innerHTML = '';

  data.projects.forEach(project => {
    const li = document.createElement('li');
    li.className = "flex gap-3 items-start p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700/50 text-sm leading-relaxed text-slate-700 dark:text-slate-300";
    li.textContent = project;
    listContainer.appendChild(li);
  });

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closePortfolio() {
  const modal = document.getElementById('portfolio-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

window.addEventListener('click', (e) => {
  const modal = document.getElementById('portfolio-modal');
  if (e.target === modal) {
    closePortfolio();
  }
});