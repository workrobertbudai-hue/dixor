import PATHS from '../data/career-paths.json';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * CAREER PATH - honnan-hova utvonalak (Section 27, Temporal elofutara Section 10).
 * Lepesenkent jelolod, amit elert; a kovetkezo cel mindig kiemelve.
 */
export class CareerView {
  constructor({ stateStore }) {
    this.stateStore = stateStore;
    this.pathId = PATHS.paths[0].id;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-career';
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

  #rec() { return this.stateStore.getKV('careerProgress', {}); }

  render() {
    this.el.innerHTML =
      '<header class="dx-jobs__head">' +
        '<div>' +
          '<span class="dx-jobs__chip">WORK &#183; FUNCTION</span>' +
          '<h2 class="dx-jobs__title">CAREER PATH</h2>' +
        '</div>' +
        '<button class="dx-jobs__close" aria-label="close">&#10005;</button>' +
      '</header>' +
      '<div class="dx-chat__layout">' +
        '<div class="dx-chat__rooms" id="dx-plist"></div>' +
        '<div class="dx-chat__main" id="dx-cmain"></div>' +
      '</div>' +
      '<footer class="dx-apps__note">THE TEMPORAL ENGINE WILL MAP YOUR REAL HISTORY HERE ONE DAY (&#167;10)</footer>';

    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());
    this.#renderPaths();
    this.#renderLadder();
  }

  #renderPaths() {
    const list = this.el.querySelector('#dx-plist');
    const rec = this.#rec();

    list.innerHTML =
      '<div class="dx-chat__sechead">TRACKS</div>' +
      PATHS.paths.map((p) => {
        const total = p.steps.length;
        const got = (rec[p.id] || []).length;
        const pct = Math.round((got / total) * 100);
        return (
          '<button class="dx-room' + (p.id === this.pathId ? ' is-active' : '') + '" data-p="' + p.id + '">' +
            '<b>' + p.label + '</b>' +
            '<span>' + got + '/' + total + ' steps</span>' +
            '<i class="dx-iq__mini"><u style="width:' + pct + '%"></u></i>' +
          '</button>');
      }).join('');

    list.querySelectorAll('.dx-room').forEach((b) =>
      b.addEventListener('click', () => { this.pathId = b.dataset.p; this.render(); }));
  }

  #renderLadder() {
    const main = this.el.querySelector('#dx-cmain');
    const path = PATHS.paths.find((p) => p.id === this.pathId);
    const store = this.#rec();
    const reached = store[this.pathId] || [];

    const firstOpenIdx = path.steps.findIndex((s) => reached.indexOf(s.id) === -1);

    const rows = path.steps.map((s, i) => {
      const done = reached.indexOf(s.id) !== -1;
      const isCurrent = !done && i === firstOpenIdx;

      let tag = '<em>UPCOMING</em>';
      if (done) tag = '<em class="is-done">REACHED &#10003;</em>';
      else if (isCurrent) tag = '<em class="is-cur">CURRENT TARGET</em>';

      const skillChips = (s.skills || []).map((k) =>
        '<span class="dx-chip">' + esc(k) + '</span>').join('');

      return (
        '<div class="dx-cstep' + (done ? ' is-done' : '') + (isCurrent ? ' is-cur' : '') + '">' +
          '<i class="dx-cstep__dot"></i>' +
          '<div class="dx-cstep__body">' +
            '<b>' + (i + 1) + '. ' + esc(s.label) + '</b>' + tag +
            '<span>' + esc(s.note) + '</span>' +
            '<div class="dx-cstep__skills">' + skillChips + '</div>' +
            '<button class="dx-btn' + (done ? ' dx-btn--ghost' : '') + '" data-step="' + s.id + '">' +
              (done ? 'UNDO' : 'MARK REACHED') + '</button>' +
          '</div>' +
        '</div>');
    }).join('');

    const got = reached.length;
    const pct = Math.round((got / path.steps.length) * 100);

    main.innerHTML =
      '<div class="dx-chat__roomhead">' +
        '<b>' + path.label + '</b>' +
        '<span>' + got + ' / ' + path.steps.length + ' STEPS</span>' +
      '</div>' +
      '<div class="dx-disc__bar" style="margin-top:12px;"><i style="width:' + pct + '%"></i></div>' +
      '<div class="dx-cladder">' + rows + '</div>';

    main.querySelectorAll('[data-step]').forEach((b) =>
      b.addEventListener('click', () => {
        const st = this.#rec();
        const arr = st[this.pathId] || [];
        const idx = arr.indexOf(b.dataset.step);
        if (idx === -1) arr.push(b.dataset.step);
        else arr.splice(idx, 1);
        st[this.pathId] = arr;
        this.stateStore.setKV('careerProgress', st);
        window.dispatchEvent(new CustomEvent('dx-star', { detail: 'CAREER_STEP' }));
        this.render();
      }));

    main.scrollTop = 0;
  }
}