/**
 * DWELL CONTROLLER v4 - vegso logika:
 * - LAPOZAS (kurzor node-rol node-ra): AZONNALI aktivacio
 * - HIDEG erkezes (ures terrol): vedo toltes gyuruvel (~1.2 s)
 * Panel alatt sosem actival. Allapot perzisztens.
 */
export class DwellController {
  constructor(app) {
    this.app = app;
    this.enabled = app.stateStore.getKV('dwellOn', true) === true;
    this.COLD_FILL_MS = 1200;  /* hideg erkezes vedoideje */
    this.FLIP_GRACE_MS = 380;  /* mennyi ido szamit meg "lapozasnak" */

    this.lastNodeId = null;
    this.sinceLeft = Infinity;

    const wrap = document.createElement('div');
    wrap.className = 'dx-dwell';
    this.btn = document.createElement('button');
    this.btn.title = 'Hover-flip navigation';
    this.btn.innerHTML = '&#10547;';
    this.btn.addEventListener('click', () => this.toggle());
    wrap.appendChild(this.btn);
    document.body.appendChild(wrap);
    this.#paint();

    this.ring = document.createElement('div');
    this.ring.className = 'dx-dwellring';
    this.ring.innerHTML = '<i></i>';
    document.body.appendChild(this.ring);

    this.current = null;
    this.fillMs = 0;
    console.log('[DIXOR] dwell v4 ready');
  }

  toggle() { this.setEnabled(!this.enabled); }

  setEnabled(v) {
    this.enabled = !!v;
    this.app.stateStore.setKV('dwellOn', this.enabled);
    this.#paint();
    if (!this.enabled) this.#resetAll();
  }

  #paint() { this.btn.classList.toggle('is-on', this.enabled); }

  #resetAll() {
    this.current = null;
    this.fillMs = 0;
    this.ring.classList.remove('is-on');
  }

  update(dt, node, mouse) {
    /* ha eppen nincs node alattunk, szamoljuk mennyi telt el */
    if (!this.enabled || !mouse) { return; }

    /* panel alatt sosem activalunk */
    const el = document.elementFromPoint(mouse.clientX, mouse.clientY);
    if (!el || el.tagName !== 'CANVAS') { return; }

    if (!node) {
      if (this.current) {
        this.lastNodeId = this.current.def.id;
        this.sinceLeft = 0;
      }
      this.current = null;
      this.fillMs = 0;
      this.ring.classList.remove('is-on');
      return;
    }

    this.sinceLeft += dt * 1000;

    const def = node.def;
    const isNew = !this.current || this.current.def.id !== def.id;

    if (isNew) {
      /* LAPOZAS-e? nem regen hagyta el masik node */
      const isFlip = this.sinceLeft <= this.FLIP_GRACE_MS &&
                     this.lastNodeId && this.lastNodeId !== def.id;

      this.current = node;
      this.fillMs = 0;

      if (isFlip) {
        /* AZONNALI lapozas */
        this.ring.classList.remove('is-on');
        if (typeof node.pulse === 'number') node.pulse = 1;
        const c = this.app.click;
        if (c && c.onSelect) c.onSelect(def);
        this.lastNodeId = def.id;
        this.sinceLeft = 0;
        return;
      }

      /* hideg erkezes: indul a vedo toltes */
      this.ring.classList.add('is-on');
      this.ring.style.left = mouse.clientX + 'px';
      this.ring.style.top = mouse.clientY + 'px';
      this.ring.style.setProperty('--p', '0');
      return;
    }

    /* ugyanazon a node-on vagyunk: hideg toltes halad */
    this.fillMs += dt * 1000;
    const k = Math.min(1, this.fillMs / this.COLD_FILL_MS);
    this.ring.classList.add('is-on');
    this.ring.style.left = mouse.clientX + 'px';
    this.ring.style.top = mouse.clientY + 'px';
    this.ring.style.setProperty('--p', String(Math.round(k * 100)));

    if (k >= 1) {
      this.ring.classList.remove('is-on');
      if (typeof node.pulse === 'number') node.pulse = 1;
      const c = this.app.click;
      if (c && c.onSelect) c.onSelect(def);
      this.lastNodeId = def.id;
      this.sinceLeft = 0;
      this.current = null;
      this.fillMs = 0;
    }
  }
}