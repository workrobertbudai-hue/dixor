import * as THREE from 'three';

/** Egyszerű raycast-szolgáltatás: kamera + célok + egér → első találat. */
export class RaycasterService {
  constructor() {
    this.ray = new THREE.Raycaster();
  }

  pick(camera, targets, ndc) {
    if (ndc.x < -1.5) return null; // egér a képernyőn kívül
    this.ray.setFromCamera(ndc, camera);
    return this.ray.intersectObjects(targets, false)[0] ?? null;
  }
}