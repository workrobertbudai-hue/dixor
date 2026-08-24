/**
 * ACTION PANEL — funkció-kiválasztás visszajelzése (§5 ACTION szint).
 * A valódi munkafelületek későbbi mérföldkövek; itt jelezzük a helyét és státuszát.
 */
export class ActionPanel {
  constructor() {
    this.el = document.createElement('aside');
    this.el.className = 'dx-action';
    this.el.style.display = 'none';
    document.body.appendChild(this.el);

    // ESC először a panelt zárja (capture) — nem ugrik vissza a Core-ba
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      if (e.key === 'Escape') { e.stopPropagation(); this.hide(); }
    }, true);
  }

  get isOpen() { return this.el.classList.contains('is-open'); }

  show(fnDef, moduleDef) {
    this.el.style.setProperty('--accent', moduleDef.accent);
    this.el.innerHTML = `
      <header class="dx-action__head">
        <span class="dx-action__chip">${moduleDef.label}</span>
        <button class="dx-action__close" aria-label="close">✕</button>
      </header>
      <h2 class="dx-action__title">${fnDef.label}</h2>
      <p class="dx-action__body">
        This workspace arrives in a later DIXOR milestone.
        The navigation layer you are using now will lead here.
      </p>
      <ul class="dx-action__meta">
        <li><span>STATUS</span>PLANNED</li>
        <li><span>SOURCE</span>MASTER CONCEPT</li>
        <li><span>BUILD</span>v0.1.0 CONCEPT</li>
      </ul>`;
    this.el.style.display = '';
    requestAnimationFrame(() => this.el.classList.add('is-open'));

    this.el.querySelector('.dx-action__close')
      .addEventListener('click', () => this.hide());
  }

  hide() {
    this.el.classList.remove('is-open');
    setTimeout(() => { if (!this.isOpen) this.el.style.display = 'none'; }, 250);
  }
}