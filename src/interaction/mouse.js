import * as THREE from 'three';

/** Egérpozíció normált eszközkoordinátákban (NDC) + képernyő-pixelekben. */
export class Mouse {
  constructor(dom) {
    this.ndc = new THREE.Vector2(-2, -2); // képernyőn kívül = nincs találat
    this.clientX = 0;
    this.clientY = 0;

    dom.addEventListener('pointermove', (e) => {
      this.clientX = e.clientX;
      this.clientY = e.clientY;
      this.ndc.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    });

    dom.addEventListener('pointerleave', () => this.ndc.set(-2, -2));
  }
}