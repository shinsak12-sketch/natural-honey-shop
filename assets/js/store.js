/* ============================================================
   월악산 꿀벌쉼터 — 데이터 계층 (store.js) [API 버전]
   백엔드(Railway) API를 호출합니다.
   장바구니/관리자세션은 브라우저에 보관(서버 불필요).
   ============================================================ */
const API_BASE = 'https://natural-honey-shop-production.up.railway.app';

const DB = {
  KEY_CART:  'hk_cart',
  KEY_ADMIN: 'hk_admin_token',

  // ---------- 내부 유틸 ----------
  _read(key, fallback){
    try{ const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch(e){ return fallback; }
  },
  _write(key, val){
    try{ localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch(e){ return false; }
  },
  async _fetch(path, opts={}){
    const headers = Object.assign({'Content-Type':'application/json'}, opts.headers||{});
    const token = sessionStorage.getItem(DB.KEY_ADMIN);
    if(token) headers['x-admin-token'] = token;
    const res = await fetch(API_BASE + path, { ...opts, headers });
    if(!res.ok){
      let msg = 'API 오류';
      try{ msg = (await res.json()).error || msg; }catch(e){}
      throw new Error(msg);
    }
    return res.status===204 ? null : res.json();
  },

  // ============ 상품 ============
  async getProducts(){ return DB._fetch('/api/products'); },
  async getProduct(id){
    try{ return await DB._fetch('/api/products/'+encodeURIComponent(id)); }
    catch(e){ return null; }
  },
  async addProduct(data){ return DB._fetch('/api/products', {method:'POST', body:JSON.stringify(data)}); },
  async updateProduct(id, data){ return DB._fetch('/api/products/'+encodeURIComponent(id), {method:'PUT', body:JSON.stringify(data)}); },
  async deleteProduct(id){ return DB._fetch('/api/products/'+encodeURIComponent(id), {method:'DELETE'}); },

  // ============ 장바구니 (브라우저 보관) ============
  getCart(){ return DB._read(DB.KEY_CART, []); },
  cartCount(){ return DB.getCart().reduce((s,i)=>s+i.qty,0); },
  addToCart(productId, qty){
    qty = Math.max(1, qty||1);
    const cart = DB.getCart();
    const ex = cart.find(i=>i.productId===productId);
    if(ex){ ex.qty += qty; } else { cart.push({ productId, qty }); }
    DB._write(DB.KEY_CART, cart);
    return DB.cartCount();
  },
  setCartQty(productId, qty){
    const cart = DB.getCart();
    const it = cart.find(i=>i.productId===productId);
    if(it){ it.qty = Math.max(1, qty); DB._write(DB.KEY_CART, cart); }
  },
  removeFromCart(productId){ DB._write(DB.KEY_CART, DB.getCart().filter(i=>i.productId!==productId)); },
  clearCart(){ DB._write(DB.KEY_CART, []); },
  // 장바구니 + 상품정보 합치기 (서버에서 최신 상품 조회)
  async getCartDetailed(){
    const cart = DB.getCart();
    if(!cart.length) return [];
    const all = await DB.getProducts();
    const map = {}; all.forEach(p=>map[p.id]=p);
    return cart.map(i=>{
      const p = map[i.productId];
      return p ? { ...i, product:p, lineTotal:p.price*i.qty } : null;
    }).filter(Boolean);
  },

  // ============ 주문 ============
  async createOrder(data){ return DB._fetch('/api/orders', {method:'POST', body:JSON.stringify(data)}); },
  async getOrders(){ return DB._fetch('/api/orders'); },               // 관리자
  async updateOrder(id, data){ return DB._fetch('/api/orders/'+encodeURIComponent(id), {method:'PUT', body:JSON.stringify(data)}); },
  async lookupOrder(orderNo, phone){
    try{ return await DB._fetch(`/api/orders/lookup?orderNo=${encodeURIComponent(orderNo)}&phone=${encodeURIComponent(phone)}`); }
    catch(e){ return null; }
  },

  // ============ 관리자 ============
  async login(pw){
    try{
      const r = await DB._fetch('/api/admin/login', {method:'POST', body:JSON.stringify({pw})});
      if(r.ok){ sessionStorage.setItem(DB.KEY_ADMIN, r.token); return true; }
      return false;
    }catch(e){ return false; }
  },
  logout(){ sessionStorage.removeItem(DB.KEY_ADMIN); },
  isAdmin(){ return !!sessionStorage.getItem(DB.KEY_ADMIN); }
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
function bindNavToggle(){
  const b=document.querySelector('.nav-toggle'), n=document.querySelector('.site-nav');
  if(b&&n){ b.addEventListener('click',()=>n.classList.toggle('open')); }
}
