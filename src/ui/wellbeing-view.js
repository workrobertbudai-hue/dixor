/**
 * WELLBEING EXPERIENCE - nyugodt, nem tolakodo anti-stressz reteget (Section 29).
 * Nem terapeuta: csak leallitast, levegot es csendet ad.
 */

const PATTERNS = {
  reset: {
    title: '60-SECOND RESET',
    total: 60,
    phases: [
      { label: 'INHALE', sec: 4 },
      { label: 'HOLD',   sec: 2 },
      { label: 'EXHALE', sec: 6 },
    ],
  },
  breath: {
    title: 'BREATHING',
    total: null, // amig be nem zarja
    phases: [
      { label: 'INHALE', sec: 4 },
      { label: 'HOLD',   sec: 7 },
      { label: 'EXHALE', sec: 8 },
    ],
  },
};

const QUIET_KEY = 'dixor.quiet';

export function isQuiet() {
  try { return localStorage.getItem(QUIET_KEY) === '1'; } catch { return false; }
}

export function setQuiet(v) {
  try { localStorage.setItem(QUIET_KEY, v ? '1' : '0'); } catch {}
  document.body.classList.toggle('dx-quiet', v);
}

/* indulaskor allapot visszaallitasa */
if (isQuiet()) document.body.classList.add('dx-quiet');

export class WellbeingView {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'dx-calm';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    this.running = false;

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
    }, true);
  }

  get isOpen() { return this.el.classList.contains('is-open'); }

  /** preset: null (menu) | 'reset' | 'breath' */
  open(preset) {
    if (preset && PATTERNS[preset]) this.startSession(preset);
    else this.renderMenu();
    this.el.style.display = '';
    requestAnimationFrame(() => this.el.classList.add('is-open'));
  }

  close() {
    this.running = false;
    this.el.classList.remove('is-open');
    setTimeout(() => { if (!this.isOpen) this.el.style.display = 'none'; }, 300);
  }

  #frame(inner) {
    this.el.innerHTML =
      '<button class="dx-calm__close" aria-label="close">&#10005;</button>' + inner;
    this.el.querySelector('.dx-calm__close')
      .addEventListener('click', () => this.close());
  }

  renderMenu() {
    this.running = false;
    const quietOn = isQuiet();

    this.#frame(
      '<div class="dx-calm__menu">' +
        '<div class="dx-calm__kicker">WELLBEING</div>' +
        '<h2 class="dx-calm__title">TAKE A MOMENT</h2>' +
        '<p class="dx-calm__sub">Nothing to achieve here. Just breathe.</p>' +
        '<div class="dx-calm__opts">' +
          '<button class="dx-calm__opt" data-preset="reset">' +
            '<b>60-SECOND RESET</b><span>guided micro-break</span></button>' +
          '<button class="dx-calm__opt" data-preset="breath">' +
            '<b>BREATHING</b><span>4 &middot; 7 &middot; 8 rhythm, open end</span></button>' +
          '<button class="dx-calm__opt" id="dx-quiet-toggle">' +
            '<b>QUIET MODE</b><span>' + (quietOn ? 'currently ON - click to restore' : 'dim the whole environment') + '</span></button>' +
        '</div>' +
        '<footer class="dx-apps__note">CALM BY DESIGN (&#167;29)</footer>' +
      '</div>'
    );

    this.el.querySelectorAll('.dx-calm__opt[data-preset]').forEach((b) =>
      b.addEventListener('click', () => this.startSession(b.dataset.preset)));

    this.el.querySelector('#dx-quiet-toggle').addEventListener('click', () => {
      setQuiet(!isQuiet());
      this.renderMenu();
    });
  }

  startSession(key) {
    const p = PATTERNS[key];
    this.running = true;

    let remaining = p.total; // null -> vegtelen
    let phaseIdx = 0;
    let phaseLeft = p.phases[0].sec;
    let cyclesDone = 0;

    this.#frame(
      '<div class="dx-calm__session">' +
        '<div class="dx-calm__ringwrap">' +
          '<div class="dx-calm__ring"></div>' +
          '<div class="dx-calm__circle" id="dx-circle"></div>' +
        '</div>' +
        '<div class="dx-calm__phase" id="dx-phase">&nbsp;</div>' +
        '<div class="dx-calm__count" id="dx-count">&nbsp;</div>' +
        '<button class="dx-btn dx-btn--ghost" id="dx-stop">BACK</button>' +
      '</div>'
    );

    const circle = this.el.querySelector('#dx-circle');
    const phaseEl = this.el.querySelector('#dx-phase');
    const countEl = this.el.querySelector('#dx-count');

    this.el.querySelector('#dx-stop').addEventListener('click', () => {
      this.running = false;
      this.renderMenu();
    });

    const applyPhase = (ph) => {
      phaseEl.textContent = ph.label;
      const grow = ph.label === 'INHALE';
      if (!ph.label.startsWith('HOLD')) {
        circle.style.transition = 'transform ' + ph.sec + 's cubic-bezier(.45,0,.35,1)';
        circle.style.transform = grow ? 'scale(1)' : 'scale(0.58)';
      }
    };

    const finishOrMenu = () => {
      this.running = false;
      this.#frame(
        '<div class="dx-calm__menu">' +
          '<div class="dx-calm__kicker">COMPLETE</div>' +
          '<h2 class="dx-calm__title">WELCOME BACK</h2>' +
          '<p class="dx-calm__sub">' + cyclesDone + ' breathing cycles finished.</p>' +
          '<div class="dx-calm__opts">' +
            '<button class="dx-calm__opt" data-preset="reset"><b>AGAIN</b><span>another 60 seconds</span></button>' +
            '<button class="dx-calm__opt" id="dx-tomenu"><b>MENU</b><span>back to wellbeing</span></button>' +
          '</div>' +
        '</div>'
      );
      this.el.querySelectorAll('.dx-calm__opt[data-preset]').forEach((b) =>
        b.addEventListener('click', () => this.startSession(b.dataset.preset)));
      this.el.querySelector('#dx-tomenu').addEventListener('click', () => this.renderMenu());
    };

    applyPhase(p.phases[0]);

    const iv = setInterval(() => {
      if (!this.running) { clearInterval(iv); return; }

      phaseLeft--;
      if (remaining !== null) remaining--;

      if (phaseLeft <= 0) {
        phaseIdx = (phaseIdx + 1) % p.phases.length;
        if (phaseIdx === 0) {
          cyclesDone++;
          if (remaining !== null && remaining <= 0) {
            clearInterval(iv);
            finishOrMenu();
            return;
          }
        }
        phaseLeft = p.phases[phaseIdx].sec;
        applyPhase(p.phases[phaseIdx]);
      }

      countEl.textContent =
        remaining !== null ? Math.max(0, remaining) + 'S REMAINING' : ('CYCLES: ' + cyclesDone);
    }, 1000);

    countEl.textContent = remaining !== null ? remaining + 'S REMAINING' : 'CYCLES: 0';
  }
}