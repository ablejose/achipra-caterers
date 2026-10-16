// "Who?" pickers - big name buttons, used everywhere a person is chosen.
import { esc, icon, openSheet, closeSheet, sheetHead, onceSheetClosed } from './ui.js';
import { people, me, setMe, put } from './store.js';

export function pickPerson({ title = 'Who?', sub = '', current = '', allowNone = false, noneLabel = 'Nobody' } = {}) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => { if (done) return; done = true; closeSheet(() => resolve(v)); };
    const ppl = people();
    const mine = me();
    openSheet(`
      ${sheetHead(title, sub)}
      <div class="sheet-body">
        ${ppl.length ? '' : '<p class="muted">No names yet. Add the first name below.</p>'}
        <div class="name-grid">
          ${ppl.map((p) => `<button class="name-btn ${p.id === current ? 'on' : ''}" data-id="${esc(p.id)}">
              ${icon('user')}<span>${esc(p.name)}${p.id === mine ? ' <small>(me)</small>' : ''}</span></button>`).join('')}
        </div>
        <form class="inline-add" data-add>
          <input name="name" placeholder="New name" autocomplete="off" aria-label="New name">
          <button class="btn">${icon('plus')} Add</button>
        </form>
        ${allowNone ? `<button class="btn block" data-id="">${esc(noneLabel)}</button>` : ''}
      </div>`, {
      onMount(el) {
        el.querySelectorAll('[data-id]').forEach((b) => { b.onclick = () => finish(b.dataset.id); });
        el.querySelector('[data-add]').onsubmit = (e) => {
          e.preventDefault();
          const name = e.target.name.value.trim();
          if (!name) return;
          const p = put('people', { name, phone: '', active: true });
          finish(p.id);
        };
      },
    });
    onceSheetClosed(() => { if (!done) { done = true; resolve(undefined); } });
  });
}

export async function pickMe() {
  const id = await pickPerson({ title: 'Who is using this phone?', sub: 'Your name is put on the things you tick and the bills you add. You can change it any time.', current: me() });
  if (id !== undefined) setMe(id);
  return id;
}
