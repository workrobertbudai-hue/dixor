import EMPLOYERS from '../data/employers.json';
import JOBS from '../data/jobs.json';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * EMPLOYER INSIGHT - munkaadoi profil-lapok (Sections 15, 20, 22).
 * Atlathatosag: jelek, nyitottsag, aktiv allasaik - minden egy helyen.
 */
export class EmployerInsightView {
  constructor({ stateStore }) {
    this.stateStore = stateStore;
    this.current = null;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-emp';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
    }, true);
  }

  get isOpen() { return this.el.classList.contains('is-open'); }

  open(name) {
    this.render();
    if (name) this.selectByName(name); else this.selectFirst();
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
          '<span class="dx-jobs__chip">WORK &#183; FUNCTION</span>' +
          '<h2 class="dx-jobs__title">EMPLOYER INSIGHT</h2>' +
        '</div>' +
        '<button class="dx-jobs__close" aria-label="close">&#10005;</button>' +
      '</header>' +
      '<div class="dx-chat__layout">' +
        '<div class="dx-chat__rooms" id="dx-emplist"></div>' +
        '<div class="dx-chat__main" id="dx-empmain"></div>' +
      '</div>' +
      '<footer class="dx-apps__note">TRUST IS BUILT FROM SIGNALS - NEVER CLAIMED AS CERTAINTY (&#167;15)</footer>';
    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());
  }

  render() {
    this.#frame('');
    const list = this.el.querySelector('#dx-emplist');

    list.innerHTML =
      '<div class="dx-chat__sechead">VERIFIED COMPANIES</div>' +
      EMPLOYERS.employers.map((e) =>
        '<button class="dx-room" data-name="' + esc(e.name) + '">' +
          '<b>' + esc(e.name) + '</b>' +
          '<span>' + esc(e.industry) + '</span>' +
        '</button>').join('');

    list.querySelectorAll('.dx-room').forEach((b) =>
      b.addEventListener('click', () => this.selectByName(b.dataset.name)));
  }

  selectFirst() {
    if (EMPLOYERS.employers.length) this.select(EMPLOYERS.employers[0]);
  }

  selectByName(name) {
    const e = EMPLOYERS.employers.find((x) => x.name === name);
    if (e) this.select(e);
  }

  select(e) {
    this.current = e;
    this.el.querySelectorAll('.dx-room').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.name === e.name));

    const main = this.el.querySelector('#dx-empmain');

    const sigRows = e.signals.map((s) =>
      '<li><i class="dx-emp__dot' + (s.status === 'OK' ? ' is-ok' : '') + '"></i>' +
      esc(s.label) + '<b>' + esc(s.status) + '</b></li>').join('');

    const openChips = (e.openness || []).map((o) =>
      '<span class="dx-job__badge dx-job__badge--pot">' + esc(o) + '</span>').join('');

    const cultChips = (e.culture || []).map((c) =>
      '<span class="dx-chip">' + esc(c) + '</span>').join('');

    const jobs = JOBS.jobs.filter((j) => j.company === e.name);
    const jobRows = jobs.length ? jobs.map((j) =>
      '<div class="dx-emp__job">' +
        '<div><b>' + esc(j.title) + '</b><span>' + esc(j.location) + ' &#183; ' + esc(j.salary) + '</span></div>' +
        '<em>' + j.matchScore + '%</em>' +
      '</div>').join('')
      : '<span class="dx-prof__empty">No active openings right now.</span>';

    main.innerHTML =
      '<div class="dx-emp__head">' +
        '<b>' + esc(e.name) + '</b>' +
        '<i class="dx-job__verified">&#10003; VERIFIED EMPLOYER</i>' +
      '</div>' +
      '<p class="dx-ent__ov">' + esc(e.about) + '</p>' +

      '<div class="dx-prof__section"><div class="dx-prof__label">FACTS</div>' +
        '<div class="dx-apps__row"><span>INDUSTRY</span><b>' + esc(e.industry) + '</b></div>' +
        '<div class="dx-apps__row"><span>SIZE</span><b>' + esc(e.size) + '</b></div>' +
        '<div class="dx-apps__row"><span>FOUNDED</span><b>' + e.founded + '</b></div>' +
        '<div class="dx-apps__row"><span>HEADQUARTERS</span><b>' + esc(e.hq) + '</b></div>' +
      '</div>' +

      '<div class="dx-prof__section"><div class="dx-prof__label">TRUST SIGNALS</div>' +
        '<ul class="dx-emp__sig">' + sigRows + '</ul>' +
      '</div>' +

      '<div class="dx-prof__section"><div class="dx-prof__label">OPEN TO POTENTIAL (&#167;22)</div>' +
        '<div class="dx-prof__chips">' + openChips + '</div>' +
      '</div>' +

      '<div class="dx-prof__section"><div class="dx-prof__label">CULTURE NOTES</div>' +
        '<div class="dx-prof__chips">' + cultChips + '</div>' +
      '</div>' +

      '<div class="dx-prof__section"><div class="dx-prof__label">ACTIVE OPENINGS &#183; ' + jobs.length + '</div>' +
        jobRows +
      '</div>';

    main.scrollTop = 0;
  }
}