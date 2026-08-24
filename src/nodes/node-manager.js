import * as THREE from 'three';
import { MODULE_LIST } from './node-data.js';
import { createVisual } from './node-factory.js';
import { createGlow } from '../visual/glow.js';

const NODE_SCALE = 0.88;

/**
 * NODE MANAGER - sajat sugar-savok + lassu paralya-korozes.
 * Minden node sajat tempoban aramlk a gyuru menten (finoman lathatoan),
 * es halvÃƒÂ¡nyan lebeg fel-le. A halo es a hitbox egyutt koveti.
 */
export class NodeManager {
  constructor(scene) {
    this.group = new THREE.Group();
    this.nodes = [];
    this.targets = [];
    this.#build();
    scene.add(this.group);
  }

  #build() {
    const n = MODULE_LIST.length;

    const RADII = [9.0, 7.0, 8.3, 7.2, 8.5, 7.1, 8.2, 9.5, 7.9];

    MODULE_LIST.forEach((def, i) => {
      const node = createVisual(def);

      /* palya-parameterek */
      node.orbit = {
        angle: (i / n) * Math.PI * 2,
        radius: RADII[i % RADII.length],
        speed: 0.024 + (i % 4) * 0.007,   /* rad/s - teljes kor kb. 3-6 perc */
        baseY: Math.sin(i * 2.1) * 0.55,
        bobPh: i * 1.37,
        bobAmp: 0.14,
      };

      node.group.position.set(
        Math.sin(node.orbit.angle) * node.orbit.radius,
        node.orbit.baseY,
        Math.cos(node.orbit.angle) * node.orbit.radius
      );

      node.hitbox.userData.nodeRef = node;
      node.group.add(node.hitbox);

      node.halo = createGlow(def.accent, 4.4 * NODE_SCALE, 0.12);
      node.group.add(node.halo);

      this.group.add(node.group);
      this.nodes.push(node);
      this.targets.push(node.hitbox);
    });
  }

  getById(id) {
    return this.nodes.find((nd) => nd.def.id === id) ?? null;
  }

  update(dt, t) {
    for (const n of this.nodes) {
      /* paralya-korozes */
      n.orbit.angle += dt * n.orbit.speed;
      n.group.position.set(
        Math.sin(n.orbit.angle) * n.orbit.radius,
        n.orbit.baseY + Math.sin(t * 0.6 + n.orbit.bobPh) * n.orbit.bobAmp,
        Math.cos(n.orbit.angle) * n.orbit.radius
      );

      n.group.rotation.y += dt * n.spin;

      const target = (n.isHovered ? 1.16 : 1) + n.pulse * 0.22;
      n.scaleCur += (target - n.scaleCur) * Math.min(1, dt * 9);
      n.group.scale.setScalar(n.scaleCur * NODE_SCALE);

      const boost = 1 + (n.scaleCur - 1) * 2.5 + n.pulse * 1.5;
      for (const m of n.reactive) {
        m.emissiveIntensity = m.userData.baseEI * boost;
      }

      n.halo.material.opacity =
        0.11 + (n.scaleCur - 1) * 1.1 + n.pulse * 0.45 + Math.sin(t * 1.1) * 0.02;

      if (n.customUpdate) n.customUpdate(dt, t, n.group);
      n.pulse = Math.max(0, n.pulse - dt * 2.2);
    }
  }
}