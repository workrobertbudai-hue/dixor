import * as THREE from 'three';

/**
 * Kontrollált fénykörnyezet:
 * - halvány hemiszféra-alapfény
 * - irányított kulcsfény
 * - két színes akcentpont (teal + blue) a DIXOR identitáshoz
 */
export function createLights(scene) {
  const hemisphere = new THREE.HemisphereLight(0x8fb8c9, 0x0a0e14, 0.7);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(6, 8, 4);

  const accentTeal = new THREE.PointLight(0x57e6d9, 60, 40, 2);
  accentTeal.position.set(-6, 3, 5);

  const accentBlue = new THREE.PointLight(0x7aa2ff, 50, 40, 2);
  accentBlue.position.set(6, -2, -6);

  scene.add(hemisphere, key, accentTeal, accentBlue);

  return { hemisphere, key, accentTeal, accentBlue };
}