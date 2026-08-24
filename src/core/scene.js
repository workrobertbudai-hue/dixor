import * as THREE from 'three';

export const SCENE_CONFIG = {
  background: 0x04070c,
  fogColor: 0x04070c,
  fogDensity: 0.028, // mélységérzet — távoli elemek elúsznak a sötétbe
};

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SCENE_CONFIG.background);
  scene.fog = new THREE.FogExp2(SCENE_CONFIG.fogColor, SCENE_CONFIG.fogDensity);
  return scene;
}