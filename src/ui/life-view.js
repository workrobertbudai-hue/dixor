function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const SEED_PLAN = [
  { t: '08:00', l: 'Morning routine' },
  { t: '09:30', l: 'Deep work block' },
  { t: '13:00', l: 'Walk and lunch' },
  { t: '17:30', l: 'Learning session' },
];
const SEED_PACK = ['Passport / ID', 'Phone charger', 'Power adapter', 'Medication', 'Headphones', 'Reusable bottle'];

/**
 * LIFE VIEW - Planning / Travel / Organization (Section 6).
 * Harom fül: napi terv, pakololista, gyorsjegyzetek - mind perzisztens.
 */
export class LifeView {
  constructor({ stateStore }) {
    this.stateStore = stateStore;
    this.tab = 'plan';
    this._d = null;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-life';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
    }, true);
  }

  get isOpen() { return this.el.classList.contains('is-open'); }

  open(tab) {
    if (tab) this.tab = tab;
    this.render();
    this.el.style.display = '';
    requestAnimationFrame(() => this.el.classList.add('is-open'));
  }

  close() {
    this.el.classList.remove('is-open');
    setTimeout(() => { if (!this.isOpen) this.el.style.display = 'none'; }, 260);
  }

  #data() {
    if (!this._d) this._d = this.stateStore.getLife();
    return this._d;
  }
  #save() { this.stateStore.saveLife(this._d); }

  #frame(title, inner) {
    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div>' +
          '<span class="dx-jobs__chip">LIFE &#183; FUNCTION</span>' +
          '<h2 class="dx-jobs__title">' + title + '</h2>' +
        '</div>' +
        '<button class="dx-jobs__close" aria-label="close">&#10005;</button>' +
      '</header>' +
      '<div class="dx-life__tabs">' +
        '<button class="dx-life__tab' + (this.tab === 'plan' ? ' is-active' : '') + '" data-tab="plan">PLAN</button>' +
        '<button class="dx-life__tab' + (this.tab === 'travel' ? ' is-active' : '') + '" data-tab="travel">TRAVEL</button>' +
        '<button class="dx-life__tab' + (this.tab === 'notes' ? ' is-active' : '') + '" data-tab="notes">NOTES</button>' +
      '</div>' +
      '<div id="dx-lifebody">' + inner + '</div>';
    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());
    this.el.querySelectorAll('.dx-life__tab').forEach((b) =>
      b.addEventListener('click', () => { this.tab = b.dataset.tab; this.render(); }));
    this.#renderTab();
  }

  render() {
    const titles = { plan: 'DAILY PLAN', travel: 'TRAVEL PACKING', notes: 'QUICK NOTES' };
    this.#frame(titles[this.tab] || 'LIFE', '');
  }

  #renderTab() {
    const body = this.el.querySelector('#dx-lifebody');
    if (!body) return;

    if (this.tab === 'plan') return this.#plan(body);
    if (this.tab === 'travel') return this.#travel(body);
    this.#notes(body);
  }

  /* ----- PLAN ----- */
  #plan(body) {
    const d = this.#data();
    if (!d.planSeeded) { d.plan = SEED_PLAN.map((x) => ({ ...x })); d.planSeeded = true; this.#save(); }

    const rows = d.plan.map((it, i) =>
      '<div class="dx-life__row">' +
        '<input class="dx-field dx-life__time" data-i="' + i + '" data-k="t" value="' + esc(it.t) + '" maxlength="6" />' +
        '<input class="dx-field" data-i="' + i + '" data-k="l" value="' + esc(it.l) + '" maxlength="60" />' +
        '<button class="dx-chip__x" data-del="' + i + '">&#215;</button>' +
      '</div>').join('');

    body.innerHTML =
      '<div class="dx-jobs__meta">' + d.plan.length + ' BLOCKS TODAY</div>' +
      '<div class="dx-life__list">' + (rows || '<span class="dx-prof__empty">Empty day - add your first block.</span>') + '</div>' +
      '<div class="dx-addrow">' +
        '<input class="dx-field dx-life__time" id="dx-pt" placeholder="14:00" maxlength="6" />' +
        '<input class="dx-field" id="dx-pl" placeholder="New block..." maxlength="60" />' +
        '<button class="dx-btn" id="dx-padd">ADD</button>' +
      '</div>';

    body.querySelectorAll('.dx-field[data-i]').forEach((inp) =>
      inp.addEventListener('change', () => {
        const i = parseInt(inp.dataset.i, 10);
        if (d.plan[i]) { d.plan[i][inp.dataset.k] = inp.value.trim(); this.#save(); }
      }));
    body.querySelectorAll('[data-del]').forEach((b) =>
      b.addEventListener('click', () => { d.plan.splice(parseInt(b.dataset.del, 10), 1); this.#save(); this.#renderTab(); }));

    const add = () => {
      const t = body.querySelector('#dx-pt').value.trim() || '--:--';
      const l = body.querySelector('#dx-pl').value.trim();
      if (!l) return;
      d.plan.push({ t: t, l: l });
      this.#save();
      this.#renderTab();
    };
    body.querySelector('#dx-padd').addEventListener('click', add);
    body.querySelector('#dx-pl').addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
  }

  /* ----- TRAVEL ----- */
  #travel(body) {
    const d = this.#data();
    if (!d.packItems.length && !d.packSeeded) { d.packItems = [...SEED_PACK]; d.packSeeded = true; this.#save(); }

    const total = d.packItems.length || 1;
    const done = d.packItems.filter((x) => d.pack[x]).length;
    const pct = Math.round((done / total) * 100);

    const rows = d.packItems.map((item) =>
      '<label class="dx-life__check' + (d.pack[item] ? ' is-done' : '') + '">' +
        '<input type="checkbox" data-item="' + esc(item) + '"' + (d.pack[item] ? ' checked' : '') + ' />' +
        '<span>' + esc(item) + '</span>' +
      '</label>').join('');

    body.innerHTML =
      '<div class="dx-jobs__meta">PACKED ' + done + ' / ' + d.packItems.length + '</div>' +
      '<div class="dx-disc__bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="dx-life__list">' + rows + '</div>' +
      '<div class="dx-addrow">' +
        '<input class="dx-field" id="dx-ni" placeholder="Add item..." maxlength="50" />' +
        '<button class="dx-btn" id="dx-iadd">ADD</button>' +
        '<button class="dx-btn dx-btn--ghost" id="dx-ireset">CLEAR</button>' +
      '</div>';

    body.querySelectorAll('input[type="checkbox"]').forEach((c) =>
      c.addEventListener('change', () => {
        d.pack[c.dataset.item] = c.checked;
        this.#save();
        this.#renderTab();
      }));
    body.querySelector('#dx-iadd').addEventListener('click', () => {
      const v = body.querySelector('#dx-ni').value.trim();
      if (v && !d.packItems.includes(v)) { d.packItems.push(v); this.#save(); this.#renderTab(); }
    });
    body.querySelector('#dx-ireset').addEventListener('click', () => {
      d.pack = {};
      this.#save();
      this.#renderTab();
    });
  }

  /* ----- NOTES ----- */
  #notes(body) {
    const d = this.#data();

    const rows = d.notes.map((n, i) =>
      '<div class="dx-life__note">' +
        '<span>' + esc(n) + '</span>' +
        '<button class="dx-chip__x" data-del="' + i + '">&#215;</button>' +
      '</div>').join('');

    body.innerHTML =
      '<div class="dx-jobs__meta">' + d.notes.length + ' NOTES</div>' +
      '<div class="dx-life__list">' + (rows || '<span class="dx-prof__empty">No notes yet.</span>') + '</div>' +
      '<div class="dx-addrow">' +
        '<input class="dx-field" id="dx-nn" placeholder="Quick thought..." maxlength="120" />' +
        '<button class="dx-btn" id="dx-nadd">ADD</button>' +
      '</div>';

    body.querySelectorAll('[data-del]').forEach((b) =>
      b.addEventListener('click', () => { d.notes.splice(parseInt(b.dataset.del, 10), 1); this.#save(); this.#renderTab(); }));

    const add = () => {
      const v = body.querySelector('#dx-nn').value.trim();
      if (!v) return;
      d.notes.unshift(v);
      while (d.notes.length > 40) d.notes.pop();
      this.#save();
      this.#renderTab();
    };
    body.querySelector('#dx-nadd').addEventListener('click', add);
    body.querySelector('#dx-nn').addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
  }
}