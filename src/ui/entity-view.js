import ENTITIES from '../data/entities.json';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * ENTITY VIEW - az intelligens kereses celja (Section 8).
 * FIX: minden megjelenitesi utvonal vegigviszi a #show()-n.
 */
export class EntityView {
  constructor() {
    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-entity';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
    }, true);
  }

  get isOpen() { return this.el.classList.contains('is-open'); }

  /** x: nothing -> index | entity object | entity id string */
  open(x) {
    if (!x) {
      this.renderIndex();
    } else {
      const id = typeof x === 'string' ? x : x.id;
      const e = ENTITIES.entities.find((v) => v.id === id);
      if (e) this.renderEntity(e); else this.renderIndex();
    }
    this.#show();
  }

  openIndex() { this.renderIndex(); this.#show(); }

  #show() {
    this.el.style.display = '';
    requestAnimationFrame(() => this.el.classList.add('is-open'));
  }

  close() {
    this.el.classList.remove('is-open');
    setTimeout(() => { if (!this.isOpen) this.el.style.display = 'none'; }, 260);
  }

  #frame(inner) {
    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div>' +
          '<span class="dx-jobs__chip">DISCOVER &#183; ENTITY</span>' +
          '<h2 class="dx-jobs__title">' + this.title + '</h2>' +
        '</div>' +
        '<button class="dx-jobs__close" aria-label="close">&#10005;</button>' +
      '</header>' + inner;
    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());
  }

  /* ---------- index ---------- */

  renderIndex() {
    this.title = 'EXPLORE';

    const cards = ENTITIES.entities.map((e) =>
      '<button class="dx-room" data-eid="' + e.id + '">' +
        '<b>' + esc(e.label) + '</b>' +
        '<span>' + esc(e.tagline) + '</span>' +
        '<span class="dx-room__mod">' + esc(e.type) + '</span>' +
      '</button>'
    ).join('');

    this.#frame(
      '<div class="dx-jobs__meta">KNOWLEDGE ENVIRONMENTS &#183; PICK AN ENTRY POINT</div>' +
      '<div class="dx-learn__opts">' + cards + '</div>' +
      '<footer class="dx-apps__note">THE UNIVERSAL SEARCH ALSO FINDS ENTITIES - TRY &quot;NVIDIA&quot;</footer>'
    );

    this.el.querySelectorAll('[data-eid]').forEach((b) =>
      b.addEventListener('click', () => {
        const e = ENTITIES.entities.find((v) => v.id === b.dataset.eid);
        if (e) { this.renderEntity(e); this.el.scrollTop = 0; }
      }));
  }

  /* ---------- entitas lap ---------- */

  renderEntity(e) {
    this.title = e.label;

    const tl = e.timeline.map((t) =>
      '<li><b>' + esc(t.year) + '</b><span>' + esc(t.label) + '</span></li>'
    ).join('');

    const people = e.people.map((p) =>
      '<li><i>' + esc(p.name) + '</i><span>' + esc(p.role) + '</span></li>'
    ).join('');

    const prods = (e.products ?? []).map((p) =>
      '<span class="dx-chip">' + esc(p) + '</span>').join('');

    const rels = (e.related ?? []).length
      ? e.related.map((rid) => {
          const r = ENTITIES.entities.find((v) => v.id === rid);
          return r
            ? '<button class="dx-btn dx-btn--ghost" data-rel="' + r.id + '">' + esc(r.label) + '</button>'
            : '';
        }).join('')
      : '';

    const sources = e.sources.map((s) =>
      '<div class="dx-apps__row"><span>SOURCE</span><b>' + esc(s.label) + '</b></div>' +
      '<div class="dx-apps__row"><span>CONFIDENCE</span><b>' + esc(s.confidence) + '</b></div>'
    ).join('');

    this.#frame(
      '<div class="dx-ent__typebar">' + esc(e.type) + ' &#183; ' + esc(e.tagline) + '</div>' +

      '<div class="dx-prof__section">' +
        '<div class="dx-prof__label">OVERVIEW</div>' +
        '<p class="dx-ent__ov">' + esc(e.overview) + '</p>' +
      '</div>' +

      '<div class="dx-prof__section">' +
        '<div class="dx-prof__label">TIMELINE</div>' +
        '<ul class="dx-tl">' + tl + '</ul>' +
      '</div>' +

      '<div class="dx-prof__section">' +
        '<div class="dx-prof__label">KEY PEOPLE</div>' +
        '<ul class="dx-ent__people">' + people + '</ul>' +
      '</div>' +

      (prods
        ? '<div class="dx-prof__section"><div class="dx-prof__label">PRODUCTS &amp; CONCEPTS</div>' +
          '<div class="dx-prof__chips">' + prods + '</div></div>'
        : '') +

      (rels
        ? '<div class="dx-prof__section"><div class="dx-prof__label">RELATED</div>' +
          '<div class="dx-ent__rels">' + rels + '</div></div>'
        : '') +

      '<div class="dx-prof__section">' +
        '<div class="dx-prof__label">TRACEABILITY (&#167;9)</div>' + sources +
      '</div>' +

      '<footer class="dx-apps__note">WHERE INFORMATION COMES FROM - ALWAYS SHOWN</footer>'
    );

    this.el.scrollTop = 0;

    this.el.querySelectorAll('[data-rel]').forEach((b) =>
      b.addEventListener('click', () => {
        const r = ENTITIES.entities.find((v) => v.id === b.dataset.rel);
        if (r) this.renderEntity(r);
      }));
  }
}