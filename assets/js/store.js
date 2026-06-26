/* ============================================================
   자연꽃꿀 — 데이터 계층 (store.js)
   ★ 지금은 브라우저 localStorage에 저장합니다.
   ★ 나중에 실제 서버를 붙일 때, 이 파일의 함수 내부만
     fetch('/api/...') 형태로 바꾸면 화면 코드는 그대로 작동합니다.
   ============================================================ */
const DB = {
  KEY_PRODUCTS: 'hk_products',
  KEY_ORDERS:   'hk_orders',
  KEY_CART:     'hk_cart',
  KEY_ADMIN:    'hk_admin_session',

  // ---------- 내부 유틸 ----------
  _read(key, fallback){
    try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch(e){ return fallback; }
  },
  _write(key, val){
    try{ localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch(e){ console.warn('저장 실패(저장공간/시크릿모드)', e); return false; }
  },
  _id(prefix){ return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); },

  // ---------- 초기 데이터(임의 상품 2개) ----------
  seed(){
    if(localStorage.getItem(DB.KEY_PRODUCTS) !== null) return; // 이미 있으면 건너뜀
    const now = Date.now();
    const products = [
      {
        id: 'p_acacia_stick',
        name: '아카시아 꽃꿀 스틱',
        category: '스틱',
        emoji: '🍯',
        price: 38000,
        compareAt: 45000,
        stock: 40,
        status: 'on',           // on | soldout
        featured: true,
        spec: '15g × 60포 · 900g',
        desc: `봄 아카시아꽃에서 모은 맑고 향긋한 꽃꿀입니다.
한 포씩 톡 잘라 바로 즐기는 휴대용 스틱형.
사무실·여행·등산 어디서든 깔끔하게 드실 수 있어요.

· 이지컷 개별 포장 (15g × 60포)
· 설탕·물엿 무첨가, 국내산 100%
· 선물 박스 구성`,
        createdAt: now
      },
      {
        id: 'p_honeydew_tub',
        name: '감로꿀 (통)',
        category: '통꿀',
        emoji: '🫙',
        price: 72000,
        compareAt: 85000,
        stock: 15,
        status: 'on',
        featured: true,
        spec: '2.4kg · 가정용 대용량',
        desc: `참나무 수액에서 비롯된 진하고 깊은 풍미의 감로꿀.
일반 꽃꿀보다 색이 짙고 미네랄이 풍부한 귀한 꿀입니다.
온 가족이 두고두고 드시기 좋은 넉넉한 2.4kg 대용량.

· 원산지 국내산
· 밀폐 용기 포장
· 차·요리·빵 어디에나`,
        createdAt: now - 1000
      }
    ];
    DB._write(DB.KEY_PRODUCTS, products);
    DB._write(DB.KEY_ORDERS, []);
  },

  // ============ 상품 ============
  getProducts(){ return DB._read(DB.KEY_PRODUCTS, []); },
  getProduct(id){ return DB.getProducts().find(p => p.id === id) || null; },
  addProduct(data){
    const products = DB.getProducts();
    const p = Object.assign({
      id: DB._id('p'), name:'', category:'기타', emoji:'🍯',
      price:0, compareAt:0, stock:0, status:'on', featured:false,
      spec:'', desc:'', createdAt: Date.now()
    }, data);
    if(!p.id || products.find(x=>x.id===p.id)) p.id = DB._id('p');
    products.unshift(p);
    DB._write(DB.KEY_PRODUCTS, products);
    return p;
  },
  updateProduct(id, data){
    const products = DB.getProducts();
    const i = products.findIndex(p=>p.id===id);
    if(i<0) return null;
    products[i] = Object.assign({}, products[i], data, {id});
    DB._write(DB.KEY_PRODUCTS, products);
    return products[i];
  },
  deleteProduct(id){
    const products = DB.getProducts().filter(p=>p.id!==id);
    DB._write(DB.KEY_PRODUCTS, products);
  },

  // ============ 장바구니 ============
  getCart(){ return DB._read(DB.KEY_CART, []); },
  cartCount(){ return DB.getCart().reduce((s,i)=>s+i.qty,0); },
  addToCart(productId, qty){
    qty = Math.max(1, qty||1);
    const cart = DB.getCart();
    const ex = cart.find(i=>i.productId===productId);
    if(ex){ ex.qty += qty; }
    else { cart.push({ productId, qty }); }
    DB._write(DB.KEY_CART, cart);
    return DB.cartCount();
  },
  setCartQty(productId, qty){
    const cart = DB.getCart();
    const it = cart.find(i=>i.productId===productId);
    if(it){ it.qty = Math.max(1, qty); DB._write(DB.KEY_CART, cart); }
  },
  removeFromCart(productId){
    DB._write(DB.KEY_CART, DB.getCart().filter(i=>i.productId!==productId));
  },
  clearCart(){ DB._write(DB.KEY_CART, []); },
  // 장바구니를 상품정보와 합쳐서 반환
  getCartDetailed(){
    return DB.getCart().map(i=>{
      const p = DB.getProduct(i.productId);
      return p ? { ...i, product:p, lineTotal:p.price*i.qty } : null;
    }).filter(Boolean);
  },

  // ============ 주문 ============
  getOrders(){ return DB._read(DB.KEY_ORDERS, []); },
  getOrder(id){ return DB.getOrders().find(o=>o.id===id) || null; },
  createOrder(data){
    const orders = DB.getOrders();
    const order = Object.assign({
      id: DB._id('ORD'),
      orderNo: 'H' + new Date().toISOString().slice(2,10).replace(/-/g,'') + '-' + Math.floor(Math.random()*9000+1000),
      status: '주문접수',  // 주문접수 | 결제완료 | 배송준비 | 배송중 | 배송완료 | 취소
      items: [], buyer:{}, payMethod:'', total:0, shippingFee:0,
      tracking:'', memo:'', createdAt: Date.now()
    }, data);
    orders.unshift(order);
    DB._write(DB.KEY_ORDERS, orders);
    return order;
  },
  updateOrder(id, data){
    const orders = DB.getOrders();
    const i = orders.findIndex(o=>o.id===id);
    if(i<0) return null;
    orders[i] = Object.assign({}, orders[i], data, {id});
    DB._write(DB.KEY_ORDERS, orders);
    return orders[i];
  },

  // ============ 관리자 세션(임시) ============
  // 실제 운영 시 서버 인증으로 교체. 지금은 데모 비번.
  ADMIN_PW: 'honey1234',
  login(pw){ if(pw===DB.ADMIN_PW){ sessionStorage.setItem(DB.KEY_ADMIN,'1'); return true;} return false; },
  logout(){ sessionStorage.removeItem(DB.KEY_ADMIN); },
  isAdmin(){ return sessionStorage.getItem(DB.KEY_ADMIN)==='1'; }
};

// 공통 헬퍼
const won = n => (n||0).toLocaleString('ko-KR') + '원';
function toast(msg){
  let t = document.querySelector('.toast');
  if(!t){ t=document.createElement('div'); t.className='toast';
    t.innerHTML='<span class="ico">✓</span><span class="toast-msg"></span>'; document.body.appendChild(t); }
  t.querySelector('.toast-msg').textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastT);
  window.__toastT = setTimeout(()=>t.classList.remove('show'), 2200);
}
function updateCartBadge(){
  const el = document.querySelector('.cart-count');
  if(el){ const c = DB.cartCount(); el.textContent = c; el.style.display = c>0?'inline-flex':'none'; }
}
// 모바일 메뉴 토글 공통
function bindNavToggle(){
  const b=document.querySelector('.nav-toggle'), n=document.querySelector('.site-nav');
  if(b&&n){ b.addEventListener('click',()=>n.classList.toggle('open')); }
}

// 페이지 로드 시 시드 데이터 보장
DB.seed();
