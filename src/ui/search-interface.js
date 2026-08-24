import { MODULE_LIST } from '../nodes/node-data.js';
import ENTITIES from '../data/entities.json';

/**
 * UNIVERZALIS KERESO - modulok + intelligens entitas talalatok (Section 8).
 */
export class SearchInterface {
  constructor({ onGo, onEntity }) {
    this.onGo = onGo;
    this.onEntity = onEntity;
    this.open = false;
    this.selectedIndex = 0;
    this.results = [];

    this.button = document.createElement('button');
    this.button.className = 'dx-search-btn';
    this.button.innerHTML = '&#8902;&nbsp;&nbsp;SEARCH&nbsp;<kbd>/</kbd>';
    this.button.addEventListener('click', () => this.show());
    document.body.appendChild(this.button);

    this.el = document.createElement('div');
    this.el.className = 'dx-search';
    this.el.innerHTML =
      '<div class="dx-search__panel">' +
        '<input class="dx-search__input" type="text" spellcheck="false" autocomplete="off" ' +
               'placeholder="Search DIXOR..  (area, function, keyword)" />' +
        '<div class="dx-search__results"></div>' +
        '<div class="dx-search__foot">&#8593;&#8595; navigate &nbsp;&#183;&nbsp; ENTER open &nbsp;&#183;&nbsp; ESC close</div>' +
      '</div>';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    this.input = this.el.querySelector('.dx-search__input');
    this.resultsEl = this.el.querySelector('.dx-search__results');

    this.input.addEventListener('input', () => this.render());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); this.move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); this.move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); this.choose(); }
    });

    document.addEventListener('keydown', (e) => {
      if (!this.open) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.hide(); }
      else if (e.key === '/') { e.preventDefault(); }
    }, true);

    window.addEventListener('keydown', (e) => {
      if (this.open || e.key !== '/') return;
      e.preventDefault();
      this.show();
    });
  }

  show() {
    this.open = true;
    this.selectedIndex = 0;
    this.el.style.display = '';
    requestAnimationFrame(() => {
      this.el.classList.add('is-open');
      this.input.value = '';
      this.render();
      this.input.focus();
    });
  }

  hide() {
    this.open = false;
    this.el.classList.remove('is-open');
    setTimeout(() => { if (!this.open) this.el.style.display = 'none'; }, 220);
  }

  render() {
    const q = this.query();

    const mods = !q
      ? [...MODULE_LIST]
      : MODULE_LIST.filter((m) =>
          m.label.toLowerCase().includes(q) ||
          m.tagline.toLowerCase().includes(q) ||
          m.functions.some((f) => f.toLowerCase().includes(q)));

    const ents = q
      ? ENTITIES.entities.filter((e) =>
          e.label.toLowerCase().includes(q) ||
          e.type.toLowerCase().includes(q) ||
          e.tagline.toLowerCase().includes(q))
      : [];

    this.results = [
      ...mods.map((m) => ({ kind: 'module', data: m })),
      ...ents.map((e) => ({ kind: 'entity', data: e })),
    ];

    this.selectedIndex = Math.min(this.selectedIndex, Math.max(0, this.results.length - 1));
    this.resultsEl.innerHTML = '';

    if (!this.results.length) {
      this.resultsEl.innerHTML = '<div class="dx-search__empty">No matching area.</div>';
      return;
    }

    this.results.forEach((r, i) => {
      const row = document.createElement('button');
      row.className = 'dx-search__row' + (i === this.selectedIndex ? ' is-active' : '');

      if (r.kind === 'module') {
        row.style.setProperty('--accent', r.data.accent);
        row.innerHTML =
          '<span class="dx-search__dot"></span>' +
          '<span class="dx-search__name">' + r.data.label + '</span>' +
          '<span class="dx-search__tag">' + r.data.tagline + '</span>';
      } else {
        row.style.setProperty('--accent', '#ffd479');
        row.classList.add('dx-search__row--ent');
        row.innerHTML =
          '<span class="dx-search__dot"></span>' +
          '<span class="dx-search__name">' + r.data.label + '</span>' +
          '<span class="dx-search__tag"><i>ENTITY &#183; ' + r.data.type + '</i> ' + r.data.tagline + '</span>';
      }

      row.addEventListener('click', () => this.choose());
      row.addEventListener('mousemove', () => { this.selectedIndex = i; this.paint(); });
      this.resultsEl.appendChild(row);
    });
  }

  paint() {
    [...this.resultsEl.children].forEach((el, i) =>
      el.classList.toggle('is-active', i === this.selectedIndex));
  }

  move(d) {
    if (!this.results.length) return;
    this.selectedIndex = (this.selectedIndex + d + this.results.length) % this.results.length;
    this.paint();
  }

  choose() {
    const r = this.results[this.selectedIndex];
    if (!r) return;
    this.hide();
    if (r.kind === 'module') this.onGo ? this.onGo(r.data) : null;
    else this.onEntity ? this.onEntity(r.data) : null;
  }

  query() { return this.input.value.trim().toLowerCase(); }
}