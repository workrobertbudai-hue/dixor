import * as THREE from 'three';

/**
 * ORBIT CONTROLLER - BAL gombos huzasra korbennezunk a nezesi cel korul.
 * A click.js 6px kuszobevel osszhangban: rovid mozdulat = kattintas,
 * hosszabb huzas = forgatas. Repules kozben inaktÃ­v.
 */
export class OrbitController {
  constructor(app) {
    this.app = app;
    const dom = app.renderer.domElement;

    this.dragging = false;
    this.moved = false;
    this.px = 0;
    this.py = 0;

    const sph = new THREE.Spherical();
    const dir = new THREE.Vector3();

    dom.addEventListener('pointerdown', (e) => {
      const isTouch = e.pointerType === 'touch';
      if (!isTouch && e.button !== 0) return;
      if (isTouch && e.isPrimary === false) return;
      const nav = app.navigation;
      if (nav && nav.state === 'traveling') return;
      this.dragging = true;
      this.moved = false;
      this.px = e.clientX;
      this.py = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.px;
      const dy = e.clientY - this.py;
      this.px = e.clientX;
      this.py = e.clientY;

      if (!this.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      this.moved = true;
      dom.style.cursor = 'grabbing';

      const a = this.app;
      if (!a.camera || !a.transition) return;
      const look = a.transition.lookTarget;
      dir.copy(a.camera.position).sub(look);
      if (dir.lengthSq() < 0.000001) dir.set(0, 0, 1);
      sph.setFromVector3(dir);
      sph.theta -= dx * 0.0045;
      sph.phi = THREE.MathUtils.clamp(sph.phi - dy * 0.0045, 0.12, Math.PI - 0.45);
      dir.setFromSpherical(sph);
      a.camera.position.copy(look).add(dir);
      a.camera.lookAt(look);
    });

    window.addEventListener('pointerup', (e) => {
      if (e.button !== 0 || !this.dragging) return;
      this.dragging = false;
      this.moved = false;
      dom.style.cursor = '';
    });
  }
}