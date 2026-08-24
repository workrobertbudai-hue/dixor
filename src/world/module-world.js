import * as THREE from 'three';
import { BUILDERS } from '../nodes/node-factory.js';
import { createFunctionNodes } from '../nodes/function-node.js';

/**
 * MODULE WORLD - elo cel-vilag: az identitas-geometria folyamatosan forog,
 * a funkcio-node-ok keringenek, legyeznek, a racs es a lamp is eletben van.
 */
export class ModuleWorld {
  constructor(def) {
    this.def = def;
    this.group = new THREE.Group();
    this.funcNodes = [];
    this.targets = [];

    const builder = BUILDERS[def.geometry];
    if (builder) {
      this.built = builder(def.accent);
      this.built.group.scale.setScalar(2.2);
      this.built.group.position.y = 0.9;
      this.group.add(this.built.group);
    }

    const fn = createFunctionNodes(def);
    this.funcGroup = fn.group;
    this.funcNodes = fn.nodes;
    this.targets = fn.targets;
    this.group.add(fn.group);

    const c = new THREE.Color(def.accent);
    const grid = new THREE.PolarGridHelper(16, 16, 8, 64, c, c);
    grid.material.transparent = true;
    grid.material.opacity = 0.1;
    grid.position.y = -2.4;
    this.grid = grid;
    this.group.add(grid);

    const lamp = new THREE.PointLight(c, 55, 50, 2);
    lamp.position.set(0, 5, 4);
    this.lamp = lamp;
    this.group.add(lamp);
  }

  update(dt, t) {
    // kozponti geometria: teljes sajat animacio (keretek, mag, gYuru)
    if (this.built) {
      this.built.group.rotation.y += dt * this.built.spin * 0.6;
      this.built.customUpdate ? this.built.customUpdate(dt, t, this.built.group) : null;
    }

    // funkcio-gyuru lassu ellenforgasa
    this.funcGroup.rotation.y -= dt * 0.05;

    for (const n of this.funcNodes) {
      n.mesh.rotation.y += dt * 0.9;
      n.ring.rotation.z += dt * 0.6;

      if (n.bornAt === undefined || n.bornAt === null || n.bornAt < 0) n.bornAt = t;
      const ageRaw = (t - n.bornAt) / 0.9;
      const age = !isFinite(ageRaw) ? 1 : (ageRaw >= 1 ? 1 : (ageRaw > 0 ? ageRaw : 0));
      const born = age * age * (3 - 2 * age);
      const targetScale = ((n.isHovered ? 1.65 : 1) + n.pulse * 0.6) * (0.2 + 0.8 * born);
      n.scaleCur += (targetScale - n.scaleCur) * Math.min(1, dt * 10);
      n.group.scale.setScalar(n.scaleCur);

      const boost = 1 + (n.scaleCur - 1) * 2 + n.pulse * 1.5;
      n.mesh.material.emissiveIntensity =
        n.mesh.material.userData.baseEI * boost;

      n.halo.material.opacity =
        0.42 + Math.sin(t * 2.2 + n.phase) * 0.14
             + (n.scaleCur - 1) * 0.8 + n.pulse * 0.4;

      n.pulse = Math.max(0, n.pulse - dt * 2.2);
    }

    // ter legelese: racs fordul, lampa pulzal
    this.grid.rotation.y += dt * 0.02;
    this.lamp.intensity = 55 + Math.sin(t * 1.3) * 10;
  }
}
