// ============================================================
// db.js — Neon PostgreSQL 연결 + 테이블 자동 생성 + 초기 시드
// 환경변수 DATABASE_URL (Neon 연결 문자열)이 필요합니다.
// ============================================================
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL 환경변수가 없습니다. Railway 환경변수에 Neon 연결 문자열을 넣어주세요.');
}

// URL이 없어도 import 단계에서 죽지 않도록 안전하게 초기화
export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// 테이블 생성 (없으면 만들고, 있으면 그대로 둠)
export async function initDb() {
  if (!sql) throw new Error('DATABASE_URL 미설정 — DB 초기화 건너뜀');
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      category    TEXT NOT NULL DEFAULT '기타',
      emoji       TEXT DEFAULT '🍯',
      price       INTEGER NOT NULL DEFAULT 0,
      compare_at  INTEGER NOT NULL DEFAULT 0,
      stock       INTEGER NOT NULL DEFAULT 0,
      status      TEXT NOT NULL DEFAULT 'on',
      featured    BOOLEAN NOT NULL DEFAULT false,
      spec        TEXT DEFAULT '',
      descr       TEXT DEFAULT '',
      created_at  BIGINT NOT NULL
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id            TEXT PRIMARY KEY,
      order_no      TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT '주문접수',
      items         JSONB NOT NULL DEFAULT '[]',
      buyer         JSONB NOT NULL DEFAULT '{}',
      pay_method    TEXT DEFAULT '',
      shipping_fee  INTEGER NOT NULL DEFAULT 0,
      total         INTEGER NOT NULL DEFAULT 0,
      tracking      TEXT DEFAULT '',
      memo          TEXT DEFAULT '',
      created_at    BIGINT NOT NULL
    )`;

  // 상품이 하나도 없으면 초기 상품 2개 시드
  const rows = await sql`SELECT COUNT(*)::int AS n FROM products`;
  if (rows[0].n === 0) {
    const now = Date.now();
    await sql`INSERT INTO products (id,name,category,emoji,price,compare_at,stock,status,featured,spec,descr,created_at)
      VALUES ('p_acacia_stick','아카시아 꽃꿀 스틱','스틱','🍯',38000,45000,40,'on',true,
        '15g × 60포 · 900g',
        ${'봄 아카시아꽃에서 모은 맑고 향긋한 꽃꿀입니다.\n한 포씩 톡 잘라 바로 즐기는 휴대용 스틱형.\n사무실·여행·등산 어디서든 깔끔하게 드실 수 있어요.\n\n· 이지컷 개별 포장 (15g × 60포)\n· 설탕·물엿 무첨가, 국내산 100%\n· 선물 박스 구성'},
        ${now})`;
    await sql`INSERT INTO products (id,name,category,emoji,price,compare_at,stock,status,featured,spec,descr,created_at)
      VALUES ('p_honeydew_tub','감로꿀 (통)','통꿀','🫙',72000,85000,15,'on',true,
        '2.4kg · 가정용 대용량',
        ${'참나무 수액에서 비롯된 진하고 깊은 풍미의 감로꿀.\n일반 꽃꿀보다 색이 짙고 미네랄이 풍부한 귀한 꿀입니다.\n온 가족이 두고두고 드시기 좋은 넉넉한 2.4kg 대용량.\n\n· 원산지 국내산\n· 밀폐 용기 포장\n· 차·요리·빵 어디에나'},
        ${now - 1000})`;
    console.log('✅ 초기 상품 2개 시드 완료');
  }
  console.log('✅ DB 초기화 완료');
}

// DB row(snake_case) → 프론트 형식(camelCase) 변환
export function productOut(r) {
  return {
    id: r.id, name: r.name, category: r.category, emoji: r.emoji,
    price: r.price, compareAt: r.compare_at, stock: r.stock,
    status: r.status, featured: r.featured, spec: r.spec,
    desc: r.descr, createdAt: Number(r.created_at)
  };
}
export function orderOut(r) {
  return {
    id: r.id, orderNo: r.order_no, status: r.status,
    items: r.items, buyer: r.buyer, payMethod: r.pay_method,
    shippingFee: r.shipping_fee, total: r.total,
    tracking: r.tracking, memo: r.memo, createdAt: Number(r.created_at)
  };
}
