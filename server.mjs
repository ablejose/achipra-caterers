// Achipra Caters – internal tool server.
// Plain Node (22.5+), no npm packages. Data lives in ./data (SQLite file + bill photos).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { seedRecords } from './seed.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 8080);
const DATA = process.env.DATA_DIR || path.join(ROOT, 'data');
const UPLOADS = path.join(DATA, 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

const COLLS = new Set(['settings', 'people', 'items', 'dishes', 'menus', 'orders', 'lines', 'bills', 'payments']);
const ID_RE = /^[A-Za-z0-9_.:-]{1,80}$/;
const PHOTO_RE = /^[a-z0-9_-]{6,64}\.(jpg|jpeg|png|webp)$/i;
const COOKIE = 'ac_session';
const SESSION_DAYS = 60;

// ---------- database ----------
const db = new DatabaseSync(path.join(DATA, 'achipra.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS records (
    coll TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL,
    seq INTEGER NOT NULL, deleted INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (coll, id));
  CREATE INDEX IF NOT EXISTS records_seq ON records(seq);
  CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, created INTEGER NOT NULL);
`);

const q = {
  maxSeq: db.prepare('SELECT COALESCE(MAX(seq), 0) AS s FROM records'),
  upsert: db.prepare(`INSERT INTO records (coll, id, data, seq, deleted) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(coll, id) DO UPDATE SET data = excluded.data, seq = excluded.seq, deleted = excluded.deleted`),
  since: db.prepare('SELECT coll, id, data, deleted FROM records WHERE seq > ? ORDER BY seq'),
  live: db.prepare('SELECT coll, id, data FROM records WHERE deleted = 0'),
  count: db.prepare('SELECT COUNT(*) AS n FROM records'),
  clear: db.prepare('DELETE FROM records'),
  getMeta: db.prepare('SELECT value FROM meta WHERE key = ?'),
  setMeta: db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'),
  addSession: db.prepare('INSERT INTO sessions (token, created) VALUES (?, ?)'),
  getSession: db.prepare('SELECT created FROM sessions WHERE token = ?'),
  delSession: db.prepare('DELETE FROM sessions WHERE token = ?'),
  delOtherSessions: db.prepare('DELETE FROM sessions WHERE token <> ?'),
};

let seq = q.maxSeq.get().s;
const meta = (k) => q.getMeta.get(k)?.value ?? null;
const setMeta = (k, v) => q.setMeta.run(k, String(v));
if (!meta('epoch')) setMeta('epoch', crypto.randomBytes(6).toString('hex'));

function writeRec(coll, id, data, deleted = 0) {
  seq += 1;
  q.upsert.run(coll, id, deleted ? '{}' : JSON.stringify(data), seq, deleted ? 1 : 0);
}

function tx(fn) {
  db.exec('BEGIN');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { db.exec('ROLLBACK'); throw e; }
}

if (!meta('seeded') && q.count.get().n === 0) {
  tx(() => { for (const r of seedRecords()) writeRec(r.coll, r.id, r.data); setMeta('seeded', '1'); });
  console.log('Loaded default items, dishes and menus.');
}

// ---------- auth ----------
function hashPw(pw, salt = crypto.randomBytes(16).toString('hex')) {
  return salt + ':' + crypto.scryptSync(pw, salt, 32).toString('hex');
}
function checkPw(pw, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const a = Buffer.from(hash, 'hex');
  const b = crypto.scryptSync(pw, salt, 32);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function cookieToken(req) {
  const m = /(?:^|;\s*)ac_session=([a-f0-9]{64})/.exec(req.headers.cookie || '');
  return m ? m[1] : null;
}
function authed(req) {
  const t = cookieToken(req);
  if (!t) return false;
  const s = q.getSession.get(t);
  if (!s) return false;
  if (Date.now() - s.created > SESSION_DAYS * 864e5) { q.delSession.run(t); return false; }
  return true;
}
function newSession(res) {
  const t = crypto.randomBytes(32).toString('hex');
  q.addSession.run(t, Date.now());
  res.setHeader('Set-Cookie', `${COOKIE}=${t}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`);
  return t;
}
const fails = new Map(); // ip -> { n, until }
function throttled(ip) { const f = fails.get(ip); return f && f.until > Date.now(); }
function noteFail(ip) {
  const f = fails.get(ip) || { n: 0, until: 0 };
  f.n += 1;
  if (f.n >= 5) { f.until = Date.now() + 60_000; f.n = 0; }
  fails.set(ip, f);
}

// ---------- http helpers ----------
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
};
function send(res, status, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body);
  const payload = isBuf || typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': isBuf ? 'application/octet-stream' : typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json',
    'Cache-Control': 'no-store', ...headers,
  });
  res.end(payload);
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('too big'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function readJson(req, limit = 2_000_000) {
  const buf = await readBody(req, limit);
  try { return JSON.parse(buf.toString('utf8') || '{}'); }
  catch { throw Object.assign(new Error('bad json'), { status: 400 }); }
}
function serveFile(res, file, cache) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Not found');
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size, 'Cache-Control': cache,
    });
    fs.createReadStream(file).pipe(res);
  });
}
function isImage(buf) {
  if (buf.length < 12) return false;
  if (buf[0] === 0xff && buf[1] === 0xd8) return true; // jpeg
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return true; // png
  return buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP';
}

// ---------- routes ----------
async function api(req, res, url) {
  const p = url.pathname;
  const ip = req.socket.remoteAddress || '';

  if (p === '/api/status' && req.method === 'GET') {
    const company = (() => { try { return JSON.parse(db.prepare("SELECT data FROM records WHERE coll='settings' AND id='main'").get()?.data || '{}').company; } catch { return null; } })();
    return send(res, 200, { setup: !!meta('pw'), authed: authed(req), company: company || 'Achipra Caters' });
  }

  if (p === '/api/setup' && req.method === 'POST') {
    if (meta('pw')) return send(res, 409, { error: 'Already set up' });
    const b = await readJson(req);
    const pw = String(b.password || '');
    if (pw.length < 4) return send(res, 400, { error: 'Password must be at least 4 characters' });
    tx(() => {
      setMeta('pw', hashPw(pw));
      writeRec('settings', 'main', { id: 'main', company: String(b.company || 'Achipra Caters').slice(0, 80), updatedAt: Date.now() });
      const names = Array.isArray(b.people) ? b.people : [];
      names.map((n) => String(n).trim()).filter(Boolean).slice(0, 50).forEach((name, i) => {
        const id = 'p' + Date.now().toString(36) + i;
        writeRec('people', id, { id, name: name.slice(0, 40), phone: '', active: true, createdAt: Date.now() });
      });
    });
    newSession(res);
    return send(res, 200, { ok: true });
  }

  if (p === '/api/login' && req.method === 'POST') {
    if (throttled(ip)) return send(res, 429, { error: 'Too many tries. Wait one minute.' });
    const b = await readJson(req);
    if (!checkPw(String(b.password || ''), meta('pw'))) { noteFail(ip); return send(res, 401, { error: 'Wrong password' }); }
    fails.delete(ip);
    newSession(res);
    return send(res, 200, { ok: true });
  }

  if (p === '/api/logout' && req.method === 'POST') {
    const t = cookieToken(req); if (t) q.delSession.run(t);
    return send(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0` });
  }

  // everything below needs a login
  if (!authed(req)) return send(res, 401, { error: 'Please log in' });

  if (p === '/api/password' && req.method === 'POST') {
    const b = await readJson(req);
    if (!checkPw(String(b.old || ''), meta('pw'))) return send(res, 400, { error: 'Current password is wrong' });
    if (String(b.password || '').length < 4) return send(res, 400, { error: 'New password must be at least 4 characters' });
    setMeta('pw', hashPw(String(b.password)));
    q.delOtherSessions.run(cookieToken(req)); // other phones must log in again
    return send(res, 200, { ok: true });
  }

  if (p === '/api/sync' && req.method === 'GET') {
    const epoch = meta('epoch');
    const reset = url.searchParams.get('epoch') !== epoch;
    const since = reset ? 0 : Number(url.searchParams.get('since') || 0);
    const rows = reset ? q.live.all().map((r) => ({ ...r, deleted: 0 })) : q.since.all(since);
    const records = rows.map((r) => ({ coll: r.coll, id: r.id, deleted: !!r.deleted, data: r.deleted ? null : JSON.parse(r.data) }));
    return send(res, 200, { epoch, seq, reset, records });
  }

  const m = /^\/api\/rec\/([a-z]+)\/([^/]+)$/.exec(p);
  if (m) {
    const coll = m[1]; const id = decodeURIComponent(m[2]);
    if (!COLLS.has(coll) || !ID_RE.test(id)) return send(res, 400, { error: 'Bad record' });
    if (req.method === 'PUT') {
      const data = await readJson(req, 300_000);
      if (!data || typeof data !== 'object' || Array.isArray(data)) return send(res, 400, { error: 'Bad data' });
      data.id = id;
      writeRec(coll, id, data);
      return send(res, 200, { seq });
    }
    if (req.method === 'DELETE') { writeRec(coll, id, null, 1); return send(res, 200, { seq }); }
  }

  if (p === '/api/upload' && req.method === 'POST') {
    const name = url.searchParams.get('name') || '';
    if (!PHOTO_RE.test(name)) return send(res, 400, { error: 'Bad file name' });
    const buf = await readBody(req, 12_000_000);
    if (!isImage(buf)) return send(res, 400, { error: 'Only photos can be uploaded' });
    const file = path.join(UPLOADS, name);
    if (!fs.existsSync(file)) fs.writeFileSync(file, buf);
    return send(res, 200, { ok: true, name });
  }

  if (p === '/api/export' && req.method === 'GET') {
    const records = q.live.all().map((r) => ({ coll: r.coll, id: r.id, data: JSON.parse(r.data) }));
    const stamp = new Date().toISOString().slice(0, 10);
    return send(res, 200, { app: 'achipra-caters', exportedAt: new Date().toISOString(), records }, {
      'Content-Disposition': `attachment; filename="achipra-backup-${stamp}.json"`,
    });
  }

  if (p === '/api/import' && req.method === 'POST') {
    const b = await readJson(req, 50_000_000);
    if (b.app !== 'achipra-caters' || !Array.isArray(b.records)) return send(res, 400, { error: 'This is not an Achipra backup file' });
    tx(() => {
      q.clear.run();
      for (const r of b.records) if (COLLS.has(r.coll) && ID_RE.test(r.id) && r.data) writeRec(r.coll, r.id, r.data);
      setMeta('epoch', crypto.randomBytes(6).toString('hex')); // every phone reloads everything
    });
    return send(res, 200, { ok: true, count: b.records.length });
  }

  return send(res, 404, { error: 'Not found' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    if (url.pathname.startsWith('/uploads/')) {
      if (!authed(req)) return send(res, 401, 'Please log in');
      const name = decodeURIComponent(url.pathname.slice(9));
      if (!PHOTO_RE.test(name)) return send(res, 404, 'Not found');
      return serveFile(res, path.join(UPLOADS, name), 'private, max-age=31536000, immutable');
    }
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/') rel = '/index.html';
    const file = path.normalize(path.join(PUBLIC, rel));
    if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'No');
    return serveFile(res, file, 'no-cache');
  } catch (e) {
    if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : 'Server error' });
    if (!e.status) console.error(e);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address);
  console.log('\n  Achipra Caters is running.\n');
  console.log(`  On this computer:   http://localhost:${PORT}`);
  for (const ip of ips) console.log(`  On phones (same Wi-Fi):  http://${ip}:${PORT}`);
  console.log(`\n  Data folder: ${DATA}\n  Keep this window open. Close it to stop the app.\n`);
});
