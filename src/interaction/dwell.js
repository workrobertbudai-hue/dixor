/**
 * DWELL CONTROLLER v5 - tisztan lapozo mod.
 * Uj node-ra erve a kurzor AZONNAL aktival (nincs toltesi ido).
 * Kapcsolohanggal, allapot perzisztensen. Panel alatt nem actival.
 */
export class DwellController {
  constructor(app) {
    this.app = app;
    this.enabled = app.stateStore.getKV('dwellOn', true) === true;
    this.currentId = null;

    const wrap = document.createElement('div');
    wrap.className = 'dx-dwell';
    this.btn = document.createElement('button');
    this.btn.title = 'Hover navigation';
    this.btn.innerHTML = '&#10547;';
    this.btn.addEventListener('click', () => this.toggle());
    wrap.appendChild(this.btn);
    document.body.appendChild(wrap);
    this.#paint();
  }

  toggle() { this.setEnabled(!this.enabled); }

  setEnabled(v) {
    this.enabled = !!v;
    this.app.stateStore.setKV('dwellOn', this.enabled);
    this.#paint();
    if (!this.enabled) this.currentId = null;
  }

  #paint() { this.btn.classList.toggle('is-on', this.enabled); }

  update(dt, node, mouse) {
    if (!this.enabled || !node || !mouse) { this.currentId = null; return; }

    /* panel alatt sosem activalunk */
    const el = document.elementFromPoint(mouse.clientX, mouse.clientY);
    if (!el || el.tagName !== 'CANVAS') { this.currentId = null; return; }

    const id = node.def.id;
    if (id === this.currentId) return;

    /* uj node a kurzor alatt -> azonnali aktivacio */
    this.currentId = id;
    if (typeof node.pulse === 'number') node.pulse = 1;
    const c = this.app.click;
    if (c && c.onSelect) c.onSelect(node.def);
  }
}