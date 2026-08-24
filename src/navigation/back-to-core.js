/** Vissza a Core-ba: látható gomb + ESC billentyű. */
export class BackToCore {
  constructor({ onBack }) {
    this.onBack = onBack;

    this.el = document.createElement('button');
    this.el.className = 'dx-back';
    this.el.innerHTML = '◂ <span>BACK TO CORE</span>';
    this.el.addEventListener('click', () => this.onBack?.());
    document.body.appendChild(this.el);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.onBack?.();
    });
  }

  show() { this.el.classList.add('is-visible'); }
  hide() { this.el.classList.remove('is-visible'); }
}