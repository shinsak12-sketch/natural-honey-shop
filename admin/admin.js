/* 관리자 공통 레이아웃 (admin.js) */
const A_LOGO = `<svg viewBox="0 0 40 40" fill="none"><path d="M20 2l15.6 9v18L20 38 4.4 29V11z" fill="#E8A317" fill-opacity=".25" stroke="#F6C453" stroke-width="1.6"/><ellipse cx="20" cy="20" rx="6" ry="8" fill="#F6C453"/><path d="M14 16h12M14 20h12M14 24h12" stroke="#241B12" stroke-width="1.3"/></svg>`;
const IC = {
  dash:'<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="12" width="7" height="9" rx="1.5" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="16" width="7" height="5" rx="1.5" stroke="currentColor" stroke-width="1.8"/></svg>',
  prod:'<svg viewBox="0 0 24 24" fill="none"><path d="M4 7l8-4 8 4v10l-8 4-8-4z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 7l8 4 8-4M12 11v10" stroke="currentColor" stroke-width="1.8"/></svg>',
  order:'<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
};
function adminGuard(){
  if(!DB.isAdmin()){ location.href='index.html'; return false; }
  return true;
}
function renderAdminShell(active){
  const nav = [
    {href:'dashboard.html',key:'dash',label:'대시보드',ic:IC.dash},
    {href:'products.html',key:'prod',label:'상품 관리',ic:IC.prod},
    {href:'orders.html',key:'order',label:'주문 관리',ic:IC.order},
  ].map(n=>`<a href="${n.href}" class="${active===n.key?'active':''}">${n.ic}${n.label}</a>`).join('');
  const sb = document.getElementById('sidebar-slot');
  sb.outerHTML = `
  <aside class="sidebar" id="sidebar">
    <div class="brand">${A_LOGO}<b>월악산 <span>꿀벌쉼터</span></b></div>
    <nav class="side-nav">${nav}</nav>
    <div class="side-foot">
      <a href="../index.html" target="_blank">↗ 쇼핑몰 보기</a>
      <a href="#" onclick="DB.logout();location.href='index.html';return false">로그아웃</a>
    </div>
  </aside>`;
  // 모바일바
  const mb = document.getElementById('mobilebar-slot');
  if(mb){ mb.outerHTML = `<div class="mobile-bar"><button onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button><b>월악산 꿀벌쉼터 관리자</b></div>`; }
}
function adminToast(msg){
  let t=document.querySelector('.toast');
  if(!t){t=document.createElement('div');t.className='toast';document.body.appendChild(t);}
  t.textContent=msg;t.classList.add('show');
  clearTimeout(window.__t);window.__t=setTimeout(()=>t.classList.remove('show'),2000);
}
