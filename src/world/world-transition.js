import * as THREE from 'three';
import { Easing } from '../visual/animation.js';

/**
 * WORLD TRANSITION — kamerarepülés + fátyol-átmenet világok között.
 * Ez adja az „új környezetbe érkezés" élményét (§5).
 */
export class WorldTransition {
  constructor(camera) {
    this.camera = camera;
    this.lookTarget = new THREE.Vector3(0, 0, 0);
    this.tweens = [];

    this.veil = document.createElement('div');
    this.veil.className = 'dx-veil';
    document.body.appendChild(this.veil);
  }

  tween(duration, onUpdate, { ease = Easing.cubicInOut, onDone } = {}) {
    this.tweens.push({ t: 0, duration, ease, onUpdate, onDone, done: false });
  }

  update(dt) {
    for (const tw of this.tweens) {
      if (tw.done) continue;
      tw.t = Math.min(1, tw.t + dt / tw.duration);
      tw.onUpdate(tw.ease(tw.t));
      if (tw.t >= 1) { tw.done = true; tw.onDone?.(); }
    }
    this.tweens = this.tweens.filter((t) => !t.done);
  }

  /** Kamera repültetése A→B pontra, közben a nézőpontot is interpolálva. */
  flyTo(endPos, endLook, duration = 1.15, onDone) {
    const startPos = this.camera.position.clone();
    const startLook = this.lookTarget.clone();
    const pos = new THREE.Vector3();
    const look = new THREE.Vector3();

    this.tween(duration, (k) => {
      pos.lerpVectors(startPos, endPos, k);
      look.lerpVectors(startLook, endLook, k);
      this.camera.position.copy(pos);
      this.lookTarget.copy(look);
      this.camera.lookAt(look);
    }, { onDone });
  }

  veilIn(cb) { this.veil.classList.add('is-on'); setTimeout(cb, 480); }
  veilOut() { this.veil.classList.remove('is-on'); }
}