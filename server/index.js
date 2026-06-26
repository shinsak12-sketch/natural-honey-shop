// ============================================================
// index.js — 자연꽃꿀 상점 API 서버 (Express)
// ============================================================
import express from 'express';
import cors from 'cors';
import { sql, initDb, productOut, orderOut } from './db.js';

const app = express();
app.use(cors());                 // 프론트(Vercel 도메인)에서 호출 허용
app.use(express.json());

// 관리자 비밀번호 (Railway 환경변수 ADMIN_PW로 설정, 없으면 기본값)
const ADMIN_PW = process.env.ADMIN_PW || 'honey1234';

const rid = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// DB 연결 가드: DATABASE_URL 누락 시 명확한 안내
app.use('/api', (req, res, next) => {
  if (!sql && req.path !== '/health' && req.path !== '/admin/login') {
    return res.status(503).json({ error: 'DB 미연결: Railway에 DATABASE_URL(Neon 연결문자열)을 설정하세요.' });
  }
  next();
});

// 헬스체크
app.get('/', (req, res) => res.json({ ok: true, service: '자연꽃꿀 API' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ===================== 상품 =====================
app.get('/api/products', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM products ORDER BY created_at DESC`;
    res.json(rows.map(productOut));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM products WHERE id = ${req.params.id}`;
    if (!rows.length) return res.status(404).json({ error: '상품 없음' });
    res.json(productOut(rows[0]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', requireAdmin, async (req, res) => {
  try {
    const b = req.body;
    const id = b.id || rid('p');
    await sql`INSERT INTO products (id,name,category,emoji,price,compare_at,stock,status,featured,spec,descr,created_at)
      VALUES (${id}, ${b.name||''}, ${b.category||'기타'}, ${b.emoji||'🍯'},
        ${b.price||0}, ${b.compareAt||0}, ${b.stock||0}, ${b.status||'on'},
        ${!!b.featured}, ${b.spec||''}, ${b.desc||''}, ${Date.now()})`;
    const rows = await sql`SELECT * FROM products WHERE id = ${id}`;
    res.json(productOut(rows[0]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    const b = req.body, id = req.params.id;
    await sql`UPDATE products SET
      name=${b.name}, category=${b.category}, emoji=${b.emoji||'🍯'},
      price=${b.price||0}, compare_at=${b.compareAt||0}, stock=${b.stock||0},
      status=${b.status||'on'}, featured=${!!b.featured}, spec=${b.spec||''}, descr=${b.desc||''}
      WHERE id=${id}`;
    const rows = await sql`SELECT * FROM products WHERE id = ${id}`;
    if (!rows.length) return res.status(404).json({ error: '상품 없음' });
    res.json(productOut(rows[0]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  try {
    await sql`DELETE FROM products WHERE id = ${req.params.id}`;
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===================== 주문 =====================
// 주문 생성 (손님)
app.post('/api/orders', async (req, res) => {
  try {
    const b = req.body;
    const id = rid('ORD');
    const orderNo = 'H' + new Date().toISOString().slice(2,10).replace(/-/g,'') + '-' + Math.floor(Math.random()*9000+1000);
    await sql`INSERT INTO orders (id,order_no,status,items,buyer,pay_method,shipping_fee,total,tracking,memo,created_at)
      VALUES (${id}, ${orderNo}, '주문접수',
        ${JSON.stringify(b.items||[])}, ${JSON.stringify(b.buyer||{})},
        ${b.payMethod||''}, ${b.shippingFee||0}, ${b.total||0}, '', '', ${Date.now()})`;
    const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
    res.json(orderOut(rows[0]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 주문 조회 (손님: 주문번호+연락처)
app.get('/api/orders/lookup', async (req, res) => {
  try {
    const { orderNo, phone } = req.query;
    const rows = await sql`SELECT * FROM orders WHERE order_no = ${orderNo}`;
    const o = rows[0];
    if (!o) return res.status(404).json({ error: '주문 없음' });
    const clean = (s) => (s||'').replace(/-/g,'');
    if (clean(o.buyer.phone) !== clean(phone)) return res.status(404).json({ error: '주문 없음' });
    res.json(orderOut(o));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 전체 주문 (관리자)
app.get('/api/orders', requireAdmin, async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
    res.json(rows.map(orderOut));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 주문 상태/송장 변경 (관리자)
app.put('/api/orders/:id', requireAdmin, async (req, res) => {
  try {
    const b = req.body, id = req.params.id;
    await sql`UPDATE orders SET
      status = COALESCE(${b.status}, status),
      tracking = COALESCE(${b.tracking}, tracking)
      WHERE id = ${id}`;
    const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
    if (!rows.length) return res.status(404).json({ error: '주문 없음' });
    res.json(orderOut(rows[0]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===================== 관리자 인증 =====================
app.post('/api/admin/login', (req, res) => {
  if (req.body?.pw === ADMIN_PW) return res.json({ ok: true, token: ADMIN_PW });
  res.status(401).json({ ok: false, error: '비밀번호가 올바르지 않습니다' });
});

// 간단 관리자 보호 미들웨어
// (실서비스라면 JWT 등으로 강화. 지금은 헤더의 토큰=비밀번호 일치 확인)
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token === ADMIN_PW) return next();
  res.status(401).json({ error: '관리자 인증 필요' });
}

// ===================== 시작 =====================
const PORT = process.env.PORT || 3000;
initDb()
  .then(() => app.listen(PORT, () => console.log(`🍯 자연꽃꿀 API 실행 중 :${PORT}`)))
  .catch((e) => { console.error('DB 초기화 실패:', e); app.listen(PORT, () => console.log(`⚠️ DB 없이 :${PORT}`)); });
