/**
 * PROFILE VIEW - WORK / My Profile.
 * Egy elo szakmai identitat kepvisel az ismetelt CV feltoltes helyett.
 */
export class ProfileView {
  constructor({ stateStore }) {
    this.stateStore = stateStore;

    this.el = document.createElement('aside');
    this.el.className = 'dx-jobs dx-profile';
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
    const p = this.stateStore.getProfile();

    const skillChips = p.skills.length
      ? p.skills.map((s) =>
          `<span class="dx-chip">${s}<button class="dx-chip__x" data-kind="skill" data-val="${s}">&#215;</button></span>`
        ).join('')
      : '<span class="dx-prof__empty">No skills yet - run DISCOVER MY SKILLS.</span>';

    const langChips = p.languages.map((s) =>
      `<span class="dx-chip">${s}<button class="dx-chip__x" data-kind="lang" data-val="${s}">&#215;</button></span>`
    ).join('');

    this.el.innerHTML = `
      <header class="dx-jobs__head">
        <div>
          <span class="dx-jobs__chip">WORK · FUNCTION</span>
          <h2 class="dx-jobs__title">MY PROFILE</h2>
        </div>
        <button class="dx-jobs__close" aria-label="close">&#10005;</button>
      </header>
      <div class="dx-jobs__meta">ONE LIVING IDENTITY · NO REPEATED FORMS</div>

      <div class="dx-prof__section">
        <div class="dx-prof__label">HEADLINE</div>
        <input class="dx-field" id="dx-headline" maxlength="80" value="${p.headline}" />
      </div>

      <div class="dx-prof__section">
        <div class="dx-prof__label">SKILLS (${p.skills.length})</div>
        <div class="dx-prof__chips">${skillChips}</div>
        <div class="dx-addrow">
          <input class="dx-field dx-addrow__input" id="dx-newskill" placeholder="Add a skill..." />
          <button class="dx-btn" id="dx-addskill">ADD</button>
        </div>
      </div>

      <div class="dx-prof__section">
        <div class="dx-prof__label">LANGUAGES</div>
        <div class="dx-prof__chips">${langChips}</div>
        <div class="dx-addrow">
          <input class="dx-field dx-addrow__input" id="dx-newlang" placeholder="Add a language..." />
          <button class="dx-btn" id="dx-addlang">ADD</button>
        </div>
      </div>

      <div class="dx-prof__section">
        <div class="dx-prof__label">PREFERENCES</div>
        <div class="dx-prof__grid">
          <label>LOCATION<input class="dx-field" id="dx-location" value="${p.location}" /></label>
          <label>MOBILITY
            <select class="dx-field" id="dx-mobility">
              ${['Hybrid','On-site','Remote'].map((m)=>`<option ${m===p.mobility?'selected':''}>${m}</option>`).join('')}
            </select></label>
          <label>SCHEDULE
            <select class="dx-field" id="dx-schedule">
              ${['Full-time','Part-time','Flexible'].map((m)=>`<option ${m===p.schedule?'selected':''}>${m}</option>`).join('')}
            </select></label>
        </div>
      </div>

      <footer class="dx-apps__note">DIXOR PROFILE FEEDS EVERY MATCH AND RECOMMENDATION (&#167;16)</footer>`;

    this.el.querySelector('.dx-jobs__close').addEventListener('click', () => this.close());

    // headline
    this.el.querySelector('#dx-headline').addEventListener('change', (e) =>
      this.stateStore.updateProfile({ headline: e.target.value }));

    // chip torles
    this.el.querySelectorAll('.dx-chip__x').forEach((b) =>
      b.addEventListener('click', () => {
        if (b.dataset.kind === 'skill') this.stateStore.removeSkill(b.dataset.val);
        else this.stateStore.removeLanguage(b.dataset.val);
        this.render();
      }));

    // hozzaadas
    const ns = this.el.querySelector('#dx-newskill');
    this.el.querySelector('#dx-addskill').addEventListener('click', () => {
      this.stateStore.addSkill(ns.value); this.render();
    });
    ns.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { this.stateStore.addSkill(ns.value); this.render(); }
    });

    const nl = this.el.querySelector('#dx-newlang');
    this.el.querySelector('#dx-addlang').addEventListener('click', () => {
      this.stateStore.addLanguage(nl.value); this.render();
    });
    nl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { this.stateStore.addLanguage(nl.value); this.render(); }
    });

    // preferenciak
    this.el.querySelector('#dx-location').addEventListener('change', (e) =>
      this.stateStore.updateProfile({ location: e.target.value }));
    this.el.querySelector('#dx-mobility').addEventListener('change', (e) =>
      this.stateStore.updateProfile({ mobility: e.target.value }));
    this.el.querySelector('#dx-schedule').addEventListener('change', (e) =>
      this.stateStore.updateProfile({ schedule: e.target.value }));
  }
}
