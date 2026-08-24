import * as THREE from 'three';
import { createGlow } from './glow.js';

/**
 * CONNECTION WEB - fenszalak a core es a node-ok kozott.
 * A vegpontok MINDEN KERETBEN kovetik a node-ok aktualis poziciojat,
 * igy a paralya-korozes alatt is osszekotnek mindent.
 */
export class ConnectionWeb {
  constructor(scene, nodes) {
    this.origin = new THREE.Vector3(0, 0, 0);
    this._wp = new THREE.Vector3();

    this.lines = nodes.map((n) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        this.origin.clone(),
        n.group.position.clone(),
      ]);
      const mat = new THREE.LineBasicMaterial({
        color: n.def.accent,
        transparent: true,
        opacity: 0.07,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geo, mat);
      scene.add(line);
      return { mat, geo, node: n };
    });

    this.pulse = createGlow(0xffffff, 0.7, 0.95);
    this.pulse.visible = false;
    scene.add(this.pulse);
  }

  update(dt, t, hoveredNode) {
    let activeLine = null;

    for (const c of this.lines) {
      /* vegpont kovetese */
      c.node.group.getWorldPosition(this._wp);
      const arr = c.geo.attributes.position.array;
      arr[0] = this.origin.x; arr[1] = this.origin.y; arr[2] = this.origin.z;
      arr[3] = this._wp.x;   arr[4] = this._wp.y;    arr[5] = this._wp.z;
      c.geo.attributes.position.needsUpdate = true;

      const active = c.node === hoveredNode;
      if (active) activeLine = c;

      const distFade = THREE.MathUtils.clamp(1 - (c.node.group.position.length() - 7) / 6, 0.25, 1);
      const target = active ? 0.55 : (0.07 + Math.sin(t * 1.2 + c.node.orbit.angle * 2.0) * 0.02) * distFade;
      c.mat.opacity += (target - c.mat.opacity) * Math.min(1, dt * 6);
    }

    if (activeLine) {
      activeLine.node.group.getWorldPosition(this._wp);
      this.pulse.material.color.set(activeLine.node.def.accent);
      const k = (t * 0.65) % 1;
      this.pulse.position.lerpVectors(this.origin, this._wp, k);
      this.pulse.visible = true;
    } else {
      this.pulse.visible = false;
    }
  }
}