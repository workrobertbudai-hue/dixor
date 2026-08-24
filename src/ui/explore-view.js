import SEEDS from '../data/explore-seeds.json';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * EXPLORE VIEW - nyilt felfedezes (Sections 6-7).
 * Curiosity Seeds: erdeklodes -> generalt felfedezo-kerdesek.
 * Discovery Journal: amiket megoriztel, datummal.
 */
export class ExploreView {
  constructor({ stateStore }) {
    this.stateStore = stateStore;
    this.tab = 'seeds';
    this.grown = [];

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-explore';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
    }, true);
  }

  get isOpen() { return this.el.classList.contains('is-open'); }

  open() {
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
          '<span class="dx-jobs__chip">EXPLORE &#183; FUNCTION</span>' +
          '<h2 class="dx-jobs__title">' + title + '</h2>' +
        '</div>' +
        '<button class="dx-jobs__close" aria-label="close">&#10005;</button>' +
      '</header>' +
      '<div class="dx-create__tabs">' +
        '<button class="dx-create__tab' + (this.tab === 'seeds' ? ' is-active' : '') + '" data-tab="seeds">SEEDS</button>' +
        '<button class="dx-create__tab' + (this.tab === 'journal' ? ' is-active' : '') + '" data-tab="journal">JOURNAL</button>' +
      '</div>' +
      '<div id="dx-exbody">' + inner + '</div>';
    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());
    this.el.querySelectorAll('.dx-create__tab').forEach((b) =>
      b.addEventListener('click', () => { this.tab = b.dataset.tab; this.render(); }));
    this.#renderTab();
  }

  render() {
    const titles = { seeds: 'CURIOSITY SEEDS', journal: 'DISCOVERY JOURNAL' };
    this.#frame(titles[this.tab] || 'EXPLORE', '');
  }

  #renderTab() {
    const body = this.el.querySelector('#dx-exbody');
    if (!body) return;
    if (this.tab === 'seeds') return this.#seeds(body);
    this.#journal(body);
  }

  /* ----- SEEDS ----- */
  #seeds(body) {
    const picked = this.stateStore.getKV('exploreInterests', []);

    const chips = SEEDS.interests.map((i) => {
      const on = picked.indexOf(i.id) !== -1;
      return '<button class="dx-chip dx-chip--pick' + (on ? '' : ' is-off') + '" data-int="' + i.id + '">' + i.label + '</button>';
    }).join('');

    let cards = '';
    if (!this.grown.length && !picked.length) {
      cards = '<span class="dx-prof__empty">Pick what you are curious about, then grow your first seeds.</span>';
    } else if (!this.grown.length) {
      cards = '<div class="dx-disc__actions"><button class="dx-btn dx-btn--big" id="dx-grow">GROW SEEDS</button></div>';
    } else {
      cards = this.grown.map((g, gi) => {
        const linkBtn = g.link
          ? '<button class="dx-btn dx-btn--ghost" data-link="' + g.link + '">OPEN IN DISCOVER</button>'
          : '';
        const saved = this.stateStore.getKV('discoveryJournal', []).some((j) => j.q === g.q);
        return (
          '<div class="dx-exseed">' +
            '<em>' + g.kind + '?</em>' +
            '<p>' + esc(g.q) + '</p>' +
            '<div class="dx-iq__row">' +
              linkBtn +
              '<button class="dx-btn" data-save="' + gi + '"' + (saved ? ' disabled' : '') + '>' +
                (saved ? 'IN JOURNAL &#10003;' : 'SAVE TO JOURNAL') + '</button>' +
            '</div>' +
          '</div>');
      }).join('');
    }

    body.innerHTML =
      '<div class="dx-jobs__meta">PICK YOUR CURIOSITY</div>' +
      '<div class="dx-prof__chips">' + chips + '</div>' +
      '<div class="dx-life__list">' + cards + '</div>';

    body.querySelectorAll('[data-int]').forEach((b) =>
      b.addEventListener('click', () => {
        const cur = this.stateStore.getKV('exploreInterests', []);
        const idx = cur.indexOf(b.dataset.int);
        if (idx === -1) cur.push(b.dataset.int); else cur.splice(idx, 1);
        this.stateStore.setKV('exploreInterests', cur);
        this.grown = [];
        this.#renderTab();
      }));

    const growBtn = body.querySelector('#dx-grow');
    if (growBtn) growBtn.addEventListener('click', () => this.#grow());

    body.querySelectorAll('#dx-exbody .dx-chip--pick.is-off').forEach(() => {});

    body.querySelectorAll('[data-link]').forEach((b) =>
      b.addEventListener('click', () => {
        window.open(location.pathname + location.search + '#/discover/entity/' + b.dataset.link, '_blank');
      }));

    body.querySelectorAll('[data-save]').forEach((b) =>
      b.addEventListener('click', () => {
        const g = this.grown[parseInt(b.dataset.save, 10)];
        const jr = this.stateStore.getKV('discoveryJournal', []);
        if (g && !jr.some((j) => j.q === g.q)) {
          jr.unshift({ q: g.q, kind: g.kind, at: Date.now() });
          while (jr.length > 60) jr.pop();
          this.stateStore.setKV('discoveryJournal', jr);
        }
        this.#renderTab();
      }));
  }

  #grow() {
    const picked = this.stateStore.getKV('exploreInterests', []);
    const pool = [];
    SEEDS.interests.forEach((i) => {
      if (picked.indexOf(i.id) !== -1) pool.push(...i.seeds);
    });
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    this.grown = shuffled.slice(0, 3);
    this.#renderTab();
  }

  /* ----- JOURNAL ----- */
  #journal(body) {
    const jr = this.stateStore.getKV('discoveryJournal', []);

    const rows = jr.length ? jr.map((j, i) => {
      const d = new Date(j.at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
      return (
        '<div class="dx-life__note">' +
          '<span><i>' + esc(j.kind) + '?</i> ' + esc(j.q) + ' <small>' + d + '</small></span>' +
          '<button class="dx-chip__x" data-del="' + i + '">&#215;</button>' +
        '</div>').join('');
    }).join('') : '<span class="dx-prof__empty">Your journal fills up as you save discoveries.</span>';

    body.innerHTML =
      '<div class="dx-jobs__meta">' + jr.length + ' SAVED DISCOVERIES</div>' +
      '<div class="dx-life__list">' + rows + '</div>' +
      '<footer class="dx-apps__note">A TEMPORAL VIEW OF YOUR CURIOSITY ARRIVES LATER (&#167;10)</footer>';

    body.querySelectorAll('[data-del]').forEach((b) =>
      b.addEventListener('click', () => {
        jr.splice(parseInt(b.dataset.del, 10), 1);
        this.stateStore.setKV('discoveryJournal', jr);
        this.#renderTab();
      }));
  }
}