import * as THREE from 'three';
import { MODULE_LIST } from './node-data.js';
import { createVisual } from './node-factory.js';
import { createGlow } from '../visual/glow.js';

const NODE_SCALE = 0.88;

/* KLASZTER-TERKEP: logikus csoportok, nagy tavolsagokkal */
const POS_BY_ID = {
  work:      { x: 14,  z: 5 },
  life:      { x: 15.5,z: -2 },
  create:    { x: 12,  z: -8 },
  learn:     { x: -8,  z: 13 },
  discover:  { x: -14, z: 7 },
  explore:   { x: -16, z: -1 },
  analyze:   { x: -12, z: -8 },
  wellbeing: { x: -4,  z: -16 },
  personal:  { x: 5,   z: -17 },
  timeline:  { x: 11,  z: -13 },
};

/**
 * NODE MANAGER - klaszter-formacio: harom atlathato csoport,
 * minden node sajat helye korul lassan kooroz (finom elet).
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
    MODULE_LIST.forEach((def, i) => {
      const node = createVisual(def);

      const base = POS_BY_ID[def.id] || { x: Math.sin(i) * 10, z: Math.cos(i) * 10 };
      node.orbit = {
        angle: Math.random() * Math.PI * 2,
        cx: base.x,
        cz: base.z,
        r: 1.1,
        speed: 0.06 + Math.random() * 0.04,
        bobPh: Math.random() * Math.PI * 2,
        bobAmp: 0.16,
      };

      node.group.position.set(base.x, Math.sin(i * 1.7) * 0.25, base.z);

      // === JAVÍTÁS: Hitbox raycast-készítés ===
      node.hitbox.userData.nodeRef = node;
      
      // 1. Látható maradjon a raycasternek
      node.hitbox.visible = true; 
      
      // 2. Material beállítása: láthatatlan, de raycast-elhető
      if (node.hitbox.material) {
        const m = node.hitbox.material;
        m.transparent = true;
        m.opacity = 0;           // Emberi szemnek láthatatlan
        m.depthWrite = false;    // Nem írja a depth buffer-t (nem zaklatja a háttér)
        m.colorWrite = false;    // Nem írja a színt (teljesítmény + nem látszik)
        // Ha array van (multi-material), mindet bejárunk
        if (Array.isArray(m)) {
          m.forEach(mat => { mat.transparent = true; mat.opacity = 0; mat.depthWrite = false; mat.colorWrite = false; });
        }
      }
      // 3. Biztosítjuk, hogy a geometria elég nagy legyen a kattintáshoz (opcionális skálázás)
      // node.hitbox.scale.setScalar(1.2); // Ha kicsinek tűnik, ezzé bővíthető
      
      node.group.add(node.hitbox);

      node.halo = createGlow(def.accent, 4.4 * NODE_SCALE, 0.12);
      node.group.add(node.halo);

      this.group.add(node.group);
      this.nodes.push(node);
      this.targets.push(node.hitbox);
    });
  }

  /** Külső raycasterhez (pl. raycaster.js) elérhető targets lista */
  getTargets() {
    return this.targets;
  }

  getById(id) {
    return this.nodes.find((nd) => nd.def.id === id) ?? null;
  }

  update(dt, t) {
    for (const n of this.nodes) {
      const o = n.orbit;
      o.angle += dt * o.speed;
      n.group.position.set(
        o.cx + Math.cos(o.angle) * o.r,
        Math.sin(t * 0.6 + o.bobPh) * o.bobAmp,
        o.cz + Math.sin(o.angle) * o.r
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
