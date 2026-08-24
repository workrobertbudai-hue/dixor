import * as THREE from 'three';

const ENVIRONMENT_CONFIG = {
  stars: { count: 1800, minRadius: 45, maxRadius: 120, size: 0.35 },
  dust: { count: 900, minRadius: 8, maxRadius: 32, size: 0.06 },
};

function buildLayer({ count, minRadius, maxRadius, size }, color, opacity) {
  const positions = new Float32Array(count * 3);
  const pos = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    pos.randomDirection()
       .multiplyScalar(THREE.MathUtils.lerp(minRadius, maxRadius, Math.cbrt(Math.random())));
    positions.set([pos.x, pos.y, pos.z], i * 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color,
    size,
    sizeAttenuation: true,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false, // a csillagtér ne ússzon el a ködben
  });

  return new THREE.Points(geometry, material);
}

export function createEnvironment() {
  const group = new THREE.Group();

  const stars = buildLayer(ENVIRONMENT_CONFIG.stars, 0xbfd9de, 0.85);
  const dust = buildLayer(ENVIRONMENT_CONFIG.dust, 0x57e6d9, 0.35);
  group.add(stars, dust);

  return {
    group,
    update(dt) {
      stars.rotation.y += dt * 0.004;
      dust.rotation.y -= dt * 0.010; // ellentétes irány → parallax mélység
    },
  };
}