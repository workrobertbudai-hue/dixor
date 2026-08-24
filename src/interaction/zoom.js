import * as THREE from 'three';

/**
 * ZOOM CONTROLLER - goero + onmagat kirajzolo gombok + billentyu.
 * A kamera a nezesi cel korul mozog, tavolsag hatarokkozott.
 */
const MIN_D = 4.5;
const MAX_D = 46;

export class ZoomController {
  constructor(app) {
    this.app = app;
    const dom = app.renderer.domElement;

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.byFactor(e.deltaY > 0 ? 1.13 : 0.885);
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      const t = e.target && e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      if (e.key === '+' || e.key === '=') this.byFactor(0.88);
      else if (e.key === '-' || e.key === '_') this.byFactor(1.13);
      else if (e.key === '0') this.reset();
    });

    this.#buildButtons();
  }

  #buildButtons() {
    const wrap = document.createElement('div');
    wrap.className = 'dx-zoom';

    const mk = (label, title, fn) => {
      const b = document.createElement('button');
      b.innerHTML = label;
      b.title = title;
      b.addEventListener('click', fn);
      wrap.appendChild(b);
      return b;
    };

    mk('+', 'Zoom in (+)', () => this.byFactor(0.88));
    mk('&minus;', 'Zoom out (-)', () => this.byFactor(1.13));
    mk('&#10227;', 'Reset view (0)', () => this.reset());

    document.body.appendChild(wrap);
  }

  #active() {
    const a = this.app;
    if (!a || !a.camera || !a.transition) return false;
    if (!a.navigation) return false;
    return a.navigation.state !== 'traveling';
  }

  byFactor(f) {
    if (!this.#active()) return;
    const a = this.app;
    const look = a.transition.lookTarget;
    const dir = a.camera.position.clone().sub(look);
    if (dir.lengthSq() < 0.0001) dir.set(0, 0, 1);
    dir.setLength(THREE.MathUtils.clamp(dir.length() * f, MIN_D, MAX_D));
    a.camera.position.copy(look).add(dir);
  }

  reset() {
    if (!this.#active()) return;
    const a = this.app;
    const dist = a.navigation.state === 'module' ? 11 : 14;
    const dir = a.camera.position.clone().sub(a.transition.lookTarget);
    if (dir.lengthSq() < 0.0001) dir.set(0, 1.2, dist); else dir.setLength(dist);
    a.camera.position.copy(a.transition.lookTarget).add(dir);
  }
}