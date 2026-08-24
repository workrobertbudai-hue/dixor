import * as THREE from 'three';
import { createGlow } from '../visual/glow.js';

/**
 * FUNKCIO-NODE-ok gyartasa a modul functions listajabol.
 * V2: eros emisszio + lelegzo feny-halo, hogy messzirol is latszanak.
 */
export function createFunctionNodes(moduleDef) {
  const group = new THREE.Group();
  const nodes = [];
  const targets = [];

  const names = moduleDef.functions ?? [];
  names.forEach((name, i) => {
    const pseudoDef = {
      kind: 'function',
      id: `${moduleDef.id}:${slug(name)}`,
      label: name.toUpperCase(),
      tagline: `${moduleDef.label} · FUNCTION`,
      accent: moduleDef.accent,
      moduleId: moduleDef.id,
    };

    const c = new THREE.Color(moduleDef.accent);
    const mat = new THREE.MeshStandardMaterial({
      color: c.clone().multiplyScalar(0.4),
      metalness: 0.6,
      roughness: 0.3,
      emissive: c,
      emissiveIntensity: 0.85,
    });
    mat.userData.baseEI = 0.85;

    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.27), mat);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.46, 0.014, 6, 48),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.6 })
    );
    ring.rotation.x = Math.PI / 2.4;

    const halo = createGlow(moduleDef.accent, 1.7, 0.5);

    const hitbox = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 8, 8),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );

    const holder = new THREE.Group();
    holder.add(mesh, ring, halo, hitbox);

    const total = Math.max(names.length, 1);
    const angle = (i / total) * Math.PI * 2;
    const R = 4.8;
    holder.position.set(Math.sin(angle) * R, Math.sin(i * 2.13) * 0.45, Math.cos(angle) * R);

    hitbox.userData.nodeRef = {
      def: pseudoDef,
      group: holder,
      mesh,
      ring,
      halo,
      phase: i * 1.7,
      isHovered: false,
      pulse: 0,
      scaleCur: 1,
    };

    nodes.push(hitbox.userData.nodeRef);
    targets.push(hitbox);
    group.add(holder);
  });

  return { group, nodes, targets };
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
