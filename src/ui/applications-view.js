import JOBS from '../data/jobs.json';

/**
 * APPLICATIONS VIEW — WORK / My Applications munkafelület (§26).
 * A DIXOR profil viszi az adatokat: a felhasználó csak jóváhagy — nem töltöget űrlapokat.
 */
export class ApplicationsView {
  constructor({ stateStore }) {
    this.stateStore = stateStore;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-apps';
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

  #jobById(id) {
    return JOBS.jobs.find((j) => j.id === id) ?? null;
  }

  #fmtDate(ms) {
    if (!ms) return 'EARLIER SESSION';
    return new Date(ms).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).toUpperCase();
  }

  render() {
    const apps = this.stateStore.getApplications()
      .map((a) => ({ ...a, job: this.#jobById(a.id) }))
      .filter((a) => a.job)
      .sort((x, y) => (y.at ?? 0) - (x.at ?? 0));

    const cards = apps.map((a) => this.#cardHtml(a)).join('');

    this.el.innerHTML = `
      <header class="dx-jobs__head">
        <div>
          <span class="dx-jobs__chip">WORK · FUNCTION</span>
          <h2 class="dx-jobs__title">MY APPLICATIONS</h2>
        </div>
        <button class="dx-jobs__close" aria-label="close">✕</button>
      </header>
      <div class="dx-jobs__meta">${apps.length} ACTIVE · ONE PROFILE — NO REPEATED FORMS</div>
      ${apps.length
        ? `<div class="dx-jobs__list">${cards}</div>`
        : `<div class="dx-apps__empty">
             NO APPLICATIONS YET.<br>OPEN <b>FIND JOBS</b> TO BEGIN —
             YOUR PROFILE DOES THE PAPERWORK.
           </div>`}
      <footer class="dx-apps__note">
        DIXOR PROFILE → JOB → REVIEW → YOUR APPROVAL (§26)
      </footer>`;

    this.el.querySelector('.dx-jobs__close')
      .addEventListener('click', () => this.close());
  }

  #cardHtml(a) {
    const j = a.job;
    return `
    <article class="dx-job is-expanded">
      <div class="dx-job__head-btn dx-job__head-btn--static">
        <span class="dx-job__match">${j.matchScore}<small>%</small></span>
        <span class="dx-job__idblock">
          <span class="dx-job__title">${j.title}</span>
          <span class="dx-job__company">${j.company}${j.verified ? ' <i class="dx-job__verified">&#10003; VERIFIED</i>' : ''}</span>
          <span class="dx-job__facts">${j.location} · ${j.type}</span>
        </span>
      </div>
      <div class="dx-job__body" style="display:block;">
        <ul class="dx-apps__pipeline">
          <li class="is-done">SUBMITTED</li>
          <li class="is-done">IN REVIEW</li>
          <li>INTERVIEW</li>
          <li>DECISION</li>
        </ul>
        <div class="dx-apps__row">
          <span>SUBMITTED</span><b>${this.#fmtDate(a.at)}</b>
        </div>
        <div class="dx-apps__row">
          <span>SOURCE</span><b>DIXOR PROFILE · AUTO-FILLED</b>
        </div>
      </div>
    </article>`;
  }
}