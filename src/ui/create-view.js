function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const SEED_SLIDES = [
  { t: 'Opening', b: 'Why this matters' },
  { t: 'The Idea', b: 'One sentence version' },
  { t: 'Next Step', b: 'What happens now' },
];

/**
 * CREATE VIEW - Documents / Presentations / Writing / Images (Section 30).
 * Munka-eszkozok chat helyett: szerkeszto, diak, jegyzet - mind perzisztens.
 */
export class CreateView {
  constructor({ stateStore }) {
    this.stateStore = stateStore;
    this.tab = 'doc';
    this.slideIdx = 0;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-create';
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

  #frame(title, inner) {
    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div>' +
          '<span class="dx-jobs__chip">CREATE &#183; FUNCTION</span>' +
          '<h2 class="dx-jobs__title">' + title + '</h2>' +
        '</div>' +
        '<button class="dx-jobs__close" aria-label="close">&#10005;</button>' +
      '</header>' +
      '<div class="dx-create__tabs">' +
        '<button class="dx-create__tab' + (this.tab === 'doc' ? ' is-active' : '') + '" data-tab="doc">DOC</button>' +
        '<button class="dx-create__tab' + (this.tab === 'slides' ? ' is-active' : '') + '" data-tab="slides">SLIDES</button>' +
        '<button class="dx-create__tab' + (this.tab === 'scratch' ? ' is-active' : '') + '" data-tab="scratch">SCRATCH</button>' +
        '<button class="dx-create__tab' + (this.tab === 'board' ? ' is-active' : '') + '" data-tab="board">BOARD</button>' +
      '</div>' +
      '<div id="dx-crbody">' + inner + '</div>';
    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());
    this.el.querySelectorAll('.dx-create__tab').forEach((b) =>
      b.addEventListener('click', () => { this.tab = b.dataset.tab; this.render(); }));
    this.#renderTab();
  }

  render() {
    const titles = { doc: 'DOCUMENT', slides: 'PRESENTATION', scratch: 'SCRATCHPAD', board: 'VISUAL BOARD' };
    this.#frame(titles[this.tab] || 'CREATE', '');
  }

  #renderTab() {
    const body = this.el.querySelector('#dx-crbody');
    if (!body) return;
    if (this.tab === 'doc') return this.#doc(body);
    if (this.tab === 'slides') return this.#slides(body);
    if (this.tab === 'scratch') return this.#scratch(body);
    this.#board(body);
  }

  /* ----- DOCUMENT ----- */
  #doc(body) {
    const d = this.stateStore.getKV('docDraft', { title: '', body: '' });

    body.innerHTML =
      '<input class="dx-field" id="dx-doctitle" placeholder="Document title..." maxlength="80" value="' + esc(d.title) + '" />' +
      '<textarea class="dx-ta" id="dx-docbody" placeholder="Start writing... everything saves itself as you type.">' + esc(d.body) + '</textarea>' +
      '<div class="dx-create__meta" id="dx-docmeta"></div>';

    const ti = body.querySelector('#dx-doctitle');
    const ta = body.querySelector('#dx-docbody');
    const meta = body.querySelector('#dx-docmeta');

    const paintMeta = () => {
      const words = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
      meta.textContent = words + ' WORDS &#183; AUTOSAVED';
    };
    paintMeta();

    const save = () => {
      d.title = ti.value;
      d.body = ta.value;
      this.stateStore.setKV('docDraft', d);
      paintMeta();
    };
    ti.addEventListener('input', save);
    ta.addEventListener('input', save);
  }

  /* ----- SLIDES ----- */
  #slides(body) {
    const slides = this.stateStore.getKV('slides', SEED_SLIDES.map((s) => ({ ...s })));
    if (this.slideIdx >= slides.length) this.slideIdx = Math.max(0, slides.length - 1);

    const rows = slides.map((s, i) =>
      '<div class="dx-life__row">' +
        '<span class="dx-slide__num' + (i === this.slideIdx ? ' is-cur' : '') + '" data-go="' + i + '">' + (i + 1) + '</span>' +
        '<input class="dx-field" data-i="' + i + '" value="' + esc(s.t) + '" maxlength="50" />' +
        '<button class="dx-chip__x" data-del="' + i + '">&#215;</button>' +
      '</div>').join('');

    const cur = slides[this.slideIdx];

    body.innerHTML =
      '<div class="dx-jobs__meta">' + slides.length + ' SLIDES</div>' +
      '<div class="dx-slideview">' +
        '<b>' + esc(cur ? cur.t : '') + '</b>' +
        '<span>' + esc(cur ? cur.b : '') + '</span>' +
        '<div class="dx-slideview__nav">' +
          '<button class="dx-btn dx-btn--ghost" id="dx-prev">PREV</button>' +
          '<span>' + (slides.length ? (this.slideIdx + 1) + ' / ' + slides.length : '0 / 0') + '</span>' +
          '<button class="dx-btn dx-btn--ghost" id="dx-next">NEXT</button>' +
        '</div>' +
      '</div>' +
      '<div class="dx-life__list">' + rows + '</div>' +
      '<div class="dx-addrow">' +
        '<input class="dx-field" id="dx-st" placeholder="Slide title..." maxlength="50" />' +
        '<button class="dx-btn" id="dx-sadd">ADD</button>' +
      '</div>';

    const persist = () => this.stateStore.setKV('slides', slides);

    body.querySelectorAll('.dx-field[data-i]').forEach((inp) =>
      inp.addEventListener('change', () => {
        const i = parseInt(inp.dataset.i, 10);
        if (slides[i]) { slides[i].t = inp.value.trim(); persist(); this.#renderTab(); }
      }));
    body.querySelectorAll('[data-del]').forEach((b) =>
      b.addEventListener('click', () => {
        slides.splice(parseInt(b.dataset.del, 10), 1);
        this.slideIdx = Math.min(this.slideIdx, Math.max(0, slides.length - 1));
        persist(); this.#renderTab();
      }));
    body.querySelectorAll('[data-go]').forEach((n) =>
      n.addEventListener('click', () => { this.slideIdx = parseInt(n.dataset.go, 10); this.#renderTab(); }));

    body.querySelector('#dx-prev').addEventListener('click', () => {
      if (this.slideIdx > 0) { this.slideIdx--; this.#renderTab(); }
    });
    body.querySelector('#dx-next').addEventListener('click', () => {
      if (this.slideIdx < slides.length - 1) { this.slideIdx++; this.#renderTab(); }
    });
    body.querySelector('#dx-sadd').addEventListener('click', () => {
      const v = body.querySelector('#dx-st').value.trim();
      if (!v) return;
      slides.push({ t: v, b: '' });
      this.slideIdx = slides.length - 1;
      persist(); this.#renderTab();
    });
  }

  /* ----- SCRATCH ----- */
  #scratch(body) {
    const txt = this.stateStore.getKV('scratch', '');

    body.innerHTML =
      '<div class="dx-jobs__meta">FREE WRITING &#183; NO STRUCTURE, NO PRESSURE</div>' +
      '<textarea class="dx-ta" id="dx-scratch" style="min-height:230px;" placeholder="' +
        esc('Warm-up: write badly on purpose for two minutes.') + '">' + esc(txt) + '</textarea>' +
      '<div class="dx-create__meta">AUTOSAVED</div>';

    const ta = body.querySelector('#dx-scratch');
    ta.addEventListener('input', () => this.stateStore.setKV('scratch', ta.value));
  }

  /* ----- BOARD ----- */
  #board(body) {
    const items = this.stateStore.getKV('board', []);

    const rows = items.map((n, i) =>
      '<div class="dx-life__note">' +
        '<span>' + esc(n) + '</span>' +
        '<button class="dx-chip__x" data-del="' + i + '">&#215;</button>' +
      '</div>').join('');

    body.innerHTML =
      '<div class="dx-jobs__meta">' + items.length + ' VISUAL IDEAS</div>' +
      '<div class="dx-life__list">' + (rows || '<span class="dx-prof__empty">Describe an image you imagine - colors, mood, subject.</span>') + '</div>' +
      '<div class="dx-addrow">' +
        '<input class="dx-field" id="dx-bi" placeholder="e.g. fog over a neon harbor, wide shot..." maxlength="120" />' +
        '<button class="dx-btn" id="dx-badd">ADD</button>' +
      '</div>';

    body.querySelectorAll('[data-del]').forEach((b) =>
      b.addEventListener('click', () => { items.splice(parseInt(b.dataset.del, 10), 1); this.stateStore.setKV('board', items); this.#renderTab(); }));

    const add = () => {
      const v = body.querySelector('#dx-bi').value.trim();
      if (!v) return;
      items.unshift(v);
      while (items.length > 40) items.pop();
      this.stateStore.setKV('board', items);
      this.#renderTab();
    };
    body.querySelector('#dx-badd').addEventListener('click', add);
    body.querySelector('#dx-bi').addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
  }
}