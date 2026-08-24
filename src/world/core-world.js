import * as THREE from 'three';

/**
 * CORE WORLD — ideiglenes központi objektum.
 * Később a node-factory / node-manager rendszer váltja fel,
 * a kategória-geometriák (§4) ebből a mintából nőnek ki.
 */
export class CoreWorld {
  constructor() {
    this.group = new THREE.Group();
    this.#build();
  }

  #build() {
    // Külső rács-héj — "fine lines, frames"
    this.shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3, 1),
      new THREE.MeshBasicMaterial({
        color: 0x57e6d9,
        wireframe: true,
        transparent: true,
        opacity: 0.22,
      })
    );

    // Belső mag — stabil, fémes
    this.core = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.15, 0),
      new THREE.MeshStandardMaterial({
        color: 0x0b1420,
        metalness: 0.9,
        roughness: 0.25,
        emissive: 0x123a44,
        emissiveIntensity: 0.6,
      })
    );

    // Orbit-gyűrű — finom vonal
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(4.6, 0.02, 8, 160),
      new THREE.MeshBasicMaterial({
        color: 0x7aa2ff,
        transparent: true,
        opacity: 0.35,
      })
    );
    this.ring.rotation.x = Math.PI / 2.4;

    this.group.add(this.shell, this.core, this.ring);
  }

  update(dt, elapsed) {
    this.shell.rotation.y += dt * 0.12;
    this.shell.rotation.x += dt * 0.03;
    this.core.rotation.y -= dt * 0.35;
    this.ring.rotation.z += dt * 0.08;
    this.core.position.y = Math.sin(elapsed * 0.8) * 0.08; // "lélegzés"
  }
}