/**
 * SKILLS DISCOVERY - WORK / Discover My Skills (Section 18-19).
 * Egyszeru valaszokbol atviheto keszsegeket azosit, amiket a profilba menthet a felhasznalo.
 */
const QUESTIONS = [
  { q: 'You have served customers face to face.',            skills: ['customer interaction', 'communication'] },
  { q: 'You have worked as part of a team.',                 skills: ['teamwork', 'reliability'] },
  { q: 'You handled money, records or inventory.',           skills: ['organization', 'attention to detail'] },
  { q: 'You stayed calm and effective when things got busy.',skills: ['stress handling'] },
  { q: 'You have shown a task or process to others.',        skills: ['communication', 'coaching'] },
  { q: 'You use more than one language in daily life.',      skills: ['multilingual communication'] },
  { q: 'You managed your own schedule or deadlines.',        skills: ['time management', 'self-direction'] },
  { q: 'You solved unexpected problems on the spot.',        skills: ['problem solving', 'adaptability'] },
];

export class SkillsDiscovery {
  constructor({ stateStore }) {
    this.stateStore = stateStore;
    this.step = 0;
    this.found = [];

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-disc';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
    }, true);
  }

  get isOpen() { return this.el.classList.contains('is-open'); }

  open() {
    this.step = 0;
    this.found = [];
    this.renderStep();
    this.el.style.display = '';
    requestAnimationFrame(() => this.el.classList.add('is-open'));
  }

  close() {
    this.el.classList.remove('is-open');
    setTimeout(() => { if (!this.isOpen) this.el.style.display = 'none'; }, 260);
  }

  #frame(inner) {
    this.el.innerHTML = `
      <header class="dx-jobs__head">
        <div>
          <span class="dx-jobs__chip">WORK · FUNCTION</span>
          <h2 class="dx-jobs__title">DISCOVER MY SKILLS</h2>
        </div>
        <button class="dx-jobs__close" aria-label="close">&#10005;</button>
      </header>
      ${inner}`;
    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());
  }

  renderStep() {
    const total = QUESTIONS.length;
    const pct = Math.round((this.step / total) * 100);

    if (this.step >= total) return this.#renderResult();

    this.#frame(`
      <div class="dx-disc__meta">QUESTION ${this.step + 1} / ${total}</div>
      <div class="dx-disc__bar"><i style="width:${pct}%"></i></div>
      <p class="dx-disc__q">${QUESTIONS[this.step].q}</p>
      <div class="dx-disc__opts">
        <button class="dx-btn dx-btn--big" id="dx-yes">YES</button>
        <button class="dx-btn dx-btn--big dx-btn--ghost" id="dx-no">NOT REALLY</button>
      </div>
      <footer class="dx-apps__note">HONEST ANSWERS ONLY - NO RIGHT OR WRONG (&#167;19)</footer>`);

    this.el.querySelector('#dx-yes').addEventListener('click', () => {
      this.found.push(...QUESTIONS[this.step].skills);
      this.step++; this.renderStep();
    });
    this.el.querySelector('#dx-no').addEventListener('click', () => {
      this.step++; this.renderStep();
    });
  }

  #renderResult() {
    const uniq = [...new Set(this.found)];
    const inProfile = this.stateStore.getProfile().skills;
    const chips = uniq.length
      ? uniq.map((s) => {
          const has = inProfile.includes(s);
          return `<button class="dx-chip dx-chip--pick${has ? ' is-in' : ''}" data-skill="${s}">
                    ${s}${has ? ' &#183; IN PROFILE' : ''}
                  </button>`;
        }).join('')
      : '<span class="dx-prof__empty">No additional skills identified this time.</span>';

    this.#frame(`
      <div class="dx-disc__meta">RESULT</div>
      <h3 class="dx-disc__rt">YOU MIGHT BE GOOD AT THIS</h3>
      <p class="dx-disc__rs">Based on your answers, DIXOR identified transferable capabilities:</p>
      <div class="dx-prof__chips">${chips}</div>
      <div class="dx-disc__actions">
        <button class="dx-btn dx-btn--big" id="dx-save">ADD SELECTED TO PROFILE</button>
        <button class="dx-btn dx-btn--ghost" id="dx-restart">RUN AGAIN</button>
      </div>
      <footer class="dx-apps__note">POTENTIAL OVER PAPERWORK (&#167;17) - CLICK A CHIP TO TOGGLE</footer>`);

    this.el.querySelectorAll('.dx-chip--pick').forEach((c) =>
      c.addEventListener('click', () => c.classList.toggle('is-off')));

    this.el.querySelector('#dx-save').addEventListener('click', () => {
      const picks = [...this.el.querySelectorAll('.dx-chip--pick:not(.is-off)')]
        .map((c) => c.dataset.skill);
      this.stateStore.addSkills(picks);
      this.close();
    });
    this.el.querySelector('#dx-restart').addEventListener('click', () => this.open());
  }
}
