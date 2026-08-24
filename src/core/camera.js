import * as THREE from 'three';

export const CAMERA_CONFIG = {
  fov: 55,
  near: 0.1,
  far: 300,
};

export function createCamera(container) {
  const aspect = container.clientWidth / Math.max(container.clientHeight, 1);
  const camera = new THREE.PerspectiveCamera(
    CAMERA_CONFIG.fov,
    aspect,
    CAMERA_CONFIG.near,
    CAMERA_CONFIG.far
  );
  camera.position.set(0, 2.2, 14);
  camera.lookAt(0, 0, 0); // a gyűrű közepére néz
  return camera;
}