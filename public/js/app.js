import { A, esc, icon, toast, sheetOpen, onSheetClosed } from './ui.js';
import { status, subscribe, sync, startPolling, apiJson, settings, me, personName, people } from './store.js';
import { pickMe } from './pick.js';
import { ordersView, orderForm, orderView } from './v-orders.js';
import { moneyView, personView } from './v-money.js';
import { settingsView, settingsSub, settingsEdit } from './v-settings.js';

const app = document.getElementById('app');

// ---------- text size (bigger text for older eyes) ----------
export const TEXT_SIZES = [['normal', 'Normal', '100%'], ['large', 'Large', '112.5%'], ['xl', 'Extra large', '125%']];
export function applyTextSize(v) {
  const s = TEXT_SIZES.find((t) => t[0] === v) || TEXT_SIZES[0];
  document.documentElement.style.fontSize = s[2];
  try { localStorage.setItem('ac.text', s[0]); } catch { /* ignore */ }
}
try { applyTextSize(localStorage.getItem('ac.text') || 'normal'); } catch { /* ignore */ }

// ---------- one click handler for the whole app ----------
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});

// ---------- start ----------
async function boot() {
  let st;
  try { st = await apiJson('/api/status', null, 'GET'); }
  catch { app.innerHTML = `<div class="auth"><h1>Can't reach the app</h1><p class="muted">Check that the office computer is on and the app window is open, then try again.</p><button class="btn big primary block" onclick="location.reload()">Try again</button></div>`; return; }
  if (!st.setup) return setupScreen();
  if (!st.authed) return loginScreen(st.company);
  startApp();
}

function setupScreen() {
  app.innerHTML = `
    <form class="auth" id="setup">
      <div class="logo">A</div>
      <h1>Welcome</h1>
      <p class="muted">Let's set up the app for your team. This is done only once.</p>
      <label class="field"><span class="label">Company name</span><input name="company" value="Achipra Caters" required></label>
      <label class="field"><span class="label">Team password</span><input name="password" type="password" minlength="4" required autocomplete="new-password">
        <span class="hint">Everyone in the team uses this same password. At least 4 letters or numbers.</span></label>
      <label class="field"><span class="label">Type the password again</span><input name="password2" type="password" required autocomplete="new-password"></label>
      <label class="field"><span class="label">Names of people who go to buy</span><textarea name="people" rows="4" placeholder="One name on each line"></textarea>
        <span class="hint">You can add more names later.</span></label>
      <p class="error" id="err" role="alert"></p>
      <button class="btn big primary block">Start using the app</button>
    </form>`;
  document.getElementById('setup').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const err = document.getElementById('err');
    if (f.password.value !== f.password2.value) { err.textContent = 'The two passwords are not the same.'; return; }
    try {
      await apiJson('/api/setup', { company: f.company.value.trim(), password: f.password.value, people: f.people.value.split(/\n|,/) });
      startApp();
    } catch (x) { err.textContent = x.message; }
  };
}

function loginScreen(company) {
  app.innerHTML = `
    <form class="auth" id="login">
      <div class="logo">A</div>
      <h1>${esc(company)}</h1>
      <p class="muted">Enter the team password.</p>
      <label class="field"><span class="label">Password</span><input name="password" type="password" required autofocus autocomplete="current-password"></label>
      <p class="error" id="err" role="alert"></p>
      <button class="btn big primary block">Open</button>
    </form>`;
  document.getElementById('login').onsubmit = async (e) => {
    e.preventDefault();
    try { await apiJson('/api/login', { password: e.target.password.value }); startApp(); }
    catch (x) { document.getElementById('err').textContent = x.message; }
  };
}

let started = false;
async function startApp() {
  app.innerHTML = `
    <header class="top">
      <a class="brand" href="#/orders"><span class="logo sm">A</span><span id="company"></span></a>
      <span id="sync" class="sync" aria-live="polite"></span>
      <button class="me-btn" data-act="pickMe" aria-label="Change who is using this phone">${icon('user')}<span id="meName"></span></button>
    </header>
    <main id="view" class="view"><div class="boot">Loading…</div></main>
    <nav class="tabbar">
      <a href="#/orders" data-tab="orders">${icon('list')}<span>Orders</span></a>
      <a href="#/money" data-tab="money">${icon('wallet')}<span>Money</span></a>
      <a href="#/settings" data-tab="settings">${icon('gear')}<span>Settings</span></a>
    </nav>`;
  if (!started) {
    started = true;
    subscribe(onStore);
    window.addEventListener('hashchange', () => render(true));
    onSheetClosed(() => { if (dirty) render(); });
    startPolling();
  }
  await sync();
  if (!location.hash) location.replace('#/orders');
  render(true);
  updateTop();
  if (!me() && people().length) setTimeout(() => { if (!sheetOpen()) A.pickMe(); }, 400);
}

A.pickMe = async () => { await pickMe(); updateTop(); render(); };

function updateTop() {
  const c = document.getElementById('company');
  if (!c) return;
  c.textContent = settings().company || 'Achipra Caters';
  document.title = settings().company || 'Achipra Caters';
  document.getElementById('meName').textContent = personName(me()) || 'Who are you?';
  const s = document.getElementById('sync');
  if (!status.online) { s.className = 'sync off'; s.textContent = status.pending ? `No internet · ${status.pending} waiting` : 'No internet'; }
  else if (status.pending) { s.className = 'sync busy'; s.textContent = 'Saving…'; }
  else { s.className = 'sync ok'; s.innerHTML = `${icon('check')}Saved`; }
}

// ---------- routing ----------
const routes = [
  [/^#\/orders$/, () => ordersView()],
  [/^#\/new$/, () => orderForm(null)],
  [/^#\/order\/([^/]+)\/edit$/, (id) => orderForm(id)],
  [/^#\/order\/([^/]+)(?:\/(\w+))?$/, (id, tab) => orderView(id, tab || 'list')],
  [/^#\/money$/, () => moneyView()],
  [/^#\/person\/([^/]+)$/, (id) => personView(id)],
  [/^#\/settings$/, () => settingsView()],
  [/^#\/settings\/(\w+)$/, (s) => settingsSub(s)],
  [/^#\/settings\/(\w+)\/([^/]+)$/, (s, id) => settingsEdit(s, id)],
];

let current = { hash: '', live: true };
let dirty = false;

export function render(navigated = false) {
  const view = document.getElementById('view');
  if (!view) return;
  const hash = location.hash || '#/orders';
  let res = null;
  for (const [re, fn] of routes) {
    const m = re.exec(hash);
    if (m) { res = fn(...m.slice(1).map((x) => (x ? decodeURIComponent(x) : x))); break; }
  }
  if (!res) { location.replace('#/orders'); return; }
  const sameRoute = hash === current.hash;
  const y = window.scrollY;
  view.innerHTML = res.html;
  current = { hash, live: res.live !== false };
  dirty = false;
  res.mount && res.mount(view);
  const tab = hash.startsWith('#/money') || hash.startsWith('#/person') ? 'money' : hash.startsWith('#/settings') ? 'settings' : 'orders';
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === tab));
  if (navigated && !sameRoute) window.scrollTo(0, 0); else window.scrollTo(0, y);
  updateTop();
}

function busyTyping() {
  const a = document.activeElement;
  return a && a.closest('#view') && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
}

function onStore(kind) {
  if (kind === 'status') return updateTop();
  if (kind === 'auth') { toast('Please log in again'); boot(); return; }
  if (kind === 'storage-full') { toast('Phone storage is full. Connect to internet so changes can be sent.', 'bad'); return; }
  // Data changed (here or on another phone): redraw the screen unless someone is filling a form.
  if (!current.live) return;
  if (sheetOpen() || busyTyping()) { dirty = true; return; }
  render();
}

boot();
