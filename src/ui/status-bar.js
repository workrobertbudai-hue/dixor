/** STATUS BAR — aktuális terület + kontextus-tipp (jobb alul). */
export class StatusBar {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'dx-status';
    this.el.innerHTML = `
      <span class="dx-status__area">CORE</span>
      <span class="dx-status__sep">·</span>
      <span class="dx-status__hint">PRESS / TO SEARCH</span>`;
    document.body.appendChild(this.el);
    this.areaEl = this.el.querySelector('.dx-status__area');
    this.hintEl = this.el.querySelector('.dx-status__hint');
  }

  setArea(label, accent, hint) {
    this.areaEl.textContent = label;
    this.areaEl.style.color = accent || 'var(--dx-accent)';
    this.hintEl.textContent = hint;
  }
}