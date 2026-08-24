/**
 * DWELL CONTROLLER v3 - minden aktivacio toltesi idovel tortenik.
 * Friss cel es lapozas egyarant ugyanazzal a nyugodt idozitessel.
 * Panel alatt sosem actival (elementFromPoint vedelem).
 */
export class DwellController {
  constructor(app) {
    this.app = app;
    this.enabled = app.stateStore.getKV('dwellOn', true) === true;
    this.DWELL_MS = 1600;
    this.node = null;
    this.progress = 0;

    const wrap = document.createElement('div');
    wrap.className = 'dx-dwell';
    this.btn = document.createElement('button');
    this.btn.title = 'Hover-flip navigation (no clicking)';
    this.btn.innerHTML = '&#10547;';
    this.btn.addEventListener('click', () => this.toggle());
    wrap.appendChild(this.btn);
    document.body.appendChild(wrap);
    this.#paint();

    this.ring = document.createElement('div');
    this.ring.className = 'dx-dwellring';
    this.ring.innerHTML = '<i></i>';
    document.body.appendChild(this.ring);
  }

  toggle() { this.setEnabled(!this.enabled); }

  setEnabled(v) {
    this.enabled = !!v;
    this.app.stateStore.setKV('dwellOn', this.enabled);
    this.#paint();
    if (!this.enabled) this.#hide();
  }

  #paint() { this.btn.classList.toggle('is-on', this.enabled); }

  reset() {
    this.node = null;
    this.progress = 0;
    this.#hide();
  }

  #hide() { this.ring.classList.remove('is-on'); }

  update(dt, node, mouse) {
    if (!this.enabled || !node || !mouse) { this.reset(); return; }

    /* panel alatt sosem activalunk */
    const el = document.elementFromPoint(mouse.clientX, mouse.clientY);
    if (!el || el.tagName !== 'CANVAS') { this.reset(); return; }

    if (node !== this.node) {
      this.node = node;
      this.progress = 0;
    }
    this.progress += dt * 1000;

    const k = Math.min(1, this.progress / this.DWELL_MS);

    this.ring.classList.add('is-on');
    this.ring.style.left = mouse.clientX + 'px';
    this.ring.style.top = mouse.clientY + 'px';
    this.ring.style.setProperty('--p', String(Math.round(k * 100)));

    if (k >= 1) {
      const def = node.def;
      this.reset();
      if (typeof node.pulse === 'number') node.pulse = 1;
      const c = this.app.click;
      if (c && c.onSelect) c.onSelect(def);
    }
  }
}