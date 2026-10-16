// Orders list, new/edit order, and one order's screens: To buy, Bills, Money, Dishes.
import { A, esc, rs, fq, num, ymd, fdate, ftime, dayLabel, fstamp, icon, toast, openSheet, closeSheet, sheetHead, ask, field, compressImage, shareText } from './ui.js';
import { get, list, put, putMany, removeMany, uid, me, personName, people, settings, queuePhoto, photoSrc } from './store.js';
import { buildList, orderStats, orderBills, orderPayments, orderLines, lineId, orderValue, clientDue, personMoney, shopCredit, allGroups, UNITS, groupRank } from './calc.js';
import { pickPerson } from './pick.js';
import { render } from './app.js';

const ui = { seg: 'upcoming', filter: {} };

const notFound = (what = 'This order') => ({ html: `<div class="page"><a class="back" href="#/orders">${icon('back')} All orders</a><div class="empty"><h2>${what} was not found</h2><p class="muted">It may have been deleted on another phone.</p></div></div>` });
const menuName = (o) => get('menus', o.menuId)?.name || o.menuName || 'Custom menu';
const personChips = (name, current, { none } = {}) => `
  <div class="chips">
    ${people().map((p) => `<label class="chip-radio"><input type="radio" name="${name}" value="${esc(p.id)}" ${p.id === current ? 'checked' : ''}><span>${esc(p.name)}${p.id === me() ? ' (me)' : ''}</span></label>`).join('')}
    ${none ? `<label class="chip-radio"><input type="radio" name="${name}" value="" ${!current ? 'checked' : ''}><span>${esc(none)}</span></label>` : ''}
  </div>`;

// =====================================================================
// Orders list
// =====================================================================
export function ordersView() {
  const t = ymd();
  const all = list('orders');
  const key = (o) => (o.date || '') + (o.time || '');
  const up = all.filter((o) => (o.date || '') >= t).sort((a, b) => key(a).localeCompare(key(b)));
  const past = all.filter((o) => (o.date || '') < t).sort((a, b) => key(b).localeCompare(key(a)));
  const shown = ui.seg === 'past' ? past : up;
  return {
    html: `
    <div class="page">
      <div class="page-head"><h1>Orders</h1></div>
      <a class="btn big primary block" href="#/new">${icon('plus')} New order</a>
      <div class="seg" role="tablist">
        <button class="${ui.seg !== 'past' ? 'on' : ''}" data-act="ordersSeg" data-v="upcoming">Coming up <b>${up.length}</b></button>
        <button class="${ui.seg === 'past' ? 'on' : ''}" data-act="ordersSeg" data-v="past">Finished <b>${past.length}</b></button>
      </div>
      ${all.length > 6 ? `<label class="search">${icon('search')}<input type="search" id="orderSearch" placeholder="Search name, place, phone" aria-label="Search orders"></label>` : ''}
      <div class="cards" id="orderCards">
        ${shown.map(orderCard).join('') || `<div class="empty"><h2>${ui.seg === 'past' ? 'No finished orders yet' : 'No orders coming up'}</h2><p class="muted">Tap “New order” when a booking comes in.</p></div>`}
      </div>
    </div>`,
    mount(v) {
      const s = v.querySelector('#orderSearch');
      if (s) s.oninput = () => {
        const q = s.value.trim().toLowerCase();
        v.querySelectorAll('.order-card').forEach((c) => { c.hidden = q && !c.dataset.s.includes(q); });
      };
    },
  };
}
A.ordersSeg = (el) => { ui.seg = el.dataset.v; render(); };

function orderCard(o) {
  const st = orderStats(o);
  const pct = st.total ? Math.round((st.bought / st.total) * 100) : 0;
  const dl = dayLabel(o.date);
  return `
    <a class="card order-card" href="#/order/${esc(o.id)}" data-s="${esc([o.client, o.venue, o.phone, menuName(o)].join(' ').toLowerCase())}">
      <div class="oc-date"><b>${fdate(o.date)}</b>${o.time ? ' · ' + ftime(o.time) : ''}${dl ? ` <span class="chip ${dl === 'Today' || dl === 'Tomorrow' ? 'dark' : ''}">${dl}</span>` : ''}</div>
      <div class="oc-title">${esc(o.client || 'No name')}</div>
      <div class="oc-sub">${esc(menuName(o))} · <b>${fq(o.plates)} plates</b>${o.venue ? ' · ' + esc(o.venue) : ''}</div>
      <div class="bar" aria-hidden="true"><i style="width:${pct}%"></i></div>
      <div class="oc-foot"><span>${st.total ? (st.left ? `<b>${st.left}</b> left to buy of ${st.total}` : `${icon('check')} All ${st.total} bought`) : 'No dishes yet'}</span><span>${st.bills ? `Bills ${rs(st.spent)}` : ''}</span></div>
    </a>`;
}

// =====================================================================
// New / edit order
// =====================================================================
export function orderForm(id) {
  const o = id ? get('orders', id) : null;
  if (id && !o) return notFound();
  const menus = list('menus').sort((a, b) => (a.sort ?? 99) - (b.sort ?? 99) || a.name.localeCompare(b.name));
  const first = menus[0];
  const d = o || { date: ymd(), time: '', plates: '', menuId: first?.id || '', dishIds: first ? [...first.dishIds] : [], rate: first?.rate || '', advance: '' };
  const state = { menuId: d.menuId, dishes: new Set(d.dishIds || []) };

  return {
    live: false,
    html: `
    <div class="page">
      <a class="back" href="${o ? `#/order/${esc(o.id)}` : '#/orders'}">${icon('back')} ${o ? 'Back to order' : 'All orders'}</a>
      <h1>${o ? 'Edit order' : 'New order'}</h1>
      <form id="orderForm" class="form" novalidate>
        <section class="card pad">
          <h3>Customer</h3>
          ${field('Customer name *', `<input name="client" value="${esc(d.client || '')}" required autocomplete="off">`)}
          ${field('Phone', `<input name="phone" type="tel" inputmode="tel" value="${esc(d.phone || '')}" autocomplete="off">`)}
          <div class="two">
            ${field('Date *', `<input name="date" type="date" value="${esc(d.date || '')}" required>`)}
            ${field('Time', `<input name="time" type="time" value="${esc(d.time || '')}">`)}
          </div>
          ${field('Place / venue', `<input name="venue" value="${esc(d.venue || '')}" autocomplete="off">`)}
        </section>

        <section class="card pad">
          <h3>Food type</h3>
          <div class="menu-pick">
            ${menus.map((m) => `<label class="menu-opt"><input type="radio" name="menuId" value="${esc(m.id)}" ${m.id === d.menuId ? 'checked' : ''}>
              <span><b>${esc(m.name)}</b><small>${m.dishIds.length} dishes${m.rate ? ` · ${rs(m.rate)} a plate` : ''}</small></span></label>`).join('')}
          </div>
          <div class="field"><span class="label">Number of plates *</span>
            <div class="stepper">
              <button type="button" class="btn" data-step="-50" aria-label="50 less">−50</button>
              <input name="plates" type="number" inputmode="numeric" min="1" value="${esc(d.plates || '')}" placeholder="0" required>
              <button type="button" class="btn" data-step="50" aria-label="50 more">+50</button>
            </div>
          </div>
        </section>

        <section class="card pad">
          <h3>Dishes <span class="muted" id="dishCount"></span></h3>
          <p class="hint">Ticked dishes go into the buying list. Untick what the customer does not want.</p>
          <div id="dishBox"></div>
        </section>

        <section class="card pad">
          <h3>Money from customer</h3>
          <div class="two">
            ${field('Rate a plate (₹)', `<input name="rate" type="number" inputmode="decimal" value="${esc(d.rate ?? '')}">`)}
            ${field('Total amount (₹)', `<input name="amount" type="number" inputmode="decimal" value="${esc(d.amount ?? '')}" placeholder="Auto">`, 'Leave empty to use plates × rate')}
          </div>
          ${field('Advance received (₹)', `<input name="advance" type="number" inputmode="decimal" value="${esc(d.advance ?? '')}">`)}
        </section>

        <section class="card pad">
          ${field('Notes', `<textarea name="notes" rows="3" placeholder="Anything special for this order">${esc(d.notes || '')}</textarea>`)}
        </section>

        <p class="error" id="formErr" role="alert"></p>
        <div class="save-bar">
          <a class="btn big" href="${o ? `#/order/${esc(o.id)}` : '#/orders'}">Cancel</a>
          <button class="btn big primary">${o ? 'Save changes' : 'Save order'}</button>
        </div>
        ${o ? `<button type="button" class="btn danger-text block" data-act="deleteOrder" data-id="${esc(o.id)}">${icon('trash')} Delete this order</button>` : ''}
      </form>
    </div>`,
    mount(v) {
      const form = v.querySelector('#orderForm');
      const box = v.querySelector('#dishBox');
      const drawDishes = () => {
        const menu = get('menus', state.menuId);
        const inMenu = new Set([...(menu?.dishIds || []), ...state.dishes]);
        const dishes = list('dishes').sort((a, b) => (a.cat || '').localeCompare(b.cat || '') || a.name.localeCompare(b.name));
        const row = (x) => `<label class="check-row"><input type="checkbox" value="${esc(x.id)}" ${state.dishes.has(x.id) ? 'checked' : ''}><span>${esc(x.name)}${x.ml ? ` <small class="ml">${esc(x.ml)}</small>` : ''}</span></label>`;
        const main = dishes.filter((x) => inMenu.has(x.id));
        const more = dishes.filter((x) => !inMenu.has(x.id));
        box.innerHTML = `
          <div class="check-list">${main.map(row).join('') || '<p class="muted">Choose a food type above.</p>'}</div>
          ${more.length ? `<details class="more"><summary>Add other dishes (${more.length})</summary><div class="check-list">${more.map(row).join('')}</div></details>` : ''}`;
        v.querySelector('#dishCount').textContent = `(${state.dishes.size} ticked)`;
      };
      drawDishes();
      box.addEventListener('change', (e) => {
        if (e.target.type !== 'checkbox') return;
        if (e.target.checked) state.dishes.add(e.target.value); else state.dishes.delete(e.target.value);
        v.querySelector('#dishCount').textContent = `(${state.dishes.size} ticked)`;
      });
      form.querySelectorAll('input[name=menuId]').forEach((r) => r.addEventListener('change', () => {
        const prev = get('menus', state.menuId);
        const m = get('menus', r.value);
        state.menuId = r.value;
        state.dishes = new Set(m?.dishIds || []);
        if (!form.rate.value || num(form.rate.value) === num(prev?.rate)) form.rate.value = m?.rate || '';
        drawDishes();
        toast(`Dishes set for ${m?.name}`);
      }));
      form.querySelectorAll('[data-step]').forEach((b) => { b.onclick = () => { form.plates.value = Math.max(0, num(form.plates.value) + Number(b.dataset.step)) || ''; }; });
      form.onsubmit = (e) => {
        e.preventDefault();
        const err = v.querySelector('#formErr');
        const f = Object.fromEntries(new FormData(form).entries());
        if (!f.client.trim()) { err.textContent = 'Please type the customer name.'; form.client.focus(); return; }
        if (!f.date) { err.textContent = 'Please choose the date.'; form.date.focus(); return; }
        if (!(num(f.plates) > 0)) { err.textContent = 'Please type the number of plates.'; form.plates.focus(); return; }
        const menu = get('menus', state.menuId);
        const rec = {
          ...(o || {}), client: f.client.trim(), phone: f.phone.trim(), date: f.date, time: f.time, venue: f.venue.trim(),
          menuId: state.menuId, menuName: menu?.name || '', plates: num(f.plates), dishIds: [...state.dishes],
          rate: f.rate === '' ? '' : num(f.rate), amount: f.amount === '' ? '' : num(f.amount), advance: f.advance === '' ? '' : num(f.advance),
          notes: f.notes.trim(),
        };
        const saved = put('orders', rec);
        toast(o ? 'Order saved' : 'Order added. Here is the buying list.');
        location.hash = `#/order/${saved.id}`;
      };
    },
  };
}

A.deleteOrder = async (el) => {
  const o = get('orders', el.dataset.id);
  if (!o) return;
  const ok = await ask(`Delete the order for ${o.client}?`, { ok: 'Yes, delete it', danger: true, detail: 'Its buying list, bills and money entries will also be deleted. This cannot be undone.' });
  if (!ok) return;
  removeMany([
    ['orders', o.id],
    ...orderLines(o.id).map((l) => ['lines', l.id]),
    ...orderBills(o.id).map((b) => ['bills', b.id]),
    ...orderPayments(o.id).map((p) => ['payments', p.id]),
  ]);
  toast('Order deleted');
  location.hash = '#/orders';
};

// =====================================================================
// One order
// =====================================================================
export function orderView(id, tab) {
  const o = get('orders', id);
  if (!o) return notFound();
  const st = orderStats(o);
  const dl = dayLabel(o.date);
  const tabs = [['list', 'To buy', st.left ? String(st.left) : ''], ['bills', 'Bills', st.bills ? String(st.bills) : ''], ['money', 'Money', ''], ['dishes', 'Dishes', '']];
  const body = tab === 'bills' ? billsTab(o) : tab === 'money' ? moneyTab(o) : tab === 'dishes' ? dishesTab(o) : listTab(o, st);
  return {
    html: `
    <div class="page">
      <a class="back" href="#/orders">${icon('back')} All orders</a>
      <div class="order-head">
        <h1>${esc(o.client)}</h1>
        <div class="oh-line"><b>${fdate(o.date, true)}</b>${o.time ? ' · ' + ftime(o.time) : ''}${dl ? ` <span class="chip ${dl === 'Today' || dl === 'Tomorrow' ? 'dark' : ''}">${dl}</span>` : ''}</div>
        <div class="oh-line">${esc(menuName(o))} · <b>${fq(o.plates)} plates</b></div>
        ${o.venue ? `<div class="oh-line muted">${esc(o.venue)}</div>` : ''}
        <div class="oh-actions">
          ${o.phone ? `<a class="btn" href="tel:${esc(o.phone.replace(/\s/g, ''))}">${icon('phone')} Call</a>` : ''}
          <a class="btn" href="#/order/${esc(o.id)}/edit">${icon('edit')} Edit order</a>
        </div>
      </div>
      <nav class="tabs" role="tablist">
        ${tabs.map(([k, label, n]) => `<a href="#/order/${esc(o.id)}/${k}" class="${tab === k ? 'on' : ''}" role="tab" aria-selected="${tab === k}">${label}${n ? ` <b>${n}</b>` : ''}</a>`).join('')}
      </nav>
      ${body}
    </div>`,
  };
}

// ---------- To buy ----------
function listTab(o, st) {
  const rows = buildList(o);
  const active = rows.filter((r) => !r.skip);
  const skipped = rows.filter((r) => r.skip);
  const mine = me();
  const f = ui.filter[o.id] || 'all';
  const pass = {
    all: () => true,
    left: (r) => !r.bought,
    mine: (r) => r.person === mine || r.boughtBy === mine,
    free: (r) => !r.bought && !r.person,
  }[f] || (() => true);
  const vis = active.filter(pass);
  const groups = [...new Set(vis.map((r) => r.item.group || 'Others'))];
  const pct = st.total ? Math.round((st.bought / st.total) * 100) : 0;
  const filters = [['all', 'All'], ['left', 'Not bought'], ...(mine ? [['mine', `Mine (${personName(mine)})`]] : []), ['free', 'No name yet']];

  if (!rows.length) {
    return `<div class="empty"><h2>No dishes in this order</h2><p class="muted">Edit the order and tick the dishes. The buying list is made from them.</p>
      <a class="btn big primary" href="#/order/${esc(o.id)}/edit">Choose dishes</a></div>`;
  }
  return `
    <div class="progress card pad">
      <div class="progress-top"><span><b>${st.bought}</b> of ${st.total} bought</span><span class="muted">${st.est ? 'Estimate ' + rs(st.est) : ''}</span></div>
      <div class="bar big" aria-hidden="true"><i style="width:${pct}%"></i></div>
    </div>
    <div class="filter-row" role="group" aria-label="Show">
      ${filters.map(([k, label]) => `<button class="pill ${f === k ? 'on' : ''}" data-act="listFilter" data-o="${esc(o.id)}" data-v="${k}">${esc(label)}</button>`).join('')}
    </div>
    <div class="list-tools">
      <button class="btn" data-act="shareList" data-o="${esc(o.id)}">${icon('share')} Send list</button>
      <button class="btn" data-act="addItem" data-o="${esc(o.id)}">${icon('plus')} Add item</button>
    </div>
    ${groups.map((g) => {
      const gr = vis.filter((r) => (r.item.group || 'Others') === g);
      const done = gr.filter((r) => r.bought).length;
      return `
      <section class="group">
        <div class="group-head">
          <h3>${esc(g)} <span class="muted">${done}/${gr.length}</span></h3>
          ${done < gr.length ? `<button class="btn sm" data-act="giveGroup" data-o="${esc(o.id)}" data-g="${esc(g)}">${icon('user')} Give all to…</button>` : ''}
        </div>
        <div class="rows">${gr.map(rowHtml).join('')}</div>
      </section>`;
    }).join('') || `<div class="empty small"><p class="muted">${f === 'mine' ? 'Nothing is given to you yet.' : f === 'left' ? 'Everything is bought. 🎉' : 'Nothing here.'}</p></div>`}
    ${skipped.length ? `<details class="more card pad"><summary>Not needed / have in stock (${skipped.length})</summary><div class="rows">${skipped.map(rowHtml).join('')}</div></details>` : ''}
  `;
}

function rowHtml(r) {
  const meta = r.skip ? '<span class="who none">Not needed</span>'
    : r.bought ? `<span class="who ok">${icon('check')} ${esc(personName(r.boughtBy) || 'Bought')}</span>`
    : r.person ? `<span class="who">${icon('user')} ${esc(personName(r.person))}</span>`
    : '<span class="who none">No name yet</span>';
  return `
    <div class="row ${r.bought ? 'done' : ''} ${r.skip ? 'skip' : ''}">
      ${r.skip ? '<span class="tick ghost"></span>' : `<button class="tick ${r.bought ? 'on' : ''}" data-act="tick" data-o="${esc(r.orderId)}" data-i="${esc(r.item.id)}" aria-pressed="${r.bought}" aria-label="${r.bought ? 'Bought. Tap to undo' : 'Tap when bought'}: ${esc(r.item.name)}">${icon('check')}</button>`}
      <button class="row-main" data-act="line" data-o="${esc(r.orderId)}" data-i="${esc(r.item.id)}">
        <span class="row-text">
          <span class="row-name">${esc(r.item.name)}</span>
          ${r.item.ml ? `<span class="ml">${esc(r.item.ml)}</span>` : ''}
          <span class="row-meta">${meta}${r.line?.note ? ` · <i>${esc(r.line.note)}</i>` : ''}</span>
        </span>
        <span class="row-qty"><span>${fq(r.qty)}<small>${esc(r.item.unit || '')}</small></span>${r.changed ? '<em>changed</em>' : r.extra && !r.calc ? '<em>added</em>' : ''}</span>
      </button>
    </div>`;
}

const lineFor = (orderId, itemId) => ({ ...(get('lines', lineId(orderId, itemId)) || { id: lineId(orderId, itemId), orderId, itemId }) });

A.listFilter = (el) => { ui.filter[el.dataset.o] = el.dataset.v; render(); };

A.tick = async (el) => {
  const { o, i } = el.dataset;
  const line = lineFor(o, i);
  const item = get('items', i);
  if (line.bought) {
    Object.assign(line, { bought: false, boughtBy: '', boughtAt: null });
    put('lines', line);
    toast(`${item?.name || 'Item'}: marked not bought`);
    return;
  }
  let who = me();
  if (!who) {
    who = await pickPerson({ title: 'Who bought it?', sub: item?.name });
    if (who === undefined) return;
  }
  Object.assign(line, { bought: true, boughtBy: who, boughtAt: Date.now(), person: line.person || who });
  put('lines', line);
  toast(`${item?.name || 'Item'} bought ✓`, 'ok');
};

A.giveGroup = async (el) => {
  const { o, g } = el.dataset;
  const order = get('orders', o);
  const rows = buildList(order).filter((r) => !r.skip && !r.bought && (r.item.group || 'Others') === g);
  const who = await pickPerson({ title: `Who will buy the ${g}?`, sub: `${rows.length} things not bought yet`, allowNone: true, noneLabel: 'Remove names' });
  if (who === undefined) return;
  putMany(rows.map((r) => ['lines', Object.assign(lineFor(o, r.item.id), { person: who })]));
  toast(who ? `${g} given to ${personName(who)}` : 'Names removed');
};

A.shareList = (el) => {
  const o = get('orders', el.dataset.o);
  const mine = me();
  const f = ui.filter[o.id] || 'all';
  let rows = buildList(o).filter((r) => !r.skip && !r.bought);
  if (f === 'mine') rows = rows.filter((r) => r.person === mine);
  if (f === 'free') rows = rows.filter((r) => !r.person);
  if (!rows.length) { toast('Nothing left to buy in this list'); return; }
  const groups = [...new Set(rows.map((r) => r.item.group || 'Others'))];
  const text = [
    `*${settings().company || 'Achipra Caters'}* – buying list`,
    `${o.client} · ${fdate(o.date)} · ${fq(o.plates)} plates`,
    f === 'mine' ? `For: ${personName(mine)}` : '',
    ...groups.flatMap((g) => ['', `*${g}*`, ...rows.filter((r) => (r.item.group || 'Others') === g)
      .map((r) => `• ${r.item.name} – ${fq(r.qty)} ${r.item.unit}${r.person && f !== 'mine' ? ` (${personName(r.person)})` : ''}`)]),
  ].filter((x, i) => x !== '' || i > 2).join('\n');
  shareText(text);
};

// Edit one line of the list
A.line = (el) => {
  const { o, i } = el.dataset;
  const order = get('orders', o);
  const r = buildList(order).find((x) => x.item.id === i);
  if (!r) return;
  const line = lineFor(o, i);
  openSheet(`
    ${sheetHead(r.item.name, `${r.item.ml ? esc(r.item.ml) + ' · ' : ''}${r.dishes.length ? 'For ' + esc(r.dishes.join(', ')) : 'Added by hand'}`)}
    <form class="sheet-body form" id="lineForm">
      <div class="field"><span class="label">How much to buy</span>
        <div class="qty-row"><input name="qty" type="number" inputmode="decimal" step="any" value="${esc(r.qty)}"><span class="unit">${esc(r.item.unit)}</span></div>
        ${r.calc ? `<span class="hint">App's amount for ${fq(order.plates)} plates: <b>${fq(r.calc)} ${esc(r.item.unit)}</b> ${r.changed ? `<button type="button" class="link" data-reset>Use this</button>` : ''}</span>` : ''}
      </div>
      <div class="field"><span class="label">Who will buy it</span>${personChips('person', r.person, { none: 'Nobody yet' })}</div>
      <div class="field"><span class="label">Bought?</span>
        <div class="seg two-way">
          <label><input type="radio" name="bought" value="0" ${!r.bought ? 'checked' : ''}><span>Not yet</span></label>
          <label><input type="radio" name="bought" value="1" ${r.bought ? 'checked' : ''}><span>${icon('check')} Bought</span></label>
        </div>
        ${r.bought ? `<span class="hint">Bought by ${esc(personName(r.boughtBy))}${line.boughtAt ? ' · ' + fstamp(line.boughtAt) : ''}</span>` : ''}
      </div>
      <label class="check-row boxed"><input type="checkbox" name="skip" ${r.skip ? 'checked' : ''}><span>Not needed (we have it in stock)</span></label>
      ${field('Note', `<input name="note" value="${esc(line.note || '')}" placeholder="Example: buy from Ravi Stores">`)}
      <button class="btn big primary block">Save</button>
      ${r.extra && !r.dishes.length ? '<button type="button" class="btn danger-text block" data-remove>Remove from list</button>' : ''}
    </form>`, {
    onMount(s) {
      const f = s.querySelector('#lineForm');
      s.querySelector('[data-reset]')?.addEventListener('click', () => { f.qty.value = r.calc; });
      s.querySelector('[data-remove]')?.addEventListener('click', () => {
        put('lines', Object.assign(line, { extra: false, bought: false, qty: null, skip: false }));
        closeSheet();
        toast('Removed from list');
      });
      f.onsubmit = (e) => {
        e.preventDefault();
        const person = f.person?.value || '';
        const bought = f.bought.value === '1';
        const qty = f.qty.value === '' ? null : num(f.qty.value);
        Object.assign(line, {
          qty: qty === r.calc && !r.extra ? null : qty,
          person, skip: f.skip.checked, note: f.note.value.trim(),
        });
        if (bought && !line.bought) Object.assign(line, { bought: true, boughtBy: person || me() || '', boughtAt: Date.now() });
        if (!bought) Object.assign(line, { bought: false, boughtBy: '', boughtAt: null });
        put('lines', line);
        closeSheet();
        toast('Saved');
      };
    },
  });
};

// Add something that is not in any dish
A.addItem = (el) => {
  const o = get('orders', el.dataset.o);
  const rows = buildList(o);
  const items = list('items').sort((a, b) => a.name.localeCompare(b.name));
  const s = openSheet(`
    ${sheetHead('Add to buying list')}
    <div class="sheet-body">
      <label class="search">${icon('search')}<input type="search" id="itemSearch" placeholder="Type to find, e.g. onion" autofocus aria-label="Find item"></label>
      <div class="pick-list" id="itemList">
        ${items.map((it) => `<button class="pick-row" data-id="${esc(it.id)}" data-s="${esc((it.name + ' ' + (it.ml || '')).toLowerCase())}">
          <span><b>${esc(it.name)}</b>${it.ml ? ` <small class="ml">${esc(it.ml)}</small>` : ''}</span><small class="muted">${esc(it.group || '')} · ${esc(it.unit)}</small></button>`).join('')}
      </div>
      <button class="btn block" id="newItemBtn">${icon('plus')} Not in the list? Make a new item</button>
    </div>`, { wide: true });
  const search = s.querySelector('#itemSearch');
  search.oninput = () => {
    const q = search.value.trim().toLowerCase();
    s.querySelectorAll('.pick-row').forEach((b) => { b.hidden = q && !b.dataset.s.includes(q); });
  };
  const askQty = (it) => {
    const existing = rows.find((r) => r.item.id === it.id);
    s.innerHTML = `
      ${sheetHead(it.name, existing ? `Already in the list: ${fq(existing.qty)} ${esc(it.unit)}. Type the new total.` : 'How much to buy?')}
      <form class="sheet-body form" id="qtyForm">
        <div class="qty-row"><input name="qty" type="number" inputmode="decimal" step="any" required autofocus value="${existing ? esc(existing.qty) : ''}"><span class="unit">${esc(it.unit)}</span></div>
        <button class="btn big primary block">Add to list</button>
      </form>`;
    setTimeout(() => s.querySelector('input[name=qty]').focus(), 50);
    s.querySelector('#qtyForm').onsubmit = (e) => {
      e.preventDefault();
      const q = num(e.target.qty.value);
      if (!(q > 0)) return;
      put('lines', Object.assign(lineFor(o.id, it.id), { extra: true, qty: q, skip: false }));
      closeSheet();
      toast(`${it.name} added`);
    };
  };
  s.querySelectorAll('.pick-row').forEach((b) => { b.onclick = () => askQty(get('items', b.dataset.id)); });
  s.querySelector('#newItemBtn').onclick = () => {
    s.innerHTML = `
      ${sheetHead('New item')}
      <form class="sheet-body form" id="newItem">
        ${field('Name *', `<input name="name" required autofocus value="${esc(search.value)}">`)}
        ${field('Name in Malayalam', '<input name="ml">')}
        <div class="two">
          ${field('Unit', `<select name="unit">${UNITS.map((u) => `<option>${u}</option>`).join('')}</select>`)}
          ${field('Shop type', `<select name="group">${allGroups().map((g) => `<option>${esc(g)}</option>`).join('')}</select>`)}
        </div>
        ${field('How much to buy *', '<input name="qty" type="number" inputmode="decimal" step="any" required>')}
        <button class="btn big primary block">Add to list</button>
      </form>`;
    s.querySelector('#newItem').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      if (!f.name.value.trim() || !(num(f.qty.value) > 0)) return;
      const it = put('items', { name: f.name.value.trim(), ml: f.ml.value.trim(), unit: f.unit.value, group: f.group.value, rate: 0 });
      put('lines', Object.assign(lineFor(o.id, it.id), { extra: true, qty: num(f.qty.value) }));
      closeSheet();
      toast(`${it.name} added`);
    };
  };
};

// ---------- Bills ----------
function billsTab(o) {
  const bills = orderBills(o.id);
  const total = bills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const credit = bills.filter((b) => b.mode === 'credit' && !b.shopPaid).reduce((s, b) => s + (Number(b.amount) || 0), 0);
  return `
    <button class="btn big primary block" data-act="bill" data-o="${esc(o.id)}">${icon('camera')} Add bill with photo</button>
    ${bills.length ? `
      <div class="stat-row">
        <div class="stat"><span>Total bills</span><b>${rs(total)}</b></div>
        <div class="stat"><span>Count</span><b>${bills.length}</b></div>
        <div class="stat ${credit ? 'due' : ''}"><span>Shop not paid</span><b>${rs(credit)}</b></div>
      </div>
      <div class="cards">${bills.map(billCard).join('')}</div>`
    : '<div class="empty"><h2>No bills yet</h2><p class="muted">After buying, take a photo of the bill here. The amount is added to the buyer\'s name.</p></div>'}`;
}

export function billCard(b, { showOrder } = {}) {
  const order = showOrder ? get('orders', b.orderId) : null;
  const photo = b.photos?.[0];
  return `
    <div class="card bill">
      ${photo ? `<button class="bill-photo" data-act="viewPhoto" data-b="${esc(b.id)}" aria-label="See bill photo"><img src="${esc(photoSrc(photo))}" alt="" loading="lazy">${b.photos.length > 1 ? `<span>+${b.photos.length - 1}</span>` : ''}</button>`
      : `<span class="bill-photo none">${icon('receipt')}<small>No photo</small></span>`}
      <button class="bill-main" data-act="bill" data-o="${esc(b.orderId)}" data-id="${esc(b.id)}">
        <span class="bill-amt">${rs(b.amount)}</span>
        <span><b>${esc(personName(b.person) || 'Office')}</b>${b.shop ? ' · ' + esc(b.shop) : ''}</span>
        ${order ? `<span class="muted">${esc(order.client)} · ${fdate(order.date)}</span>` : ''}
        <span class="muted">${fstamp(b.createdAt)}</span>
        ${b.mode === 'credit' ? (b.shopPaid ? '<span class="chip">Credit · shop paid</span>' : '<span class="chip due">Credit · shop not paid</span>') : '<span class="chip ok">Paid</span>'}
      </button>
    </div>`;
}

A.viewPhoto = (el) => {
  const b = get('bills', el.dataset.b);
  if (!b?.photos?.length) return;
  openSheet(`
    ${sheetHead(`Bill ${rs(b.amount)}`, `${esc(personName(b.person))}${b.shop ? ' · ' + esc(b.shop) : ''}`)}
    <div class="sheet-body photos-full">
      ${b.photos.map((n) => `<a href="${esc(photoSrc(n))}" target="_blank" rel="noopener"><img src="${esc(photoSrc(n))}" alt="Bill photo"></a>`).join('')}
      <p class="hint center">Tap the photo to open it full size and zoom.</p>
    </div>`, { wide: true });
};

A.bill = (el) => {
  const old = el.dataset.id ? get('bills', el.dataset.id) : null;
  const o = get('orders', el.dataset.o) || { id: old?.orderId || '', plates: 0 };
  const b = old ? { ...old, photos: [...(old.photos || [])] } : { orderId: o.id, person: me(), mode: 'paid', photos: [] };
  const newPhotos = new Map(); // name -> dataUrl
  const shops = [...new Set(list('bills').map((x) => x.shop).filter(Boolean))].sort();
  const toBuy = o.client ? buildList(o).filter((r) => !r.skip && !r.bought) : [];
  const s = openSheet(`
    ${sheetHead(old ? 'Bill' : 'Add a bill')}
    <form class="sheet-body form" id="billForm">
      <div class="field"><span class="label">Who bought?</span>${personChips('person', b.person, { none: 'Office' })}</div>
      ${field('Bill amount (₹) *', `<input name="amount" type="number" inputmode="decimal" step="any" class="big-input" value="${esc(b.amount ?? '')}" required>`)}
      ${field('Shop name', `<input name="shop" list="shopList" value="${esc(b.shop || '')}" autocomplete="off"><datalist id="shopList">${shops.map((x) => `<option value="${esc(x)}">`).join('')}</datalist>`)}
      <div class="field"><span class="label">Bill photo</span>
        <div class="photo-btns">
          <label class="btn big">${icon('camera')} Take photo<input type="file" accept="image/*" capture="environment" hidden data-photo></label>
          <label class="btn big">${icon('image')} From gallery<input type="file" accept="image/*" multiple hidden data-photo></label>
        </div>
        <div class="thumbs" id="thumbs"></div>
      </div>
      <div class="field"><span class="label">Payment</span>
        <div class="seg two-way">
          <label><input type="radio" name="mode" value="paid" ${b.mode !== 'credit' ? 'checked' : ''}><span>Paid</span></label>
          <label><input type="radio" name="mode" value="credit" ${b.mode === 'credit' ? 'checked' : ''}><span>Credit (pay shop later)</span></label>
        </div>
        <span class="hint">“Paid” means the buyer paid. The office then owes the buyer, less any advance given.</span>
      </div>
      ${old && b.mode === 'credit' ? `<label class="check-row boxed"><input type="checkbox" name="shopPaid" ${b.shopPaid ? 'checked' : ''}><span>Shop has been paid</span></label>` : ''}
      ${!old && toBuy.length ? `<details class="more"><summary>Tick things in this bill (optional)</summary>
        <p class="hint">They will be marked as bought.</p>
        <div class="check-list" id="billItems">
          ${toBuy.map((r) => `<label class="check-row" data-p="${esc(r.person)}"><input type="checkbox" value="${esc(r.item.id)}"><span>${esc(r.item.name)} <small class="muted">${fq(r.qty)} ${esc(r.item.unit)}${r.person ? ' · ' + esc(personName(r.person)) : ''}</small></span></label>`).join('')}
        </div></details>` : ''}
      ${field('Note', `<input name="note" value="${esc(b.note || '')}">`)}
      <p class="error" id="billErr" role="alert"></p>
      <button class="btn big primary block">${old ? 'Save bill' : 'Save bill'}</button>
      ${old ? '<button type="button" class="btn danger-text block" data-del>Delete this bill</button>' : ''}
    </form>`);
  const form = s.querySelector('#billForm');
  const thumbs = s.querySelector('#thumbs');
  const drawThumbs = () => {
    thumbs.innerHTML = b.photos.map((n) => `<div class="thumb"><img src="${esc(newPhotos.get(n) || photoSrc(n))}" alt="Bill photo"><button type="button" data-rm="${esc(n)}" aria-label="Remove photo">${icon('x')}</button></div>`).join('');
    thumbs.querySelectorAll('[data-rm]').forEach((x) => { x.onclick = () => { b.photos = b.photos.filter((n) => n !== x.dataset.rm); newPhotos.delete(x.dataset.rm); drawThumbs(); }; });
  };
  drawThumbs();
  s.querySelectorAll('[data-photo]').forEach((inp) => inp.addEventListener('change', async () => {
    for (const file of inp.files) {
      try {
        const dataUrl = await compressImage(file);
        const name = uid() + '.jpg';
        newPhotos.set(name, dataUrl);
        b.photos.push(name);
      } catch (x) { toast(x.message, 'bad'); }
    }
    inp.value = '';
    drawThumbs();
  }));
  s.querySelector('[data-del]')?.addEventListener('click', async () => {
    const ok = await ask(`Delete this bill of ${rs(old.amount)}?`, { ok: 'Yes, delete', danger: true });
    if (ok) { removeMany([['bills', old.id]]); toast('Bill deleted'); }
  });
  form.onsubmit = (e) => {
    e.preventDefault();
    const amount = num(form.amount.value);
    if (!(amount > 0)) { s.querySelector('#billErr').textContent = 'Please type the bill amount.'; form.amount.focus(); return; }
    for (const [name, dataUrl] of newPhotos) queuePhoto(name, dataUrl);
    const person = form.person?.value || '';
    Object.assign(b, {
      person, amount, shop: form.shop.value.trim(), mode: form.mode.value, note: form.note.value.trim(),
      shopPaid: form.mode.value === 'credit' ? !!form.shopPaid?.checked : false,
      date: b.date || ymd(),
    });
    const ticked = [...s.querySelectorAll('#billItems input:checked')].map((x) => x.value);
    putMany([
      ['bills', b],
      ...ticked.map((itemId) => ['lines', Object.assign(lineFor(o.id, itemId), { bought: true, boughtBy: person || me() || '', boughtAt: Date.now(), person: get('lines', lineId(o.id, itemId))?.person || person })]),
    ]);
    closeSheet();
    toast(old ? 'Bill saved' : `Bill of ${rs(amount)} added${ticked.length ? `, ${ticked.length} things ticked` : ''}`, 'ok');
  };
};

// ---------- Money for this order ----------
function moneyTab(o) {
  const value = orderValue(o);
  const adv = Number(o.advance) || 0;
  const due = clientDue(o);
  const st = orderStats(o);
  const bills = orderBills(o.id);
  const pays = orderPayments(o.id);
  const ids = [...new Set([...bills.map((b) => b.person), ...pays.map((p) => p.person)].filter(Boolean))];
  const credits = shopCredit(o.id);
  return `
    <section class="card pad">
      <h3>From customer</h3>
      <div class="kv"><span>Order amount${o.amount === '' || o.amount == null ? ` <small class="muted">(${fq(o.plates)} × ${rs(o.rate)})</small>` : ''}</span><b>${rs(value)}</b></div>
      <div class="kv"><span>Advance received</span><b>${rs(adv)}</b></div>
      <div class="kv total ${due > 0 ? 'due' : 'ok'}"><span>${due > 0 ? 'Still to collect' : 'Fully paid'}</span><b>${rs(Math.max(due, 0))}</b></div>
      <a class="link" href="#/order/${esc(o.id)}/edit">Change amount or advance</a>
    </section>

    <section class="card pad">
      <h3>Buying cost</h3>
      ${st.est ? `<div class="kv"><span>Estimate from rates</span><b>${rs(st.est)}</b></div>` : ''}
      <div class="kv"><span>Bills so far (${bills.length})</span><b>${rs(st.spent)}</b></div>
      ${value ? `<div class="kv total"><span>Left after bills</span><b>${rs(value - st.spent)}</b></div>` : ''}
    </section>

    <section class="card pad">
      <div class="group-head"><h3>People's money</h3></div>
      <p class="hint">Bills they paid, minus money the office gave them for this order.</p>
      ${ids.length ? ids.map((pid) => {
        const m = personMoney(pid, o.id);
        return `<a class="person-row" href="#/person/${esc(pid)}">
          <span><b>${esc(personName(pid))}</b><small class="muted">Spent ${rs(m.spent)} · Given ${rs(m.given)}</small></span>
          ${balanceTag(m.balance)}</a>`;
      }).join('') : '<p class="muted">No bills or advances yet.</p>'}
      <button class="btn block" data-act="payment" data-o="${esc(o.id)}">${icon('rupee')} Give money / advance</button>
      ${pays.length ? `<details class="more"><summary>Money given for this order (${pays.length})</summary>
        ${pays.map((p) => `<button class="person-row" data-act="payment" data-o="${esc(o.id)}" data-id="${esc(p.id)}"><span><b>${esc(personName(p.person))}</b><small class="muted">${fstamp(p.createdAt)}${p.note ? ' · ' + esc(p.note) : ''}</small></span><b>${rs(p.amount)}</b></button>`).join('')}
      </details>` : ''}
    </section>

    ${credits.length ? `<section class="card pad">
      <h3>Shops not paid yet</h3>
      ${credits.map((b) => `<div class="person-row"><span><b>${esc(b.shop || 'Shop')}</b><small class="muted">${esc(personName(b.person))} · ${fstamp(b.createdAt)}</small></span>
        <span class="right"><b class="due-text">${rs(b.amount)}</b><button class="btn sm" data-act="shopPaid" data-id="${esc(b.id)}">Mark paid</button></span></div>`).join('')}
    </section>` : ''}`;
}

export const balanceTag = (bal) => (Math.round(bal) > 0 ? `<span class="tag due">Office to pay<b>${rs(bal)}</b></span>`
  : Math.round(bal) < 0 ? `<span class="tag">To return<b>${rs(-bal)}</b></span>`
  : `<span class="tag ok">${icon('check')} Settled</span>`);

// ---------- Dishes ----------
// Menu sections in the order a guest meets them; "Serving & Kitchen" (leaf, water, gas) is not shown to guests.
const KITCHEN = 'Serving & Kitchen';
const CAT_ORDER = ['Main', 'Curry', 'Side', 'Payasam', 'Snacks', 'Drinks'];
const CAT_TITLE = { Main: 'Main', Curry: 'Curries', Side: 'Sides', Payasam: 'Payasam', Snacks: 'Snacks', Drinks: 'Drinks' };
const catRank = (c) => { const i = CAT_ORDER.indexOf(c); return i === -1 ? CAT_ORDER.length : i; };

function menuSections(o) {
  const dishes = (o.dishIds || []).map((id) => get('dishes', id)).filter(Boolean);
  const guest = dishes.filter((d) => d.cat !== KITCHEN);
  const cats = [...new Set(guest.map((d) => d.cat || 'Other'))].sort((a, b) => catRank(a) - catRank(b));
  return {
    sections: cats.map((c) => ({ title: CAT_TITLE[c] || c, dishes: guest.filter((d) => (d.cat || 'Other') === c) })),
    kitchen: dishes.filter((d) => d.cat === KITCHEN),
    count: guest.length,
  };
}

function dishesTab(o) {
  const { sections, kitchen, count } = menuSections(o);
  if (!count) {
    return `<div class="empty"><h2>No dishes yet</h2><p class="muted">Edit the order and tick the dishes.</p>
      <a class="btn big primary" href="#/order/${esc(o.id)}/edit">Choose dishes</a></div>`;
  }
  return `
    <article class="menu-card" aria-label="Menu">
      <div class="mc-frame">
        <p class="mc-brand">${esc(settings().company || 'Achipra Caters')}</p>
        <h2 class="mc-title">${esc(menuName(o))}</h2>
        <p class="mc-for">${esc(o.client)}<br>${fdate(o.date, true)}${o.time ? ' · ' + ftime(o.time) : ''}</p>
        <div class="mc-orn" aria-hidden="true"><span></span>✦<span></span></div>
        ${sections.map((s) => `
          <section class="mc-sec">
            <h3 class="mc-cat">${esc(s.title)}</h3>
            <ul class="mc-dishes">
              ${s.dishes.map((d) => `<li><span class="mc-dish">${esc(d.name)}</span>${d.ml ? `<span class="mc-ml">${esc(d.ml)}</span>` : ''}</li>`).join('')}
            </ul>
          </section>`).join('')}
        <div class="mc-orn" aria-hidden="true"><span></span>✦<span></span></div>
        <p class="mc-foot">${count} dishes · ${fq(o.plates)} plates</p>
      </div>
    </article>
    <div class="list-tools no-print">
      <button class="btn" data-act="shareMenu" data-o="${esc(o.id)}">${icon('share')} Send menu</button>
      <button class="btn" data-act="printMenu">${icon('receipt')} Print</button>
    </div>
    <a class="btn block no-print" href="#/order/${esc(o.id)}/edit">${icon('edit')} Change dishes or plates</a>
    ${kitchen.length ? `<p class="hint center no-print">Also arranged: ${kitchen.map((d) => esc(d.name)).join(', ')}</p>` : ''}
    ${o.notes ? `<section class="card pad no-print"><h3>Notes</h3><p class="pre">${esc(o.notes)}</p></section>` : ''}`;
}

A.shareMenu = (el) => {
  const o = get('orders', el.dataset.o);
  const { sections, count } = menuSections(o);
  const text = [
    `*${settings().company || 'Achipra Caters'}*`,
    `*${menuName(o)}* – ${o.client}`,
    `${fdate(o.date, true)}${o.time ? ' · ' + ftime(o.time) : ''}`,
    ...sections.flatMap((s) => ['', `*${s.title}*`, ...s.dishes.map((d) => `• ${d.name}`)]),
    '', `${count} dishes · ${fq(o.plates)} plates`,
  ].join('\n');
  shareText(text);
};
A.printMenu = () => window.print();

export { groupRank };
