import JOBS from '../data/jobs.json';

/**
 * JOB BROWSER — WORK / Find Jobs munkafelület (§14–26).
 * Match-magyarázat, verified jelölés, Open-To-Potential, Apply (perzisztens).
 */
export class JobBrowser {
  constructor({ stateStore }) {
    this.stateStore = stateStore;
    this.accent = '#57e6d9';

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    // ESC először a böngészőt zárja (capture fázis)
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
    const jobs = [...JOBS.jobs].sort((a, b) => b.matchScore - a.matchScore);
    const cards = jobs.map((j) => this.#cardHtml(j)).join('');

    this.el.innerHTML = `
      <header class="dx-jobs__head">
        <div>
          <span class="dx-jobs__chip">WORK · FUNCTION</span>
          <h2 class="dx-jobs__title">FIND JOBS</h2>
        </div>
        <button class="dx-jobs__close" aria-label="close">✕</button>
      </header>
      <div class="dx-jobs__meta">${jobs.length} ACTIVE OPPORTUNITIES · QUALITY OVER QUANTITY</div>
      <div class="dx-jobs__list">${cards}</div>
      <footer class="dx-jobs__filtered">
        TRUST LAYER · ${JOBS.trustLayer.filteredSuspicious} SUSPICIOUS LISTINGS FILTERED
      </footer>`;

    this.el.querySelector('.dx-jobs__close')
      .addEventListener('click', () => this.close());

    this.el.querySelectorAll('.dx-job').forEach((cardEl) => {
      cardEl.querySelector('.dx-job__head-btn')
        .addEventListener('click', () => cardEl.classList.toggle('is-expanded'));

      const btn = cardEl.querySelector('.dx-job__apply');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.stateStore.hasApplied(btn.dataset.jobId)) {
          this.stateStore.addApplication(btn.dataset.jobId);
        }
        this.#paintApplied(btn);
      });
      this.#paintApplied(btn);
    });
  }

  #paintApplied(btn) {
    const applied = this.stateStore.hasApplied(btn.dataset.jobId);
    btn.textContent = applied ? 'APPLIED ✓' : 'APPLY';
    btn.disabled = applied;
    btn.classList.toggle('is-applied', applied);
  }

  #cardHtml(j) {
    const w = j.why;
    const badges = [
      ...(j.badges ?? []),
      ...(j.openToPotential ? ['OPEN TO POTENTIAL'] : []),
    ].map((b) => `<span class="dx-job__badge${b === 'OPEN TO POTENTIAL' ? ' dx-job__badge--pot' : ''}">${b}</span>`).join('');
    const transfer = (w.transferableSkills ?? [])
      .map((s) => `<li>${s}</li>`).join('');

    return `
    <article class="dx-job" data-job-id="${j.id}">
      <button class="dx-job__head-btn">
        <span class="dx-job__match">${j.matchScore}<small>%</small></span>
        <span class="dx-job__idblock">
          <span class="dx-job__title">${j.title}</span>
          <span class="dx-job__company">${j.company}${j.verified ? ' <i class="dx-job__verified">&#10003; VERIFIED</i>' : ''}</span>
          <span class="dx-job__facts">${j.location} · ${j.salary} · ${j.type}</span>
        </span>
        <span class="dx-job__chev">▾</span>
      </button>
      <div class="dx-job__body">
        <p class="dx-job__summary">${j.summary}</p>
        <div class="dx-job__badges">${badges}</div>
        <div class="dx-job__why">
          <h3>WHY THIS JOB?</h3>
          <ul class="dx-job__counts">
            <li><b>${w.strongMatches}</b> strong matches</li>
            <li><b>${w.missingRequirements}</b> missing requirements</li>
            <li><b>${(w.transferableSkills ?? []).length}</b> transferable skills</li>
            ${w.trainingAvailable ? '<li><b>&#10003;</b> training available</li>' : ''}
            ${w.scheduleCompatible ? '<li><b>&#10003;</b> schedule compatible</li>' : ''}
          </ul>
          ${transfer ? `<div class="dx-job__transfer"><span>TRANSFERABLE:</span><ul>${transfer}</ul></div>` : ''}
        </div>
        <div class="dx-job__foot">
          <span class="dx-job__posted">POSTED ${j.postedDaysAgo}D AGO</span>
          <button class="dx-job__apply" data-job-id="${j.id}">APPLY</button>
        </div>
      </div>
    </article>`;
  }
}