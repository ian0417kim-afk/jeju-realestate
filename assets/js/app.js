/* ===========================
   제주 부동산 - Main JS
   수정: assets/js/app.js
=========================== */

'use strict';

// ── 전역 상태 ──
const App = {
  lang: 'ko',
  langData: {},
  config: {},
  listings: [],
  filtered: [],
  activeType: 'all',
  activeDeal: 'all',
  searchQuery: '',
  currentListing: null,
  sliderIndex: 0,
  lightboxIndex: 0,
};

// ── 초기화 ──
async function init() {
  try {
    const [langRes, configRes, listingsRes] = await Promise.all([
      fetch('data/lang.json'),
      fetch('data/config.json'),
      fetch('data/listings.json'),
    ]);
    App.langData = await langRes.json();
    App.config = await configRes.json();
    const listingsData = await listingsRes.json();
    App.listings = listingsData.listings;
    App.filtered = [...App.listings];

    // 저장된 언어 불러오기
    App.lang = localStorage.getItem('jeju_lang') || 'ko';

    applyLang();
    renderListings();
    bindEvents();
    handleHash();
  } catch (e) {
    console.error('데이터 로드 실패:', e);
  }
}

// ── 언어 적용 ──
function applyLang() {
  const t = App.langData[App.lang] || App.langData['ko'];

  // data-lang 속성이 있는 모든 요소 텍스트 교체
  document.querySelectorAll('[data-lang]').forEach(el => {
    const key = el.getAttribute('data-lang');
    if (t[key] !== undefined) el.textContent = t[key];
  });

  // placeholder
  document.querySelectorAll('[data-lang-ph]').forEach(el => {
    const key = el.getAttribute('data-lang-ph');
    if (t[key] !== undefined) el.placeholder = t[key];
  });

  // 언어 버튼 활성화
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === App.lang);
  });

  // 필터 버튼 텍스트 재설정
  renderFilterBtns();

  // 매물 다시 렌더
  if (App.listings.length) renderListings();

  // 상세 페이지가 열려 있으면 다시 렌더
  if (App.currentListing) renderDetail(App.currentListing);

  localStorage.setItem('jeju_lang', App.lang);
}

function t(key) {
  return (App.langData[App.lang] || App.langData['ko'])[key] || key;
}

// ── 가격 포맷 ──
function formatPrice(listing) {
  const deal = listing.deal;

  if (deal === '월세' || deal === '단기') {
    const dep = listing.monthly_deposit;
    const rent = listing.monthly_rent;
    if (App.lang === 'ko') {
      return `보증금 ${formatKRW(dep)} / 월 ${formatKRW(rent)}`;
    } else if (App.lang === 'en') {
      return `Deposit $${Math.round(dep * App.config.exchange.usd).toLocaleString()} / Mo. $${Math.round(rent * App.config.exchange.usd).toLocaleString()}`;
    } else {
      return `押金 ¥${Math.round(dep * App.config.exchange.cny).toLocaleString()} / 月 ¥${Math.round(rent * App.config.exchange.cny).toLocaleString()}`;
    }
  }

  const krw = listing.price_krw;
  if (!krw) return '-';

  if (App.lang === 'ko') return formatKRW(krw);
  if (App.lang === 'en') return `$${Math.round(krw * App.config.exchange.usd).toLocaleString()}`;
  if (App.lang === 'zh') return `¥${Math.round(krw * App.config.exchange.cny).toLocaleString()}`;
}

function formatKRW(n) {
  if (!n) return '0원';
  if (n >= 100000000) {
    const uk = Math.floor(n / 100000000);
    const man = Math.round((n % 100000000) / 10000);
    return man > 0 ? `${uk}억 ${man.toLocaleString()}만원` : `${uk}억원`;
  }
  return `${Math.round(n / 10000).toLocaleString()}만원`;
}

function formatPriceConverted(listing) {
  if (App.lang === 'ko') return '';
  const krw = listing.price_krw || listing.monthly_rent;
  if (!krw) return '';
  return `≈ ${formatKRW(krw)} (KRW 기준)`;
}

// ── 텍스트 다국어 ──
function getTitle(l) { return l[`title_${App.lang}`] || l.title_ko; }
function getLocation(l) { return l[`location_${App.lang}`] || l.location_ko; }
function getDesc(l) { return l[`desc_${App.lang}`] || l.desc_ko; }
function getDealLabel(deal) {
  const map = { '매매': t('deal_sale'), '전세': t('deal_jeonse'), '월세': t('deal_monthly'), '단기': t('deal_short') };
  return map[deal] || deal;
}
function getTypeLabel(type) {
  const map = {
    '아파트': t('filter_apt'), '원투룸': t('filter_oneroom'),
    '빌라연립': t('filter_villa'), '단독주택': t('filter_house'),
    '토지': t('filter_land'), '건물': t('filter_building'), '단기': t('filter_short'),
  };
  return map[type] || type;
}

// ── 필터 버튼 렌더 ──
function renderFilterBtns() {
  const typeMap = [
    ['all', t('filter_all')], ['아파트', t('filter_apt')],
    ['원투룸', t('filter_oneroom')], ['빌라연립', t('filter_villa')],
    ['단독주택', t('filter_house')], ['토지', t('filter_land')],
    ['건물', t('filter_building')], ['단기', t('filter_short')],
  ];
  const wrap = document.getElementById('typeBtns');
  if (!wrap) return;
  wrap.innerHTML = typeMap.map(([val, label]) =>
    `<button class="filter-btn${App.activeType === val ? ' active' : ''}" data-type="${val}">${label}</button>`
  ).join('');
  wrap.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      App.activeType = btn.dataset.type;
      applyFilter();
      renderFilterBtns();
    });
  });

  const dealMap = [
    ['all', t('filter_all')], ['매매', t('deal_sale')],
    ['전세', t('deal_jeonse')], ['월세', t('deal_monthly')], ['단기', t('deal_short')],
  ];
  const dealWrap = document.getElementById('dealBtns');
  if (!dealWrap) return;
  dealWrap.innerHTML = dealMap.map(([val, label]) =>
    `<button class="deal-btn${App.activeDeal === val ? ' active' : ''}" data-deal="${val}">${label}</button>`
  ).join('');
  dealWrap.querySelectorAll('.deal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      App.activeDeal = btn.dataset.deal;
      applyFilter();
      renderFilterBtns();
    });
  });
}

// ── 필터 적용 ──
function applyFilter() {
  App.filtered = App.listings.filter(l => {
    const typeMatch = App.activeType === 'all' || l.type === App.activeType;
    const dealMatch = App.activeDeal === 'all' || l.deal === App.activeDeal;
    const q = App.searchQuery.toLowerCase();
    const searchMatch = !q ||
      getTitle(l).toLowerCase().includes(q) ||
      getLocation(l).toLowerCase().includes(q) ||
      l.type.includes(q);
    return typeMatch && dealMatch && searchMatch;
  });
  renderListings();
}

// ── 매물 목록 렌더 ──
function renderListings() {
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;

  if (!App.filtered.length) {
    grid.innerHTML = `<div class="empty-state"><p style="font-size:2rem;margin-bottom:12px">🏠</p><p>${t('no_result')}</p></div>`;
    return;
  }

  grid.innerHTML = App.filtered.map(l => `
    <div class="listing-card" data-id="${l.id}" tabindex="0" role="button" aria-label="${getTitle(l)}">
      <div class="card-img-wrap">
        <img src="${l.images[0]}" alt="${getTitle(l)}" loading="lazy" width="640" height="480">
        <div class="card-badge">
          <span class="card-type">${getTypeLabel(l.type)}</span>
          <span class="tag tag-deal-${l.deal}">${getDealLabel(l.deal)}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="card-title">${getTitle(l)}</div>
        <div class="card-location">${getLocation(l)}</div>
        <div class="card-price">${formatPrice(l)}</div>
        <div class="card-meta">
          ${l.area_m2 ? `<span>📐 ${l.area_m2}㎡</span>` : ''}
          ${l.floor && l.floor !== '-' ? `<span>🏢 ${l.floor}</span>` : ''}
          ${l.built_year ? `<span>🗓 ${l.built_year}년</span>` : ''}
          ${l.parking ? `<span>🚗 주차가능</span>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.listing-card').forEach(card => {
    card.addEventListener('click', () => openDetail(parseInt(card.dataset.id)));
    card.addEventListener('keydown', e => { if (e.key === 'Enter') openDetail(parseInt(card.dataset.id)); });
  });
}

// ── 상세 페이지 ──
function openDetail(id) {
  const listing = App.listings.find(l => l.id === id);
  if (!listing) return;
  App.currentListing = listing;
  App.sliderIndex = 0;

  document.getElementById('listPage').style.display = 'none';
  document.getElementById('detailPage').style.display = 'block';
  window.scrollTo(0, 0);

  renderDetail(listing);
  history.pushState({ id }, '', `#listing-${id}`);
}

function renderDetail(listing) {
  const el = document.getElementById('detailPage');
  const cfg = App.config;
  const phone = cfg.contact.phone;
  const sms = cfg.contact.sms;
  const kakao = cfg.contact.kakao;

  el.innerHTML = `
    <div class="container" style="padding-top:88px; padding-bottom:60px">
      <button class="detail-back" id="backBtn">← ${t('back')}</button>

      <!-- 슬라이더 -->
      <div class="slider-wrap" id="sliderWrap">
        <div class="slider-track" id="sliderTrack">
          ${listing.images.map((img, i) => `
            <div class="slider-slide">
              <img src="${img}" alt="${getTitle(listing)} ${i+1}" loading="${i === 0 ? 'eager' : 'lazy'}" width="1200" height="800">
            </div>
          `).join('')}
        </div>
        ${listing.images.length > 1 ? `
          <button class="slider-arrow slider-prev" id="sliderPrev">&#8249;</button>
          <button class="slider-arrow slider-next" id="sliderNext">&#8250;</button>
          <div class="slider-dots" id="sliderDots">
            ${listing.images.map((_, i) => `<div class="slider-dot${i===0?' active':''}"></div>`).join('')}
          </div>
          <div class="slider-count"><span id="sliderCur">1</span>/${listing.images.length}</div>
        ` : ''}
      </div>

      <!-- 상세 레이아웃 -->
      <div class="detail-layout">
        <div class="detail-main">
          <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
            <span class="tag tag-deal-${listing.deal}">${getDealLabel(listing.deal)}</span>
            <span class="tag" style="background:var(--bg2);color:var(--text-light)">${getTypeLabel(listing.type)}</span>
          </div>
          <h1 class="detail-title">${getTitle(listing)}</h1>
          <p class="detail-location">📍 ${getLocation(listing)}</p>
          <div class="detail-price">${formatPrice(listing)}</div>
          ${App.lang !== 'ko' ? `<div class="detail-price-converted">${formatPriceConverted(listing)}</div>` : ''}

          <div class="detail-specs">
            ${listing.area_m2 ? `<div class="spec-item"><div class="spec-label">${t('detail_area')}</div><div class="spec-value">${listing.area_m2}㎡</div></div>` : ''}
            ${listing.floor && listing.floor !== '-' ? `<div class="spec-item"><div class="spec-label">${t('detail_floor')}</div><div class="spec-value">${listing.floor}</div></div>` : ''}
            ${listing.built_year ? `<div class="spec-item"><div class="spec-label">${t('detail_built')}</div><div class="spec-value">${listing.built_year}년</div></div>` : ''}
            <div class="spec-item"><div class="spec-label">${t('detail_parking')}</div><div class="spec-value">${listing.parking ? '✅ 가능' : '❌ 불가'}</div></div>
          </div>

          <h3 style="font-family:var(--font-serif);margin-bottom:12px;color:var(--primary-dark)">${t('detail_desc')}</h3>
          <p class="detail-desc">${getDesc(listing)}</p>
        </div>

        <!-- 사이드 문의 박스 -->
        <div>
          <div class="contact-box">
            <div class="contact-box-title">📞 ${t('contact_title')}</div>
            <div class="contact-btns">
              <a href="tel:${phone}" class="contact-btn contact-btn-phone">
                <span class="contact-btn-icon">📞</span>${t('contact_phone')} ${phone}
              </a>
              <a href="sms:${sms}" class="contact-btn contact-btn-sms">
                <span class="contact-btn-icon">💬</span>${t('contact_sms')}
              </a>
              <a href="${kakao}" target="_blank" rel="noopener" class="contact-btn contact-btn-kakao">
                <span class="contact-btn-icon">💛</span>${t('contact_kakao')}
              </a>
              <a href="#" class="contact-btn contact-btn-wechat" onclick="alert('WeChat ID: ${cfg.contact.wechat}'); return false;">
                <span class="contact-btn-icon">💚</span>${t('contact_wechat')}: ${cfg.contact.wechat}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // 뒤로가기
  document.getElementById('backBtn').addEventListener('click', closeDetail);

  // 슬라이더 이벤트
  if (listing.images.length > 1) {
    document.getElementById('sliderPrev').addEventListener('click', () => moveSlider(-1, listing.images.length));
    document.getElementById('sliderNext').addEventListener('click', () => moveSlider(1, listing.images.length));
  }

  // 슬라이더 터치 스와이프
  initSwipe('sliderWrap', listing.images.length);

  // 라이트박스
  document.getElementById('sliderWrap').addEventListener('click', e => {
    if (!e.target.closest('.slider-arrow')) {
      App.lightboxIndex = App.sliderIndex;
      openLightbox(listing.images);
    }
  });
}

// ── 슬라이더 ──
function moveSlider(dir, total) {
  App.sliderIndex = (App.sliderIndex + dir + total) % total;
  updateSlider(total);
}

function updateSlider(total) {
  const track = document.getElementById('sliderTrack');
  if (track) track.style.transform = `translateX(-${App.sliderIndex * 100}%)`;

  const dots = document.querySelectorAll('.slider-dot');
  dots.forEach((d, i) => d.classList.toggle('active', i === App.sliderIndex));

  const cur = document.getElementById('sliderCur');
  if (cur) cur.textContent = App.sliderIndex + 1;
}

function initSwipe(wrapperId, total) {
  const el = document.getElementById(wrapperId);
  if (!el) return;
  let startX = 0;
  el.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) moveSlider(diff > 0 ? 1 : -1, total);
  });
}

// ── 라이트박스 ──
function openLightbox(images) {
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  img.src = images[App.lightboxIndex];
  lb.classList.add('active');
  lb.dataset.total = images.length;
  lb.dataset.images = JSON.stringify(images);
}

function moveLightbox(dir) {
  const lb = document.getElementById('lightbox');
  const images = JSON.parse(lb.dataset.images);
  const total = images.length;
  App.lightboxIndex = (App.lightboxIndex + dir + total) % total;
  document.getElementById('lightboxImg').src = images[App.lightboxIndex];
}

// ── 상세 닫기 ──
function closeDetail() {
  document.getElementById('listPage').style.display = 'block';
  document.getElementById('detailPage').style.display = 'none';
  App.currentListing = null;
  history.pushState({}, '', window.location.pathname);
  window.scrollTo(0, 0);
}

// ── URL 해시 처리 ──
function handleHash() {
  const hash = window.location.hash;
  if (hash.startsWith('#listing-')) {
    const id = parseInt(hash.replace('#listing-', ''));
    if (!isNaN(id)) openDetail(id);
  }
}

// ── 이벤트 바인딩 ──
function bindEvents() {
  // 언어 버튼
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      App.lang = btn.dataset.lang;
      applyLang();
    });
  });

  // 검색
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      App.searchQuery = e.target.value;
      applyFilter();
    });
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') applyFilter();
    });
  }

  document.getElementById('searchBtn')?.addEventListener('click', applyFilter);

  // 라이트박스
  document.getElementById('lightboxClose')?.addEventListener('click', () => {
    document.getElementById('lightbox').classList.remove('active');
  });
  document.getElementById('lightboxPrev')?.addEventListener('click', () => moveLightbox(-1));
  document.getElementById('lightboxNext')?.addEventListener('click', () => moveLightbox(1));
  document.getElementById('lightbox')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('active');
  });

  // 키보드 ESC
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('lightbox')?.classList.remove('active');
      document.getElementById('mobileMenu')?.classList.remove('open');
    }
    if (e.key === 'ArrowLeft') moveLightbox(-1);
    if (e.key === 'ArrowRight') moveLightbox(1);
  });

  // 모바일 메뉴
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('mobileMenu')?.classList.add('open');
  });
  document.getElementById('mobileMenuClose')?.addEventListener('click', () => {
    document.getElementById('mobileMenu')?.classList.remove('open');
  });

  // 브라우저 뒤로가기
  window.addEventListener('popstate', () => {
    if (!window.location.hash) closeDetail();
    else handleHash();
  });

  // 헤더 스크롤 효과
  window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (header) header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

// ── 시작 ──
document.addEventListener('DOMContentLoaded', init);
