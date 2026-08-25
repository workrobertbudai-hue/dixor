import * as THREE from 'three';
import { createGlow } from './glow.js';

export const ConstellationEvents = {
  ENTER_FIRST:    { label: 'FIRST ENTRY',        color: 0xffffff },
  LEARN_SESSION:  { label: 'LEARNING SESSION',   color: 0x9d8cff },
  JOB_TRACKED:    { label: 'APPLICATION SENT',   color: 0x57e6d9 },
  SKILL_FOUND:    { label: 'SKILL DISCOVERED',   color: 0x7fe3b2 },
  RADAR_ON:       { label: 'RADAR ACTIVATED',    color: 0xffd479 },
  INTERVIEW_PRAC: { label: 'INTERVIEW PRACTICE', color: 0x7aa2ff },
  CAREER_STEP:    { label: 'CAREER STEP',        color: 0xffd479 },
  CHAT_JOINED:    { label: 'COMMUNITY VOICE',    color: 0x6fc9ff },
  DISCOVERY:      { label: 'DISCOVERY SAVED',    color: 0xc9d1e0 },
  CREATION:       { label: 'CREATION MADE',      color: 0xff9e9e },
};

/**
 * CONSTELLATION - a felhasznalo fejlodesenek csillagkepe.
 * Minden jelentes tett egy fenypont a Core korul; fenszalak kotik oket.
 */
export class Constellation {
  constructor(scene, stateStore) {
    this.scene = scene;
    this.store = stateStore;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.stars = [];
    this.lines = [];
    this.rebuild();
  }

  starPos(i, N) {
    const golden = (i * 137.5 * Math.PI) / 180;
    const rr = 4.8 + (N > 1 ? i / (N - 1) : 0) * 3.4;
    const y = 2.2 + Math.sin(i * 0.9) * 1.1 + i * 0.05;
    return new THREE.Vector3(Math.cos(golden) * rr, y, Math.sin(golden) * rr);
  }

  rebuild() {
    for (const s of this.stars) { this.group.remove(s.mesh); this.group.remove(s.glow); }
    for (const l of this.lines) this.group.remove(l);
    this.stars = []; this.lines = [];

    const list = this.store.getKV('constellation', []);
    if (!list.length) return;
    const N = list.length;

    list.forEach((ev, i) => {
      const def = ConstellationEvents[ev.t];
      if (!def) return;

      const pos = this.starPos(i, N);

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.09 + (def.size || 1) * 0.03, 10, 10),
        new THREE.MeshBasicMaterial({ color: def.color })
      );
      mesh.position.copy(pos);
      const glow = createGlow(def.color, 1.4 + (def.size || 1), 0.75);
      glow.position.copy(pos);
      this.group.add(mesh, glow);
      this.stars.push({ mesh, glow });

      if (i > 0 && ConstellationEvents[list[i - 1].t]) {
        const prevPos = this.starPos(i - 1, N);
        const geo = new THREE.BufferGeometry().setFromPoints([prevPos, pos]);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0x57e6d9, transparent: true, opacity: 0.16,
          blending: THREE.AdditiveBlending,
        });
        const line = new THREE.Line(geo, lineMat);
        this.group.add(line);
        this.lines.push(line);
      }
    });
    console.log('[Constellation] stars:', this.stars.length);
  }

  addEvent(typeKey) {
    if (!ConstellationEvents[typeKey]) return;
    const list = this.store.getKV('constellation', []);
    list.push({ t: typeKey, at: Date.now() });
    while (list.length > 120) list.shift();
    this.store.setKV('constellation', list);
    this.rebuild();
  }

  update(dt, t) {
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      s.glow.material.opacity = 0.45 + (0.65 + Math.sin(t * 1.8 + i * 1.3) * 0.35) * 0.35;
    }
    this.group.rotation.y += dt * 0.01;
  }
}