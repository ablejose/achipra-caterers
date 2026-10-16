// Data store: everything lives in memory, changes go to the server through an
// outbox kept in the phone's storage, so ticks and bills made without signal
// are not lost - they are sent when the connection comes back.

export const COLLS = ['settings', 'people', 'items', 'dishes', 'menus', 'orders', 'lines', 'bills', 'payments'];
export const db = Object.fromEntries(COLLS.map((c) => [c, new Map()]));
export const photoCache = new Map(); // photo name -> data URL, for photos not uploaded yet

const OUTBOX = 'ac.outbox.v1';
let outbox = [];
try { outbox = JSON.parse(localStorage.getItem(OUTBOX) || '[]'); } catch { outbox = []; }
outbox.forEach((o) => o.op === 'upload' && photoCache.set(o.name, o.dataUrl));

let seq = 0;
let epoch = '';
let flushing = false;
export const status = { online: true, pending: outbox.length, loaded: false };

const subs = new Set();
export const subscribe = (fn) => subs.add(fn);
const emit = (kind) => subs.forEach((f) => f(kind));

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const list = (c) => [...db[c].values()];
export const get = (c, id) => db[c].get(id);
export const settings = () => db.settings.get('main') || { id: 'main', company: 'Achipra Caters' };

function saveOutbox() {
  try { localStorage.setItem(OUTBOX, JSON.stringify(outbox)); }
  catch { emit('storage-full'); }
  status.pending = outbox.length;
}

function enqueue(op) {
  op.key = op.op === 'upload' ? 'u:' + op.name : op.coll + '/' + op.id;
  // A newer change to the same record replaces an older one still waiting (but not one being sent right now).
  outbox = outbox.filter((o, i) => o.key !== op.key || (flushing && i === 0));
  outbox.push(op);
  saveOutbox();
  emit('status');
  flush();
}

export function put(coll, rec) {
  if (!rec.id) rec.id = uid();
  if (!rec.createdAt) rec.createdAt = Date.now();
  rec.updatedAt = Date.now();
  db[coll].set(rec.id, rec);
  enqueue({ op: 'put', coll, id: rec.id, data: rec });
  emit('local');
  return rec;
}
export function putMany(entries) {
  for (const [coll, rec] of entries) {
    if (!rec.id) rec.id = uid();
    if (!rec.createdAt) rec.createdAt = Date.now();
    rec.updatedAt = Date.now();
    db[coll].set(rec.id, rec);
    enqueue({ op: 'put', coll, id: rec.id, data: rec });
  }
  emit('local');
}
export function remove(coll, id) {
  db[coll].delete(id);
  enqueue({ op: 'del', coll, id });
  emit('local');
}
export function removeMany(entries) {
  for (const [coll, id] of entries) { db[coll].delete(id); enqueue({ op: 'del', coll, id }); }
  emit('local');
}
export function queuePhoto(name, dataUrl) {
  photoCache.set(name, dataUrl);
  enqueue({ op: 'upload', name, dataUrl });
}
export const photoSrc = (name) => photoCache.get(name) || '/uploads/' + encodeURIComponent(name);

function dataUrlToBlob(u) {
  const [head, b64] = u.split(',');
  const type = /data:([^;]+)/.exec(head)[1];
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type });
}

function setOnline(v) {
  if (status.online !== v) { status.online = v; emit('status'); }
}

export async function flush() {
  if (flushing || !outbox.length) return;
  flushing = true;
  emit('status');
  try {
    while (outbox.length) {
      const op = outbox[0];
      let res;
      if (op.op === 'upload') {
        const blob = dataUrlToBlob(op.dataUrl);
        res = await fetch('/api/upload?name=' + encodeURIComponent(op.name), { method: 'POST', body: blob, headers: { 'Content-Type': blob.type } });
      } else {
        const url = `/api/rec/${op.coll}/${encodeURIComponent(op.id)}`;
        res = op.op === 'put'
          ? await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(op.data) })
          : await fetch(url, { method: 'DELETE' });
      }
      if (res.status === 401) { emit('auth'); break; }
      if (res.status >= 500) throw new Error('server');
      if (!res.ok) console.warn('Server refused a change, skipping it', op.key, res.status);
      outbox.shift();
      saveOutbox();
      setOnline(true);
    }
  } catch {
    setOnline(false);
  } finally {
    flushing = false;
    status.pending = outbox.length;
    emit('status');
  }
}

function overlayOutbox() {
  for (const o of outbox) {
    if (o.op === 'put') db[o.coll]?.set(o.id, o.data);
    if (o.op === 'del') db[o.coll]?.delete(o.id);
  }
}

export async function sync() {
  await flush();
  try {
    const r = await fetch(`/api/sync?since=${seq}&epoch=${encodeURIComponent(epoch)}`);
    if (r.status === 401) { emit('auth'); return; }
    if (!r.ok) throw new Error('sync');
    const j = await r.json();
    const waiting = new Set(outbox.map((o) => o.key));
    let changed = false;
    if (j.reset) { COLLS.forEach((c) => db[c].clear()); changed = true; }
    for (const rec of j.records) {
      const m = db[rec.coll];
      if (!m || waiting.has(rec.coll + '/' + rec.id)) continue;
      if (rec.deleted) { if (m.delete(rec.id)) changed = true; }
      else { m.set(rec.id, rec.data); changed = true; }
    }
    if (j.reset) overlayOutbox();
    seq = j.seq;
    epoch = j.epoch;
    status.loaded = true;
    setOnline(true);
    if (changed) emit('remote');
  } catch {
    setOnline(false);
  }
}

let timer;
export function startPolling() {
  clearInterval(timer);
  timer = setInterval(() => { if (document.visibilityState === 'visible') sync(); }, 4000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync(); });
  window.addEventListener('online', () => sync());
}

export async function apiJson(url, body, method = 'POST') {
  const r = await fetch(url, {
    method, headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  let j = {};
  try { j = await r.json(); } catch { /* empty */ }
  if (!r.ok) throw new Error(j.error || 'Something went wrong. Try again.');
  return j;
}

// ---------- this phone ----------
export const me = () => { try { return localStorage.getItem('ac.me') || ''; } catch { return ''; } };
export const setMe = (id) => { try { localStorage.setItem('ac.me', id || ''); } catch { /* ignore */ } };
export const personName = (id) => (id ? get('people', id)?.name || 'Someone' : '');
export const people = () => list('people').filter((p) => p.active !== false).sort((a, b) => a.name.localeCompare(b.name));
