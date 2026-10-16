// Small UI helpers: escaping, formatting, toasts, bottom sheets, pickers.

export const A = {}; // click actions: <button data-act="name"> calls A.name(el, event)

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const rs = (n) => (n < 0 ? '−' : '') + '₹' + Math.round(Math.abs(Number(n) || 0)).toLocaleString('en-IN');
export const fq = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const num = (v) => { const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, '')); return Number.isFinite(n) ? n : 0; };

export function ymd(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export function fdate(s, long) {
  if (!s) return 'No date';
  const d = new Date(s + 'T00:00:00');
  if (isNaN(d)) return s;
  const opts = { weekday: 'short', day: 'numeric', month: 'short' };
  if (long || d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
  return d.toLocaleDateString('en-IN', opts);
}
export function ftime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
export function dayLabel(s) {
  if (!s) return '';
  const days = Math.round((new Date(s + 'T00:00:00') - new Date(ymd() + 'T00:00:00')) / 864e5);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 1 && days < 31) return `In ${days} days`;
  if (days < -1 && days > -31) return `${-days} days ago`;
  return '';
}
export const fstamp = (ms) => (ms ? new Date(ms).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '');

// ---------- icons (simple strokes, 24px) ----------
const P = {
  plus: 'M12 5v14M5 12h14',
  back: 'M15 18l-6-6 6-6',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
  users: 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21a7 7 0 0114 0M16 3.5a4 4 0 010 7.5M18 14a6 6 0 014 7',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  rupee: 'M6 4h12M6 9h12M14 20L7 13h3a4 4 0 000-9',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  camera: 'M3 8a2 2 0 012-2h2l2-3h6l2 3h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2zM12 17a4 4 0 100-8 4 4 0 000 8z',
  image: 'M4 4h16v16H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01',
  receipt: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6M9 16h3',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z',
  share: 'M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  chevron: 'M9 6l6 6-6 6',
  x: 'M6 6l12 12M18 6L6 18',
  menu: 'M4 6h16M4 12h16M4 18h10',
  dish: 'M3 13h18M5 13a7 7 0 0114 0M12 6V4M2 17h20',
  box: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
  lock: 'M6 11h12v10H6zM8 11V7a4 4 0 018 0v4',
  download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  upload: 'M12 21V9M7 14l5-5 5 5M4 3h16',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
  text: 'M4 7V5h16v2M12 5v14M9 19h6',
  building: 'M4 21V5l8-3v19M12 9h8v12M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2',
  wallet: 'M3 7a2 2 0 012-2h13v4M3 7v11a2 2 0 002 2h16V9H5a2 2 0 01-2-2zM16 14h.01',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  store: 'M4 9l1-5h14l1 5M4 9v11h16V9M4 9a3 3 0 006 0 3 3 0 006 0 3 3 0 004 0M10 20v-5h4v5',
};
export const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || ''}"/></svg>`;

// ---------- toast ----------
let toastTimer;
export function toast(msg, kind = '') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.className = 'toast show ' + kind;
  t.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---------- bottom sheets (phone back button closes them) ----------
let cur = null;
let afterClose = null;
const closeHooks = new Set();
export const onSheetClosed = (fn) => closeHooks.add(fn);
export const onceSheetClosed = (fn) => { const w = () => { closeHooks.delete(w); fn(); }; closeHooks.add(w); };
export const sheetOpen = () => !!cur;

export function openSheet(html, { onMount, wide } = {}) {
  const replacing = !!cur;
  if (cur) cur.wrap.remove();
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `<div class="sheet-bg" data-close></div><div class="sheet ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(wrap);
  document.body.classList.add('noscroll');
  cur = { wrap };
  if (!replacing) history.pushState({ sheet: 1 }, '');
  wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });
  requestAnimationFrame(() => wrap.classList.add('open'));
  const el = wrap.querySelector('.sheet');
  onMount && onMount(el);
  const first = el.querySelector('[autofocus]');
  if (first) setTimeout(() => first.focus(), 250);
  return el;
}
function removeSheet() {
  if (!cur) return;
  cur.wrap.remove();
  cur = null;
  document.body.classList.remove('noscroll');
  [...closeHooks].forEach((f) => f());
}
export function closeSheet(then) {
  if (!cur) { then && then(); return; }
  afterClose = then || null;
  removeSheet();
  history.back();
}
window.addEventListener('popstate', () => {
  if (cur) removeSheet();
  if (afterClose) { const f = afterClose; afterClose = null; f(); }
});

export const sheetHead = (title, sub = '') => `
  <div class="sheet-head">
    <div><h2>${esc(title)}</h2>${sub ? `<p class="muted">${sub}</p>` : ''}</div>
    <button class="icon-btn" data-close aria-label="Close">${icon('x')}</button>
  </div>`;

export function ask(message, { ok = 'Yes', cancel = 'No, go back', danger = false, detail = '' } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    const done = (v) => { if (answered) return; answered = true; closeSheet(() => resolve(v)); };
    openSheet(`
      <div class="sheet-body center">
        <h2 class="ask-title">${esc(message)}</h2>
        ${detail ? `<p class="muted">${detail}</p>` : ''}
        <div class="stack">
          <button class="btn big ${danger ? 'danger' : 'primary'}" data-ok>${esc(ok)}</button>
          <button class="btn big" data-no>${esc(cancel)}</button>
        </div>
      </div>`, {
      onMount(el) {
        el.querySelector('[data-ok]').onclick = () => done(true);
        el.querySelector('[data-no]').onclick = () => done(false);
      },
    });
    onceSheetClosed(() => { if (!answered) { answered = true; resolve(false); } });
  });
}

// Simple form helpers
export const field = (label, input, hint = '') => `<label class="field"><span class="label">${label}</span>${input}${hint ? `<span class="hint">${hint}</span>` : ''}</label>`;
export const formData = (el) => Object.fromEntries(new FormData(el).entries());

// Shrink a phone photo before upload: max 1400px, JPEG.
export function compressImage(file, max = 1400, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read this photo')); };
    img.src = url;
  });
}

export async function shareText(text) {
  if (navigator.share) {
    try { await navigator.share({ text }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
}
