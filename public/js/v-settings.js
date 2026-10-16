// Settings: food types (menus), dishes and their recipes, things to buy, people, password, backup.
import { A, esc, rs, fq, num, icon, toast, openSheet, closeSheet, sheetHead, ask, field } from './ui.js';
import { get, list, put, removeMany, me, personName, settings, apiJson, sync, people } from './store.js';
import { allGroups, groupRank, UNITS } from './calc.js';
import { render, TEXT_SIZES, applyTextSize } from './app.js';

const back = (href, label) => `<a class="back" href="${href}">${icon('back')} ${label}</a>`;
const sortMenus = (a, b) => (a.sort ?? 99) - (b.sort ?? 99) || a.name.localeCompare(b.name);
const byName = (a, b) => a.name.localeCompare(b.name);
const dishCats = () => [...new Set(list('dishes').map((d) => d.cat).filter(Boolean))].sort();

export function settingsView() {
  let text = 'normal';
  try { text = localStorage.getItem('ac.text') || 'normal'; } catch { /* ignore */ }
  const link = (href, ic, title, sub) => `<a class="set-row" href="${href}">${icon(ic)}<span><b>${title}</b><small class="muted">${sub}</small></span>${icon('chevron', 'chev')}</a>`;
  return {
    html: `
    <div class="page">
      <div class="page-head"><h1>Settings</h1></div>

      <section class="card">
        <h3 class="card-title">This phone</h3>
        <button class="set-row" data-act="pickMe">${icon('user')}<span><b>I am: ${esc(personName(me()) || 'not chosen')}</b><small class="muted">Your name goes on ticks and bills from this phone</small></span>${icon('chevron', 'chev')}</button>
        <div class="set-row static">${icon('text')}<span><b>Text size</b>
          <span class="seg mini">${TEXT_SIZES.map(([k, label]) => `<button class="${text === k ? 'on' : ''}" data-act="textSize" data-v="${k}">${label}</button>`).join('')}</span></span></div>
      </section>

      <section class="card">
        <h3 class="card-title">What we cook and buy</h3>
        ${link('#/settings/menus', 'menu', 'Food types', `${list('menus').length} – ${esc(list('menus').sort(sortMenus).slice(0, 3).map((m) => m.name).join(', '))}…`)}
        ${link('#/settings/dishes', 'dish', 'Dishes and recipes', `${list('dishes').length} dishes – what each dish needs for 100 plates`)}
        ${link('#/settings/items', 'box', 'Things to buy', `${list('items').length} items – unit, shop type, rate`)}
        ${link('#/settings/people', 'users', 'People', `${people().length} people who buy`)}
      </section>

      <section class="card">
        <h3 class="card-title">Company</h3>
        <button class="set-row" data-act="editCompany">${icon('building')}<span><b>${esc(settings().company || 'Achipra Caters')}</b><small class="muted">Company name</small></span>${icon('chevron', 'chev')}</button>
        <button class="set-row" data-act="changePassword">${icon('lock')}<span><b>Change team password</b><small class="muted">Other phones will need the new password</small></span>${icon('chevron', 'chev')}</button>
        <a class="set-row" href="/api/export" download>${icon('download')}<span><b>Download backup</b><small class="muted">Save all data as one file. Do this every week.</small></span>${icon('chevron', 'chev')}</a>
        <label class="set-row">${icon('upload')}<span><b>Restore from backup</b><small class="muted">Replaces everything with the backup file</small></span>${icon('chevron', 'chev')}<input type="file" accept=".json,application/json" hidden data-restore></label>
        <button class="set-row" data-act="logout">${icon('logout')}<span><b>Log out from this phone</b></span>${icon('chevron', 'chev')}</button>
      </section>
    </div>`,
    mount(v) {
      v.querySelector('[data-restore]').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        let data;
        try { data = JSON.parse(await file.text()); } catch { toast('This file is not a backup', 'bad'); return; }
        const n = data.records?.length || 0;
        if (!(await ask('Replace all data with this backup?', { ok: 'Yes, restore', danger: true, detail: `The backup has ${n} entries. Everything in the app now will be replaced on every phone.` }))) return;
        try { await apiJson('/api/import', data); await sync(); toast('Backup restored', 'ok'); render(); }
        catch (x) { toast(x.message, 'bad'); }
      });
    },
  };
}

A.textSize = (el) => { applyTextSize(el.dataset.v); render(); };
A.logout = async () => {
  if (!(await ask('Log out from this phone?', { ok: 'Yes, log out' }))) return;
  try { await apiJson('/api/logout', {}); } catch { /* ignore */ }
  location.hash = '';
  location.reload();
};
A.editCompany = () => {
  const s = openSheet(`${sheetHead('Company name')}
    <form class="sheet-body form" id="coForm">${field('Name', `<input name="company" value="${esc(settings().company || '')}" required autofocus>`)}
    <button class="btn big primary block">Save</button></form>`);
  s.querySelector('#coForm').onsubmit = (e) => {
    e.preventDefault();
    put('settings', { ...settings(), id: 'main', company: e.target.company.value.trim() || 'Achipra Caters' });
    closeSheet(); toast('Saved');
  };
};
A.changePassword = () => {
  const s = openSheet(`${sheetHead('Change team password')}
    <form class="sheet-body form" id="pwForm">
      ${field('Current password', '<input name="old" type="password" required autocomplete="current-password">')}
      ${field('New password', '<input name="password" type="password" minlength="4" required autocomplete="new-password">', 'At least 4 letters or numbers')}
      ${field('New password again', '<input name="password2" type="password" required autocomplete="new-password">')}
      <p class="error" id="pwErr" role="alert"></p>
      <button class="btn big primary block">Change password</button></form>`);
  s.querySelector('#pwForm').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const err = s.querySelector('#pwErr');
    if (f.password.value !== f.password2.value) { err.textContent = 'The two new passwords are not the same.'; return; }
    try { await apiJson('/api/password', { old: f.old.value, password: f.password.value }); closeSheet(); toast('Password changed. Tell the team the new one.', 'ok'); }
    catch (x) { err.textContent = x.message; }
  };
};

// ---------------------------------------------------------------------
export function settingsSub(s) {
  if (s === 'menus') return menusList();
  if (s === 'dishes') return dishesList();
  if (s === 'items') return itemsList();
  if (s === 'people') return peopleList();
  location.replace('#/settings');
  return { html: '' };
}
export function settingsEdit(kind, id) {
  if (kind === 'menu') return menuEdit(id);
  if (kind === 'dish') return dishEdit(id);
  if (kind === 'item') return itemEdit(id);
  location.replace('#/settings');
  return { html: '' };
}

const searchBox = (ph) => `<label class="search">${icon('search')}<input type="search" data-filter placeholder="${ph}" aria-label="Search"></label>`;
const mountFilter = (v) => {
  const s = v.querySelector('[data-filter]');
  if (!s) return;
  s.oninput = () => {
    const q = s.value.trim().toLowerCase();
    v.querySelectorAll('[data-s]').forEach((r) => { r.hidden = q && !r.dataset.s.includes(q); });
    v.querySelectorAll('.group').forEach((g) => { g.hidden = !g.querySelector('[data-s]:not([hidden])'); });
  };
};

function menusList() {
  const menus = list('menus').sort(sortMenus);
  return {
    html: `<div class="page">${back('#/settings', 'Settings')}
      <h1>Food types</h1>
      <p class="hint">A food type (like Sadhya) is a set of dishes. When an order comes, choosing the food type ticks these dishes. Each order can still change its dishes.</p>
      <a class="btn big primary block" href="#/settings/menu/new">${icon('plus')} New food type</a>
      <div class="rows card">${menus.map((m) => `<a class="set-row" href="#/settings/menu/${esc(m.id)}">${icon('menu')}<span><b>${esc(m.name)}</b><small class="muted">${m.dishIds.length} dishes${m.rate ? ' · ' + rs(m.rate) + ' a plate' : ''}</small></span>${icon('chevron', 'chev')}</a>`).join('')}</div>
    </div>`,
  };
}

function menuEdit(id) {
  const m = id === 'new' ? { name: '', rate: '', dishIds: [] } : get('menus', id);
  if (!m) return { html: `<div class="page">${back('#/settings/menus', 'Food types')}<div class="empty"><h2>Not found</h2></div></div>` };
  const dishes = list('dishes').sort(byName);
  const cats = [...new Set(dishes.map((d) => d.cat || 'Other'))].sort();
  const sel = new Set(m.dishIds);
  return {
    live: false,
    html: `<div class="page">${back('#/settings/menus', 'Food types')}
      <h1>${m.id ? esc(m.name) : 'New food type'}</h1>
      <form class="form" id="menuForm">
        <section class="card pad">
          ${field('Name *', `<input name="name" value="${esc(m.name)}" required placeholder="Example: Sadhya (Premium)">`)}
          ${field('Usual rate a plate (₹)', `<input name="rate" type="number" inputmode="decimal" value="${esc(m.rate ?? '')}">`)}
        </section>
        <section class="card pad">
          <h3>Dishes <span class="muted" id="cnt">(${sel.size})</span></h3>
          ${cats.map((c) => `<h4 class="sub">${esc(c)}</h4><div class="check-list">${dishes.filter((d) => (d.cat || 'Other') === c).map((d) => `<label class="check-row"><input type="checkbox" name="dish" value="${esc(d.id)}" ${sel.has(d.id) ? 'checked' : ''}><span>${esc(d.name)}${d.ml ? ` <small class="ml">${esc(d.ml)}</small>` : ''}</span></label>`).join('')}</div>`).join('')}
        </section>
        <p class="error" id="err" role="alert"></p>
        <div class="save-bar"><a class="btn big" href="#/settings/menus">Cancel</a><button class="btn big primary">Save</button></div>
        ${m.id ? `<button type="button" class="btn block" data-copy>${icon('plus')} Make a copy</button>
          <button type="button" class="btn danger-text block" data-del>${icon('trash')} Delete this food type</button>` : ''}
      </form></div>`,
    mount(v) {
      const f = v.querySelector('#menuForm');
      f.addEventListener('change', () => { v.querySelector('#cnt').textContent = `(${f.querySelectorAll('[name=dish]:checked').length})`; });
      const collect = () => ({ name: f.name.value.trim(), rate: f.rate.value === '' ? '' : num(f.rate.value), dishIds: [...f.querySelectorAll('[name=dish]:checked')].map((x) => x.value) });
      f.onsubmit = (e) => {
        e.preventDefault();
        const d = collect();
        if (!d.name) { v.querySelector('#err').textContent = 'Please type a name.'; return; }
        put('menus', { ...m, ...d, sort: m.sort ?? list('menus').length });
        toast('Saved'); location.hash = '#/settings/menus';
      };
      v.querySelector('[data-copy]')?.addEventListener('click', () => {
        const c = put('menus', { ...collect(), name: collect().name + ' (copy)', sort: list('menus').length });
        toast('Copy made. Change its name and dishes.'); location.hash = `#/settings/menu/${c.id}`;
      });
      v.querySelector('[data-del]')?.addEventListener('click', async () => {
        if (!(await ask(`Delete “${m.name}”?`, { ok: 'Yes, delete', danger: true, detail: 'Old orders keep their dishes.' }))) return;
        removeMany([['menus', m.id]]); toast('Deleted'); location.hash = '#/settings/menus';
      });
    },
  };
}

function dishesList() {
  const dishes = list('dishes').sort(byName);
  const cats = [...new Set(dishes.map((d) => d.cat || 'Other'))].sort();
  return {
    html: `<div class="page">${back('#/settings', 'Settings')}
      <h1>Dishes and recipes</h1>
      <p class="hint">For each dish, write what is needed for <b>100 plates</b>. The app multiplies it for the order's plates.</p>
      <a class="btn big primary block" href="#/settings/dish/new">${icon('plus')} New dish</a>
      ${searchBox('Find a dish')}
      ${cats.map((c) => `<section class="group"><h3 class="list-title">${esc(c)}</h3><div class="rows card">
        ${dishes.filter((d) => (d.cat || 'Other') === c).map((d) => `<a class="set-row" href="#/settings/dish/${esc(d.id)}" data-s="${esc((d.name + ' ' + (d.ml || '')).toLowerCase())}">${icon('dish')}<span><b>${esc(d.name)}</b><small class="muted">${d.ml ? esc(d.ml) + ' · ' : ''}${(d.recipe || []).length} things</small></span>${icon('chevron', 'chev')}</a>`).join('')}
      </div></section>`).join('')}
    </div>`,
    mount: mountFilter,
  };
}

function itemOptions(selected) {
  const items = list('items').sort((a, b) => groupRank(a.group) - groupRank(b.group) || a.name.localeCompare(b.name));
  const groups = [...new Set(items.map((i) => i.group || 'Others'))];
  return `<option value="">Choose…</option>` + groups.map((g) => `<optgroup label="${esc(g)}">${items.filter((i) => (i.group || 'Others') === g).map((i) => `<option value="${esc(i.id)}" data-unit="${esc(i.unit)}" ${i.id === selected ? 'selected' : ''}>${esc(i.name)}</option>`).join('')}</optgroup>`).join('');
}

function dishEdit(id) {
  const d = id === 'new' ? { name: '', ml: '', cat: '', recipe: [] } : get('dishes', id);
  if (!d) return { html: `<div class="page">${back('#/settings/dishes', 'Dishes')}<div class="empty"><h2>Not found</h2></div></div>` };
  const recipeRow = (r = {}) => {
    const it = r.item ? get('items', r.item) : null;
    return `<div class="recipe-row">
      <select name="item" aria-label="Thing">${itemOptions(r.item)}</select>
      <input name="q" type="number" inputmode="decimal" step="any" value="${esc(r.q ?? '')}" aria-label="Amount for 100 plates" placeholder="0">
      <span class="unit">${esc(it?.unit || '')}</span>
      <button type="button" class="icon-btn" data-rm aria-label="Remove">${icon('x')}</button>
    </div>`;
  };
  const usedIn = list('menus').filter((m) => m.dishIds.includes(d.id));
  return {
    live: false,
    html: `<div class="page">${back('#/settings/dishes', 'Dishes')}
      <h1>${d.id ? esc(d.name) : 'New dish'}</h1>
      <form class="form" id="dishForm">
        <section class="card pad">
          ${field('Dish name *', `<input name="name" value="${esc(d.name)}" required>`)}
          ${field('Name in Malayalam', `<input name="ml" value="${esc(d.ml || '')}">`)}
          ${field('Type', `<input name="cat" value="${esc(d.cat || '')}" list="catList" placeholder="Curry, Payasam, Side…"><datalist id="catList">${dishCats().map((c) => `<option value="${esc(c)}">`).join('')}</datalist>`)}
        </section>
        <section class="card pad">
          <h3>Needed for 100 plates</h3>
          <div id="recipe">${(d.recipe || []).map(recipeRow).join('')}</div>
          <button type="button" class="btn block" id="addRow">${icon('plus')} Add a thing</button>
          <p class="hint">A thing missing from the list? Add it first in Settings → Things to buy.</p>
        </section>
        ${usedIn.length ? `<p class="hint">Used in: ${usedIn.map((m) => esc(m.name)).join(', ')}</p>` : ''}
        <p class="error" id="err" role="alert"></p>
        <div class="save-bar"><a class="btn big" href="#/settings/dishes">Cancel</a><button class="btn big primary">Save</button></div>
        ${d.id ? `<button type="button" class="btn danger-text block" data-del>${icon('trash')} Delete this dish</button>` : ''}
      </form></div>`,
    mount(v) {
      const f = v.querySelector('#dishForm');
      const box = v.querySelector('#recipe');
      v.querySelector('#addRow').onclick = () => { box.insertAdjacentHTML('beforeend', recipeRow()); box.lastElementChild.querySelector('select').focus(); };
      box.addEventListener('click', (e) => { if (e.target.closest('[data-rm]')) e.target.closest('.recipe-row').remove(); });
      box.addEventListener('change', (e) => {
        if (e.target.name !== 'item') return;
        e.target.closest('.recipe-row').querySelector('.unit').textContent = e.target.selectedOptions[0]?.dataset.unit || '';
      });
      if (!d.id) box.insertAdjacentHTML('beforeend', recipeRow());
      f.onsubmit = (e) => {
        e.preventDefault();
        const name = f.name.value.trim();
        if (!name) { v.querySelector('#err').textContent = 'Please type the dish name.'; return; }
        const recipe = [...box.querySelectorAll('.recipe-row')].map((r) => ({ item: r.querySelector('[name=item]').value, q: num(r.querySelector('[name=q]').value) })).filter((r) => r.item && r.q > 0);
        put('dishes', { ...d, name, ml: f.ml.value.trim(), cat: f.cat.value.trim() || 'Other', recipe });
        toast('Saved'); location.hash = '#/settings/dishes';
      };
      v.querySelector('[data-del]')?.addEventListener('click', async () => {
        if (!(await ask(`Delete “${d.name}”?`, { ok: 'Yes, delete', danger: true, detail: usedIn.length ? `It will also be taken out of: ${usedIn.map((m) => m.name).join(', ')}.` : '' }))) return;
        usedIn.forEach((m) => put('menus', { ...m, dishIds: m.dishIds.filter((x) => x !== d.id) }));
        removeMany([['dishes', d.id]]); toast('Deleted'); location.hash = '#/settings/dishes';
      });
    },
  };
}

function itemsList() {
  const items = list('items').sort(byName);
  const groups = [...new Set(items.map((i) => i.group || 'Others'))].sort((a, b) => groupRank(a) - groupRank(b));
  return {
    html: `<div class="page">${back('#/settings', 'Settings')}
      <h1>Things to buy</h1>
      <p class="hint">The rate is only for the cost estimate. Change it when prices change.</p>
      <a class="btn big primary block" href="#/settings/item/new">${icon('plus')} New thing</a>
      ${searchBox('Find, e.g. coconut')}
      ${groups.map((g) => `<section class="group"><h3 class="list-title">${esc(g)}</h3><div class="rows card">
        ${items.filter((i) => (i.group || 'Others') === g).map((i) => `<a class="set-row" href="#/settings/item/${esc(i.id)}" data-s="${esc((i.name + ' ' + (i.ml || '')).toLowerCase())}"><span><b>${esc(i.name)}</b><small class="muted">${i.ml ? esc(i.ml) + ' · ' : ''}${esc(i.unit)}${i.rate ? ` · ${rs(i.rate)}/${esc(i.unit)}` : ''}</small></span>${icon('chevron', 'chev')}</a>`).join('')}
      </div></section>`).join('')}
    </div>`,
    mount: mountFilter,
  };
}

function itemEdit(id) {
  const it = id === 'new' ? { name: '', ml: '', unit: 'kg', group: 'Vegetables', rate: '' } : get('items', id);
  if (!it) return { html: `<div class="page">${back('#/settings/items', 'Things to buy')}<div class="empty"><h2>Not found</h2></div></div>` };
  const usedIn = it.id ? list('dishes').filter((d) => (d.recipe || []).some((r) => r.item === it.id)) : [];
  return {
    live: false,
    html: `<div class="page">${back('#/settings/items', 'Things to buy')}
      <h1>${it.id ? esc(it.name) : 'New thing'}</h1>
      <form class="form" id="itemForm">
        <section class="card pad">
          ${field('Name *', `<input name="name" value="${esc(it.name)}" required>`)}
          ${field('Name in Malayalam', `<input name="ml" value="${esc(it.ml || '')}">`)}
          <div class="two">
            ${field('Unit', `<select name="unit">${[...new Set([...UNITS, it.unit])].map((u) => `<option ${u === it.unit ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>`)}
            ${field('Rate (₹ per unit)', `<input name="rate" type="number" inputmode="decimal" step="any" value="${esc(it.rate ?? '')}">`)}
          </div>
          ${field('Shop type', `<input name="group" value="${esc(it.group || '')}" list="grpList"><datalist id="grpList">${allGroups().map((g) => `<option value="${esc(g)}">`).join('')}</datalist>`, 'The buying list is split by shop type, so one person can take all vegetables.')}
        </section>
        ${usedIn.length ? `<p class="hint">Used in: ${usedIn.map((d) => esc(d.name)).join(', ')}</p>` : ''}
        <p class="error" id="err" role="alert"></p>
        <div class="save-bar"><a class="btn big" href="#/settings/items">Cancel</a><button class="btn big primary">Save</button></div>
        ${it.id ? `<button type="button" class="btn danger-text block" data-del>${icon('trash')} Delete this thing</button>` : ''}
      </form></div>`,
    mount(v) {
      const f = v.querySelector('#itemForm');
      f.onsubmit = (e) => {
        e.preventDefault();
        if (!f.name.value.trim()) { v.querySelector('#err').textContent = 'Please type a name.'; return; }
        put('items', { ...it, name: f.name.value.trim(), ml: f.ml.value.trim(), unit: f.unit.value, rate: f.rate.value === '' ? '' : num(f.rate.value), group: f.group.value.trim() || 'Others' });
        toast('Saved'); location.hash = '#/settings/items';
      };
      v.querySelector('[data-del]')?.addEventListener('click', async () => {
        if (usedIn.length) { await ask(`“${it.name}” is used in ${usedIn.length} dish${usedIn.length > 1 ? 'es' : ''}`, { ok: 'OK', cancel: 'Close', detail: `Remove it from these dishes first: ${usedIn.map((d) => esc(d.name)).join(', ')}` }); return; }
        if (!(await ask(`Delete “${it.name}”?`, { ok: 'Yes, delete', danger: true }))) return;
        removeMany([['items', it.id]]); toast('Deleted'); location.hash = '#/settings/items';
      });
    },
  };
}

function peopleList() {
  const all = list('people').sort(byName);
  const active = all.filter((p) => p.active !== false);
  const hidden = all.filter((p) => p.active === false);
  const row = (p) => `<button class="set-row" data-act="editPerson" data-id="${esc(p.id)}">${icon('user')}<span><b>${esc(p.name)}${p.id === me() ? ' <small class="muted">(this phone)</small>' : ''}</b><small class="muted">${esc(p.phone || 'No phone')}</small></span>${icon('edit', 'chev')}</button>`;
  return {
    html: `<div class="page">${back('#/settings', 'Settings')}
      <h1>People</h1>
      <p class="hint">Everyone who buys things or takes money. Each person's bills and money are kept under their name.</p>
      <button class="btn big primary block" data-act="editPerson">${icon('plus')} Add person</button>
      <div class="rows card">${active.map(row).join('') || '<p class="muted pad">No people yet.</p>'}</div>
      ${hidden.length ? `<h3 class="list-title">Hidden (left the team)</h3><div class="rows card">${hidden.map(row).join('')}</div>` : ''}
    </div>`,
  };
}

A.editPerson = (el) => {
  const p = el.dataset.id ? get('people', el.dataset.id) : { name: '', phone: '', active: true };
  const used = p.id && (list('bills').some((b) => b.person === p.id) || list('payments').some((x) => x.person === p.id) || list('lines').some((l) => l.person === p.id || l.boughtBy === p.id));
  const s = openSheet(`${sheetHead(p.id ? 'Edit person' : 'Add person')}
    <form class="sheet-body form" id="personForm">
      ${field('Name *', `<input name="name" value="${esc(p.name)}" required autofocus autocomplete="off">`)}
      ${field('Phone', `<input name="phone" type="tel" inputmode="tel" value="${esc(p.phone || '')}" autocomplete="off">`)}
      ${p.id ? `<label class="check-row boxed"><input type="checkbox" name="hide" ${p.active === false ? 'checked' : ''}><span>Hide (left the team). Their old bills stay.</span></label>` : ''}
      <button class="btn big primary block">Save</button>
      ${p.id && !used ? '<button type="button" class="btn danger-text block" data-del>Delete</button>' : ''}
    </form>`);
  s.querySelector('#personForm').onsubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    if (!f.name.value.trim()) return;
    put('people', { ...p, name: f.name.value.trim(), phone: f.phone.value.trim(), active: !(f.hide?.checked) });
    closeSheet(); toast('Saved');
  };
  s.querySelector('[data-del]')?.addEventListener('click', async () => {
    if (await ask(`Delete ${p.name}?`, { ok: 'Yes, delete', danger: true })) { removeMany([['people', p.id]]); toast('Deleted'); }
  });
};
