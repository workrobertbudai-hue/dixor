/** Lebegő címke a hoverelt node-hoz (HTML overlay a WebGL fölött). */
export class NodeLabel {
  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'dx-node-label';
    this.el.innerHTML =
      '<div class="dx-node-label__name"></div>' +
      '<div class="dx-node-label__tagline"></div>';
    document.body.appendChild(this.el);

    this.nameEl = this.el.querySelector('.dx-node-label__name');
    this.tagEl = this.el.querySelector('.dx-node-label__tagline');
  }

  show(def, x, y) {
    this.nameEl.textContent = def.label;
    this.tagEl.textContent = def.tagline;
    this.el.style.borderLeftColor = def.accent;
    this.move(x, y);
    this.el.classList.add('is-visible');
  }

  move(x, y) {
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
  }

  hide() {
    this.el.classList.remove('is-visible');
  }
}