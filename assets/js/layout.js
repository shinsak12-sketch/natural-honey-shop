/* ============================================================
   공통 헤더 / 푸터 (layout.js)
   각 페이지에서 renderHeader('active이름') 호출
   ============================================================ */
const LOGO_SVG = `<svg viewBox="0 0 40 40" fill="none">
  <path d="M20 2l15.6 9v18L20 38 4.4 29V11z" fill="#E8A317" fill-opacity=".25" stroke="#F6C453" stroke-width="1.6"/>
  <ellipse cx="20" cy="20" rx="6" ry="8" fill="#F6C453"/>
  <path d="M14 16h12M14 20h12M14 24h12" stroke="#241B12" stroke-width="1.3"/></svg>`;

function renderHeader(active){
  const links = [
    {href:'index.html', key:'home', label:'홈'},
    {href:'products.html', key:'products', label:'상품'},
    {href:'about.html', key:'about', label:'우리꿀 이야기'},
    {href:'faq.html', key:'faq', label:'자주 묻는 질문'},
  ];
  const nav = links.map(l=>`<a href="${l.href}" class="${active===l.key?'active':''}">${l.label}</a>`).join('');
  const html = `
  <header class="site-header">
    <a href="index.html" class="logo">${LOGO_SVG}<b>월악산 <span>꿀벌쉼터</span></b></a>
    <button class="nav-toggle" aria-label="메뉴">☰</button>
    <nav class="site-nav">
      ${nav}
      <a href="cart.html" class="cart-link ${active==='cart'?'active':''}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 7h14l-1.2 10a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8z" stroke="currentColor" stroke-width="1.7"/><path d="M9 7V5.5a3 3 0 016 0V7" stroke="currentColor" stroke-width="1.7"/></svg>
        장바구니 <span class="cart-count">0</span>
      </a>
    </nav>
  </header>`;
  document.getElementById('header-slot').innerHTML = html;
  bindNavToggle();
  updateCartBadge();
}

function renderFooter(){
  const html = `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="logo">${LOGO_SVG}<b style="color:var(--cream)">월악산 <span style="color:var(--honey-light)">꿀벌쉼터</span></b></a>
          <p>국내산 천연벌꿀 100%. 자연 그대로의 향기를 담아 정직하게 전합니다.</p>
        </div>
        <div class="footer-col">
          <h5>쇼핑</h5>
          <a href="products.html">전체 상품</a>
          <a href="cart.html">장바구니</a>
          <a href="order-lookup.html">주문 조회</a>
        </div>
        <div class="footer-col">
          <h5>안내</h5>
          <a href="about.html">우리꿀 이야기</a>
          <a href="faq.html">자주 묻는 질문</a>
          <a href="policy.html">배송·교환·환불</a>
        </div>
        <div class="footer-col">
          <h5>연락처</h5>
          <p>이성희 · 꿀벌쉼터</p>
          <a href="tel:01098593044">010-9859-3044</a>
          <p>상담 09:00 ~ 20:00</p>
          <a href="admin/index.html" style="opacity:.4">관리자</a>
        </div>
      </div>
      <div class="footer-legal">
        상호: 월악산 꿀벌쉼터 &nbsp;|&nbsp; 대표: 이성희 &nbsp;|&nbsp; 원산지: 국내산<br>
        ※ 사업자등록번호·통신판매업신고번호·주소 등은 온라인 정식 오픈 시 등록·표기됩니다.<br>
        © 2026 월악산 꿀벌쉼터. 건강한 단맛, 자연에서 온 그대로.
      </div>
    </div>
  </footer>`;
  document.getElementById('footer-slot').innerHTML = html;
}

// 상품 카드 공통 렌더 (목록/홈 공용)
function productCardHTML(p){
  const soldout = p.status==='soldout' || p.stock<=0;
  return `<article class="product-card">
    <a href="product.html?id=${p.id}" class="pc-media">
      ${(!soldout && p.compareAt>p.price)?'<span class="pc-badge">할인</span>':''}
      <span class="emoji">${p.emoji||'🍯'}</span>
      ${soldout?'<div class="pc-soldout">품절</div>':''}
    </a>
    <div class="pc-body">
      <div class="pc-cat">${p.category}</div>
      <a href="product.html?id=${p.id}"><h3 class="pc-name">${p.name}</h3></a>
      <p class="pc-desc">${p.spec||''}</p>
      <div class="pc-price"><span class="now">${won(p.price)}</span>${p.compareAt>p.price?`<span class="was">${won(p.compareAt)}</span>`:''}</div>
      <div class="pc-actions">
        <a href="product.html?id=${p.id}" class="btn btn-ghost btn-sm">자세히</a>
        <button class="btn btn-dark btn-sm" ${soldout?'disabled':''} onclick="quickAdd('${p.id}')">담기</button>
      </div>
    </div>
  </article>`;
}
function quickAdd(id){ DB.addToCart(id,1); updateCartBadge(); toast('장바구니에 담았습니다'); }
