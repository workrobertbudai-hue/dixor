import JOBS from '../data/jobs.json';

const THRESHOLD = 78; // priority delivery: csak jelentoseges egyezesek (§24)

/**
 * JOB RADAR VIEW - WORK / Job Radar munkafelulet.
 * A radar figyeli az uj lehetosegeket, de csak priorizalt jelzeseket ad.
 */
export class JobRadarView {
  constructor({ stateStore }) {
    this.stateStore = stateStore;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-radar';
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

  render() {
    const active = this.stateStore.isRadarActive();
    const since = this.stateStore.radarSince();
    const signals = JOBS.jobs
      .filter((j) => j.matchScore >= THRESHOLD)
      .sort((a, b) => b.matchScore - a.matchScore);

    const head = `
      <header class="dx-jobs__head">
        <div>
          <span class="dx-jobs__chip">WORK · FUNCTION</span>
          <h2 class="dx-jobs__title">JOB RADAR</h2>
        </div>
        <button class="dx-jobs__close" aria-label="close">&#10005;</button>
      </header>`;

    const status = active ? `
      <div class="dx-radar__status is-active">
        <span class="dx-radar__dot"></span>
        <span>RADAR ACTIVE${since ? ' · SINCE ' + this.#fmtDate(since) : ''}</span>
        <button class="dx-radar__toggle">DEACTIVATE</button>
      </div>
      <div class="dx-radar__scan"><i></i></div>`
      : `
      <div class="dx-radar__status">
        <span class="dx-radar__dot"></span>
        <span>RADAR OFFLINE</span>
        <button class="dx-radar__toggle">ACTIVATE</button>
      </div>`;

    const body = active ? `
      <div class="dx-jobs__meta">${signals.length} PRIORITY SIGNALS · THRESHOLD ${THRESHOLD}%+</div>
      <div class="dx-jobs__list">${signals.map((j) => this.#cardHtml(j)).join('')}</div>`
      : `
      <div class="dx-apps__empty">
        THE RADAR WATCHES NEW OPPORTUNITIES<br>
        MATCHING YOUR PROFILE — AND DELIVERS<br>
        <b>ONLY MEANINGFUL SIGNALS.</b><br><br>
        NO NOISE. NO SPAM. ${JOBS.jobs.length} SOURCES MONITORED.
      </div>`;

    this.el.innerHTML =
      head + status + body +
      '<footer class="dx-apps__note">PRIORITY DELIVERY ONLY · YOU STAY IN CONTROL (&#167;24)</footer>';

    this.el.querySelector('.dx-jobs__close')
      .addEventListener('click', () => this.close());

    this.el.querySelector('.dx-radar__toggle')
      .addEventListener('click', () => {
        this.stateStore.setRadarActive(!this.stateStore.isRadarActive());
        this.render();
      });
  }

  #fmtDate(ms) {
    return new Date(ms).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
  }

  #cardHtml(j) {
    const w = j.why;
    const isNew = (j.postedDaysAgo ?? 99) <= 2;
    return `
    <article class="dx-job">
      <div class="dx-job__head-btn dx-job__head-btn--static">
        <span class="dx-job__match">${j.matchScore}<small>%</small></span>
        <span class="dx-job__idblock">
          <span class="dx-job__title">${j.title}${isNew ? ' <i class="dx-radar__new">NEW</i>' : ''}</span>
          <span class="dx-job__company">${j.company}${j.verified ? ' <i class="dx-job__verified">&#10003; VERIFIED</i>' : ''}</span>
          <span class="dx-job__facts">${j.location} · ${j.type} · POSTED ${j.postedDaysAgo}D AGO</span>
        </span>
      </div>
      <div class="dx-radar__strength"><i style="width:${j.matchScore}%"></i></div>
      <div class="dx-radar__why">${w.strongMatches} strong matches &#183; ${w.missingRequirements} missing${w.trainingAvailable ? ' &#183; training available' : ''}</div>
    </article>`;
  }
}
