import * as THREE from 'three';

/** Egyszer használt, cache-elt ragyogás-textúra (radial gradient). */
let glowTex = null;

function getGlowTexture() {
  if (glowTex) return glowTex;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  glowTex = new THREE.CanvasTexture(canvas);
  return glowTex;
}

/** Lágy fény-sprite adott színnel és mérettel (additive blending). */
export function createGlow(colorHex, scale = 3, opacity = 0.5) {
  const mat = new THREE.SpriteMaterial({
    map: getGlowTexture(),
    color: colorHex,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.setScalar(scale);
  return sprite;
}