// Turning an order (menu + plates) into a buying list, and the money sums.
import { get, list } from './store.js';

export const GROUPS = ['Vegetables', 'Fruits', 'Coconut & Oil', 'Grocery', 'Dairy', 'Meat & Fish', 'Disposables', 'Gas & Fuel', 'Others'];
export const UNITS = ['kg', 'g', 'L', 'nos', 'pkt', 'bunch'];
export const groupRank = (g) => { const i = GROUPS.indexOf(g); return i === -1 ? GROUPS.length - 1 : i; };
export const allGroups = () => {
  const extra = new Set(list('items').map((i) => i.group).filter((g) => g && !GROUPS.includes(g)));
  return [...GROUPS.slice(0, -1), ...extra, 'Others'];
};

// Round up to amounts a shop can actually give.
export function roundQty(q, unit) {
  if (!(q > 0)) return 0;
  if (unit === 'nos' || unit === 'pkt' || unit === 'bunch') return Math.ceil(q - 1e-9);
  if (unit === 'g') return Math.ceil(q / 50 - 1e-9) * 50;
  if (q < 1) return Math.ceil(q * 20 - 1e-9) / 20;
  if (q < 10) return Math.ceil(q * 4 - 1e-9) / 4;
  return Math.ceil(q * 2 - 1e-9) / 2;
}

export const lineId = (orderId, itemId) => `${orderId}__${itemId}`;
export const orderLines = (orderId) => list('lines').filter((l) => l.orderId === orderId);
export const orderBills = (orderId) => list('bills').filter((b) => b.orderId === orderId).sort((a, b) => b.createdAt - a.createdAt);
export const orderPayments = (orderId) => list('payments').filter((p) => p.orderId === orderId).sort((a, b) => b.createdAt - a.createdAt);

export function buildList(order) {
  const map = new Map();
  const plates = Number(order.plates) || 0;
  for (const dishId of order.dishIds || []) {
    const dish = get('dishes', dishId);
    if (!dish) continue;
    for (const r of dish.recipe || []) {
      if (!r.item) continue;
      const m = map.get(r.item) || { itemId: r.item, raw: 0, dishes: [] };
      m.raw += (Number(r.q) || 0) * plates / 100;
      if (!m.dishes.includes(dish.name)) m.dishes.push(dish.name);
      map.set(r.item, m);
    }
  }
  // Items added by hand, and bought items whose dish was later removed, stay on the list.
  for (const l of orderLines(order.id)) {
    if (!map.has(l.itemId) && (l.extra || l.bought)) map.set(l.itemId, { itemId: l.itemId, raw: 0, dishes: [], extra: !!l.extra });
  }
  const rows = [];
  for (const m of map.values()) {
    const item = get('items', m.itemId) || { id: m.itemId, name: '(removed item)', unit: '', group: 'Others', rate: 0 };
    const line = get('lines', lineId(order.id, m.itemId)) || null;
    const calc = roundQty(m.raw, item.unit);
    const hasOwn = line && line.qty !== null && line.qty !== undefined && line.qty !== '';
    rows.push({
      key: lineId(order.id, m.itemId), orderId: order.id, item, calc,
      qty: hasOwn ? Number(line.qty) : calc, changed: hasOwn && Number(line.qty) !== calc,
      line, dishes: m.dishes, extra: m.extra || !!line?.extra,
      bought: !!line?.bought, skip: !!line?.skip, person: line?.person || '', boughtBy: line?.boughtBy || '',
    });
  }
  rows.sort((a, b) => groupRank(a.item.group) - groupRank(b.item.group) || a.item.name.localeCompare(b.item.name));
  return rows;
}

export function orderStats(order) {
  const rows = buildList(order).filter((r) => !r.skip);
  const bought = rows.filter((r) => r.bought).length;
  const bills = orderBills(order.id);
  const spent = bills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const est = rows.reduce((s, r) => s + r.qty * (Number(r.item.rate) || 0), 0);
  return { total: rows.length, bought, left: rows.length - bought, spent, est, bills: bills.length };
}

export const orderValue = (o) => (o.amount !== null && o.amount !== undefined && o.amount !== '' ? Number(o.amount) : (Number(o.plates) || 0) * (Number(o.rate) || 0));
export const clientDue = (o) => orderValue(o) - (Number(o.advance) || 0);

// Money a person spent from their own pocket (paid bills) minus money the office gave them.
// Positive = office must pay them. Negative = they must return money.
export function personMoney(personId, orderId) {
  const bills = list('bills').filter((b) => b.person === personId && (!orderId || b.orderId === orderId));
  const pays = list('payments').filter((p) => p.person === personId && (!orderId || p.orderId === orderId));
  const spent = bills.filter((b) => b.mode !== 'credit').reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const given = pays.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  return { spent, given, balance: spent - given, bills, pays };
}

export const shopCredit = (orderId) => list('bills').filter((b) => b.mode === 'credit' && !b.shopPaid && (!orderId || b.orderId === orderId));
