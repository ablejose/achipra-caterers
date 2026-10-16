// Money: who the office must pay, shops not paid, customers still to pay, who buys the most.
import { A, esc, rs, fq, num, ymd, fdate, fstamp, icon, toast, openSheet, closeSheet, sheetHead, ask, field } from './ui.js';
import { get, list, put, removeMany, me, personName, people } from './store.js';
import { personMoney, shopCredit, orderValue, clientDue } from './calc.js';
import { billCard, balanceTag } from './v-orders.js';
import { render } from './app.js';

const ui = { period: 'month' };
const PERIODS = [['month', 'This month'], ['last', 'Last month'], ['year', 'This year'], ['all', 'All time']];

function periodRange(p) {
  const n = new Date();
  if (p === 'month') return [ymd(new Date(n.getFullYear(), n.getMonth(), 1)), ymd(new Date(n.getFullYear(), n.getMonth() + 1, 0))];
  if (p === 'last') return [ymd(new Date(n.getFullYear(), n.getMonth() - 1, 1)), ymd(new Date(n.getFullYear(), n.getMonth(), 0))];
  if (p === 'year') return [`${n.getFullYear()}-01-01`, `${n.getFullYear()}-12-31`];
  return ['0000-00-00', '9999-12-31'];
}
const dayOf = (ms) => (ms ? ymd(new Date(ms)) : '');

export function moneyView() {
  const [from, to] = periodRange(ui.period);
  const inP = (d) => d && d >= from && d <= to;
  const everyone = list('people').sort((a, b) => a.name.localeCompare(b.name));

  const balances = everyone.map((p) => ({ p, ...personMoney(p.id) }));
  const toPay = balances.filter((b) => Math.round(b.balance) > 0).sort((a, b) => b.balance - a.balance);
  const toReturn = balances.filter((b) => Math.round(b.balance) < 0).sort((a, b) => a.balance - b.balance);
  const officeBills = list('bills').filter((b) => !b.person && b.mode !== 'credit');

  const credits = shopCredit();
  const shops = [...new Set(credits.map((b) => b.shop || 'Shop (no name)'))]
    .map((s) => ({ shop: s, bills: credits.filter((b) => (b.shop || 'Shop (no name)') === s) }))
    .map((x) => ({ ...x, total: x.bills.reduce((t, b) => t + Number(b.amount || 0), 0) }))
    .sort((a, b) => b.total - a.total);

  const orders = list('orders');
  const dues = orders.filter((o) => orderValue(o) > 0 && Math.round(clientDue(o)) > 0).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const pOrders = orders.filter((o) => inP(o.date));
  const pBills = list('bills').filter((b) => inP(b.date || dayOf(b.createdAt)));
  const pLines = list('lines').filter((l) => l.bought && inP(dayOf(l.boughtAt)));

  const rank = everyone.map((p) => {
    const bills = pBills.filter((b) => b.person === p.id);
    return { p, amount: bills.reduce((t, b) => t + Number(b.amount || 0), 0), bills: bills.length, items: pLines.filter((l) => l.boughtBy === p.id).length };
  }).filter((r) => r.amount || r.items).sort((a, b) => b.amount - a.amount || b.items - a.items);
  const top = Math.max(1, ...rank.map((r) => r.amount));

  const sum = (arr, f) => arr.reduce((t, x) => t + f(x), 0);
  return {
    html: `
    <div class="page">
      <div class="page-head"><h1>Money</h1></div>

      <section class="card pad">
        <div class="group-head"><h3>Office has to pay</h3><b class="due-text">${rs(sum(toPay, (b) => b.balance))}</b></div>
        <p class="hint">Bills people paid from their own pocket, minus money already given to them.</p>
        ${toPay.map((b) => `<a class="person-row" href="#/person/${esc(b.p.id)}"><span><b>${esc(b.p.name)}</b><small class="muted">Spent ${rs(b.spent)} · Given ${rs(b.given)}</small></span>${balanceTag(b.balance)}</a>`).join('') || `<p class="ok-text">${icon('check')} Nobody is waiting for money.</p>`}
        ${toReturn.length ? `<h4 class="sub">Has extra money from office</h4>${toReturn.map((b) => `<a class="person-row" href="#/person/${esc(b.p.id)}"><span><b>${esc(b.p.name)}</b><small class="muted">Spent ${rs(b.spent)} · Given ${rs(b.given)}</small></span>${balanceTag(b.balance)}</a>`).join('')}` : ''}
        <button class="btn block" data-act="payment">${icon('rupee')} Give money / settle</button>
      </section>

      <section class="card pad">
        <div class="group-head"><h3>Shops not paid</h3><b class="${credits.length ? 'due-text' : ''}">${rs(sum(shops, (s) => s.total))}</b></div>
        ${shops.map((s) => `<details class="more shop"><summary><span><b>${esc(s.shop)}</b><small class="muted">${s.bills.length} bill${s.bills.length > 1 ? 's' : ''}</small></span><b class="due-text">${rs(s.total)}</b></summary>
          ${s.bills.map((b) => { const o = get('orders', b.orderId); return `<div class="person-row"><span><b>${rs(b.amount)}</b><small class="muted">${esc(o?.client || '')} · ${esc(personName(b.person))} · ${fstamp(b.createdAt)}</small></span><button class="btn sm" data-act="shopPaid" data-id="${esc(b.id)}">Mark paid</button></div>`; }).join('')}
        </details>`).join('') || `<p class="ok-text">${icon('check')} No pending shop credit.</p>`}
      </section>

      <section class="card pad">
        <div class="group-head"><h3>Customers still to pay</h3><b class="${dues.length ? 'due-text' : ''}">${rs(sum(dues, clientDue))}</b></div>
        ${dues.map((o) => `<a class="person-row" href="#/order/${esc(o.id)}/money"><span><b>${esc(o.client)}</b><small class="muted">${fdate(o.date)} · Total ${rs(orderValue(o))} · Advance ${rs(o.advance)}</small></span><b class="due-text">${rs(clientDue(o))}</b></a>`).join('') || `<p class="ok-text">${icon('check')} Nothing pending from customers.</p>`}
      </section>

      <div class="seg wrap" role="tablist">
        ${PERIODS.map(([k, label]) => `<button class="${ui.period === k ? 'on' : ''}" data-act="period" data-v="${k}">${label}</button>`).join('')}
      </div>

      <div class="stat-grid">
        <div class="stat"><span>Orders</span><b>${pOrders.length}</b></div>
        <div class="stat"><span>Plates</span><b>${fq(sum(pOrders, (o) => Number(o.plates) || 0))}</b></div>
        <div class="stat"><span>Order value</span><b>${rs(sum(pOrders, orderValue))}</b></div>
        <div class="stat"><span>Bills</span><b>${rs(sum(pBills, (b) => Number(b.amount) || 0))}</b></div>
      </div>

      <section class="card pad">
        <h3>${icon('star')} Who buys the most</h3>
        ${rank.map((r, i) => `<a class="rank" href="#/person/${esc(r.p.id)}">
          <span class="rank-n">${i + 1}</span>
          <span class="rank-body"><span class="rank-top"><b>${esc(r.p.name)}</b><b>${rs(r.amount)}</b></span>
            <span class="bar"><i style="width:${Math.round((r.amount / top) * 100)}%"></i></span>
            <small class="muted">${r.bills} bill${r.bills === 1 ? '' : 's'} · ${r.items} thing${r.items === 1 ? '' : 's'} ticked</small></span></a>`).join('') || '<p class="muted">No buying in this period.</p>'}
        ${officeBills.length ? `<p class="hint">Bills with no person's name (office paid): ${officeBills.length}</p>` : ''}
      </section>
    </div>`,
  };
}
A.period = (el) => { ui.period = el.dataset.v; render(); };

export function personView(id) {
  const p = get('people', id);
  if (!p) return { html: `<div class="page"><a class="back" href="#/money">${icon('back')} Money</a><div class="empty"><h2>Person not found</h2></div></div>` };
  const m = personMoney(id);
  const history = [
    ...m.bills.map((b) => ({ t: b.createdAt, kind: 'bill', b })),
    ...m.pays.map((x) => ({ t: x.createdAt, kind: 'pay', x })),
  ].sort((a, b) => b.t - a.t);
  const ticked = list('lines').filter((l) => l.bought && l.boughtBy === id).length;
  return {
    html: `
    <div class="page">
      <a class="back" href="#/money">${icon('back')} Money</a>
      <div class="order-head">
        <h1>${esc(p.name)}${id === me() ? ' <small class="muted">(this phone)</small>' : ''}</h1>
        <div class="oh-actions">
          ${p.phone ? `<a class="btn" href="tel:${esc(p.phone.replace(/\s/g, ''))}">${icon('phone')} Call</a>` : ''}
          <a class="btn" href="#/settings/people">${icon('edit')} Edit name</a>
        </div>
      </div>
      <section class="card pad balance-card ${Math.round(m.balance) > 0 ? 'due' : ''}">
        <span>${Math.round(m.balance) > 0 ? 'Office has to pay' : Math.round(m.balance) < 0 ? 'Has to return to office' : 'All settled'}</span>
        <b>${rs(Math.abs(m.balance))}</b>
        <div class="kv"><span>Paid from own pocket (bills)</span><b>${rs(m.spent)}</b></div>
        <div class="kv"><span>Money given by office</span><b>${rs(m.given)}</b></div>
        <div class="kv"><span>Things ticked as bought</span><b>${ticked}</b></div>
        <button class="btn big primary block" data-act="payment" data-p="${esc(id)}" ${Math.round(m.balance) > 0 ? `data-amt="${Math.round(m.balance)}"` : ''}>${icon('rupee')} ${Math.round(m.balance) > 0 ? 'Pay / settle' : 'Give money'}</button>
      </section>
      <h3 class="list-title">History</h3>
      <div class="cards">
        ${history.map((h) => h.kind === 'bill' ? billCard(h.b, { showOrder: true })
          : `<button class="card pay-card" data-act="payment" data-id="${esc(h.x.id)}">
              <span>${icon('rupee')}</span>
              <span class="grow"><b>Money given ${rs(h.x.amount)}</b><small class="muted">${fstamp(h.x.createdAt)}${h.x.orderId && get('orders', h.x.orderId) ? ' · ' + esc(get('orders', h.x.orderId).client) : ''}${h.x.note ? ' · ' + esc(h.x.note) : ''}</small></span>
            </button>`).join('') || '<div class="empty small"><p class="muted">Nothing yet.</p></div>'}
      </div>
    </div>`,
  };
}

// Give money to a person (advance before buying, or settling after).
export function paymentSheet({ orderId = '', id = '', person = '', amount = '' } = {}) {
  const old = id ? get('payments', id) : null;
  const p = old ? { ...old } : { orderId, person: person || '', amount };
  const recent = list('orders').sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 40);
  const s = openSheet(`
    ${sheetHead(old ? 'Money given' : 'Give money')}
    <form class="sheet-body form" id="payForm">
      <div class="field"><span class="label">To whom?</span>
        <div class="chips">${people().map((x) => `<label class="chip-radio"><input type="radio" name="person" value="${esc(x.id)}" ${x.id === p.person ? 'checked' : ''}><span>${esc(x.name)}</span></label>`).join('') || '<p class="muted">Add names in Settings first.</p>'}</div>
      </div>
      ${field('Amount (₹) *', `<input name="amount" type="number" inputmode="decimal" step="any" class="big-input" value="${esc(p.amount ?? '')}" required>`)}
      <div class="field"><span class="label">What is it for?</span>
        <div class="seg two-way">
          <label><input type="radio" name="kind" value="advance" ${p.kind !== 'settle' ? 'checked' : ''}><span>Advance for buying</span></label>
          <label><input type="radio" name="kind" value="settle" ${p.kind === 'settle' ? 'checked' : ''}><span>Paying back / settle</span></label>
        </div>
      </div>
      ${field('For which order', `<select name="orderId"><option value="">Not for one order</option>${recent.map((o) => `<option value="${esc(o.id)}" ${o.id === p.orderId ? 'selected' : ''}>${esc(o.client)} · ${fdate(o.date)}</option>`).join('')}</select>`)}
      ${field('Note', `<input name="note" value="${esc(p.note || '')}">`)}
      <p class="error" id="payErr" role="alert"></p>
      <button class="btn big primary block">Save</button>
      ${old ? '<button type="button" class="btn danger-text block" data-del>Delete this entry</button>' : ''}
    </form>`);
  const f = s.querySelector('#payForm');
  s.querySelector('[data-del]')?.addEventListener('click', async () => {
    if (await ask(`Delete money given ${rs(old.amount)} to ${personName(old.person)}?`, { ok: 'Yes, delete', danger: true })) {
      removeMany([['payments', old.id]]);
      toast('Deleted');
    }
  });
  f.onsubmit = (e) => {
    e.preventDefault();
    const err = s.querySelector('#payErr');
    const who = f.person?.value;
    const amt = num(f.amount.value);
    if (!who) { err.textContent = 'Choose the person.'; return; }
    if (!(amt > 0)) { err.textContent = 'Type the amount.'; f.amount.focus(); return; }
    Object.assign(p, { person: who, amount: amt, kind: f.kind.value, orderId: f.orderId.value, note: f.note.value.trim(), date: p.date || ymd() });
    put('payments', p);
    closeSheet();
    toast(`${rs(amt)} given to ${personName(who)}`, 'ok');
  };
}
A.payment = (el) => paymentSheet({ orderId: el.dataset.o || '', id: el.dataset.id || '', person: el.dataset.p || '', amount: el.dataset.amt || '' });

export async function markShopPaid(billId) {
  const b = get('bills', billId);
  if (!b) return;
  if (!(await ask(`Mark ${rs(b.amount)} to ${b.shop || 'the shop'} as paid?`, { ok: 'Yes, shop is paid' }))) return;
  put('bills', { ...b, shopPaid: true, shopPaidAt: Date.now() });
  toast('Marked as paid', 'ok');
}
A.shopPaid = (el) => markShopPaid(el.dataset.id);
