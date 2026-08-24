import * as THREE from 'three';
import { createGlow } from '../visual/glow.js';

/**
 * CORE WORLD V2 - latvanyos kozpont:
 * szinvaltozo mag (teal->kek->ibolya), dupla energia-gyuru,
 * keringo fenszilankok, idoszakos energiapulzus.
 */
export class CoreWorld {
  constructor() {
    this.group = new THREE.Group();
    this.hueT = 0;

    /* belso mag: irizallo anyag */
    this.coreMat = new THREE.MeshStandardMaterial({
      color: 0x0b1420, metalness: 0.92, roughness: 0.22,
      emissive: 0x57e6d9, emissiveIntensity: 0.65,
    });
    this.core = new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), this.coreMat);

    /* kulso racs-hej */
    this.shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(2.45, 1),
      new THREE.MeshBasicMaterial({ color: 0x57e6d9, wireframe: true, transparent: true, opacity: 0.2 })
    );

    /* masodik hej: ellentetes forgasu, halvanyabb */
    this.shell2 = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3.05, 0),
      new THREE.MeshBasicMaterial({ color: 0x7aa2ff, wireframe: true, transparent: true, opacity: 0.12 })
    );

    /* dupla energia-gyuru */
    this.ringA = new THREE.Mesh(
      new THREE.TorusGeometry(3.75, 0.03, 10, 160),
      new THREE.MeshBasicMaterial({ color: 0x57e6d9, transparent: true, opacity: 0.55 })
    );
    this.ringA.rotation.x = Math.PI / 2.3;

    this.ringB = new THREE.Mesh(
      new THREE.TorusGeometry(4.5, 0.02, 10, 180),
      new THREE.MeshBasicMaterial({ color: 0x9d8cff, transparent: true, opacity: 0.38 })
    );
    this.ringB.rotation.x = Math.PI / 1.8;
    this.ringB.rotation.y = 0.5;

    /* mag-feny es nagy aura */
    this.heartGlow = createGlow(0x57e6d9, 4.6, 0.6);
    this.aura = createGlow(0x7aa2ff, 10, 0.16);

    /* keringo fenszilankok */
    this.shards = [];
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.09 + Math.random() * 0.07),
        new THREE.MeshBasicMaterial({ color: 0x9fe8ff })
      );
      const a = (i / 10) * Math.PI * 2;
      s.userData = {
        a, rr: 3.3 + Math.random() * 1.1,
        vy: (Math.random() - 0.5) * 1.2,
        sp: 0.35 + Math.random() * 0.3,
      };
      this.shards.push(s);
      this.group.add(s);
    }

    /* energiapulzus: lezeres lokeshullam (ket eles gyuru) */
    this.pulseRingA = new THREE.Mesh(
      new THREE.TorusGeometry(3.6, 0.045, 10, 160),
      new THREE.MeshBasicMaterial({
        color: 0x8ff0ff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    this.pulseRingA.rotation.x = Math.PI / 2;

    this.pulseRingB = new THREE.Mesh(
      new THREE.TorusGeometry(3.6, 0.035, 10, 160),
      new THREE.MeshBasicMaterial({
        color: 0x9d8cff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
    );
    this.pulseRingB.rotation.x = Math.PI / 2.6;
    this.pulseRingB.rotation.y = 0.4;
    this.pulseT = 999;
    this.nextPulse = 5 + Math.random() * 4;

    this.group.add(this.core, this.shell, this.shell2, this.ringA, this.ringB, this.heartGlow, this.aura, this.pulseRingA, this.pulseRingB);
  }

  update(dt, elapsed) {
    /* szinvaltas teal -> kek -> ibolya -> vissza */
    this.hueT += dt * 0.03;
    const hue = 0.48 + Math.sin(this.hueT) * 0.13;
    const col = new THREE.Color().setHSL(hue, 0.85, 0.55);
    this.coreMat.emissive.copy(col);
    this.heartGlow.material.color.copy(col);

    this.core.rotation.y += dt * 0.4;
    this.core.rotation.x += dt * 0.16;
    this.shell.rotation.y -= dt * 0.06;
    this.shell2.rotation.y += dt * 0.045;
    this.ringA.rotation.z += dt * 0.22;
    this.ringB.rotation.z -= dt * 0.15;

    this.core.position.y = Math.sin(elapsed * 0.7) * 0.1;

    /* lelegzes */
    const breathe = 1 + Math.sin(elapsed * 1.1) * 0.04;
    this.core.scale.setScalar(breathe);
    this.heartGlow.material.opacity = 0.5 + Math.sin(elapsed * 1.1) * 0.12;
    this.aura.material.opacity = 0.13 + Math.sin(elapsed * 0.6) * 0.05;

    /* fenszilankok keringese */
    this.shards.forEach((s) => {
      const u = s.userData;
      u.a += dt * u.sp;
      s.position.set(Math.cos(u.a) * u.rr, Math.sin(elapsed * 0.9 + u.a * 2) * u.vy, Math.sin(u.a) * u.rr);
      s.rotation.x += dt * 1.5; s.rotation.y += dt * 1.1;
    });

    /* energiapulzus */
    this.pulseT += dt;
    if (this.pulseT > this.nextPulse) {
      this.pulseT = 0;
      this.nextPulse = 6 + Math.random() * 5;
    }
    if (this.pulseT < 3.0) {
      const k = this.pulseT / 3.0;
      const s = 1 + k * 9;
      this.pulseRingA.scale.setScalar(s);
      this.pulseRingA.material.opacity = 0.24 * (1 - k);
      this.pulseRingB.scale.setScalar(s + 0.4);
      this.pulseRingB.material.opacity = 0.17 * (1 - k);
    } else {
      this.pulseRingA.material.opacity = 0;
      this.pulseRingB.material.opacity = 0;
    }
  }
}