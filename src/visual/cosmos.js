import * as THREE from 'three';
import { createGlow } from './glow.js';

/* ---- canvas textura segedek ---- */

function tex(draw) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  draw(c.getContext('2d'), 256, 128);
  const t = new THREE.CanvasTexture(c);
  return t;
}

function sunTexture() {
  return tex((x, W, H) => {
    x.fillStyle = '#ffc95e'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      x.fillStyle = 'rgba(255,' + (170 + Math.floor(Math.random() * 70)) + ',110,' + (0.2 + Math.random() * 0.5) + ')';
      x.beginPath(); x.arc(Math.random() * W, Math.random() * H, 3 + Math.random() * 12, 0, Math.PI * 2); x.fill();
    }
    for (let i = 0; i < 8; i++) {
      x.fillStyle = 'rgba(205,92,25,0.6)';
      x.beginPath(); x.arc(Math.random() * W, Math.random() * H, 2 + Math.random() * 6, 0, Math.PI * 2); x.fill();
    }
  });
}

function moonTexture() {
  return tex((x, W, H) => {
    x.fillStyle = '#cfd6e2'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      const r = 2 + Math.random() * 9;
      const px = Math.random() * W, py = Math.random() * H;
      x.fillStyle = 'rgba(150,160,178,0.5)';
      x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(235,240,248,0.45)';
      x.beginPath(); x.arc(px - r * 0.25, py - r * 0.25, r * 0.75, 0, Math.PI * 2); x.fill();
    }
  });
}

function bandedTexture(base, band1, band2) {
  return tex((x, W, H) => {
    x.fillStyle = base; x.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 6) {
      x.fillStyle = (Math.random() > 0.5 ? band1 : band2);
      x.globalAlpha = 0.12 + Math.random() * 0.25;
      x.fillRect(0, y, W, 3 + Math.random() * 7);
    }
    x.globalAlpha = 1;
    for (let i = 0; i < 12; i++) {
      x.fillStyle = 'rgba(255,255,255,0.08)';
      x.beginPath(); x.arc(Math.random() * W, Math.random() * H, 3 + Math.random() * 8, 0, Math.PI * 2); x.fill();
    }
  });
}

function mottledTexture(base, spot) {
  return tex((x, W, H) => {
    x.fillStyle = base; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 55; i++) {
      x.fillStyle = spot;
      x.globalAlpha = 0.1 + Math.random() * 0.35;
      x.beginPath(); x.arc(Math.random() * W, Math.random() * H, 2 + Math.random() * 11, 0, Math.PI * 2); x.fill();
    }
    x.globalAlpha = 1;
  });
}

/**
 * LIVING COSMOS v3 - eletparzsos egitestek (texturak, forgas, gyuru),
 * FOLYAMATOS valtozo sursusegu asteroida-aramlas, ustokosok.
 */
export function createCosmos(scene) {
  const group = new THREE.Group();
  scene.add(group);

  /* ---------- NAP: elo felszin, lobogo korona ---------- */
  const sunGroup = new THREE.Group();
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(5, 40, 40),
    new THREE.MeshBasicMaterial({ map: sunTexture() })
  );
  const corona = createGlow(0xffb347, 32, 0.62);
  const coronaIn = createGlow(0xffe9c4, 16, 0.7);
  sunGroup.add(sunMesh, corona, coronaIn);
  sunGroup.position.set(-42, 20, -66);
  group.add(sunGroup);

  /* ---------- HOLD: kratekkel, lassu fordulaval ---------- */
  const moonGroup = new THREE.Group();
  const moonMat = new THREE.MeshStandardMaterial({
    map: moonTexture(), metalness: 0.1, roughness: 0.9,
    emissive: 0x93a8c8, emissiveIntensity: 0.3,
  });
  moonGroup.add(new THREE.Mesh(new THREE.SphereGeometry(2.7, 36, 36), moonMat));
  moonGroup.add(createGlow(0xaebfd8, 11, 0.38));
  moonGroup.position.set(34, 17, -56);
  group.add(moonGroup);

  /* ---------- CSILLAGOK (valtozatlanul villogoak) ---------- */
  function buildStars(count, minR, maxR, sizeBase) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const palette = [
      new THREE.Color(0xbfd9de), new THREE.Color(0x9fbfff),
      new THREE.Color(0xffe9c9), new THREE.Color(0xd7c9ff), new THREE.Color(0xffffff),
    ];
    const v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      v.randomDirection().multiplyScalar(minR + Math.pow(Math.random(), 0.7) * (maxR - minR));
      positions[i * 3] = v.x; positions[i * 3 + 1] = v.y; positions[i * 3 + 2] = v.z;
      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      sizes[i] = sizeBase * (0.5 + Math.random() * 1.1);
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 1.5 + Math.random() * 3.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geo.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float aSize; attribute float aPhase; attribute float aSpeed;
        uniform float uTime; varying vec3 vColor2;
        void main() {
          vColor2 = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float tw = 0.72 + 0.28 * sin(uTime * aSpeed + aPhase);
          gl_PointSize = aSize * tw * (240.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vColor2;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          gl_FragColor = vec4(vColor2, smoothstep(0.5, 0.05, d));
        }`,
      vertexColors: true,
    });
    return new THREE.Points(geo, mat);
  }

  const starsFar = buildStars(2600, 60, 190, 1.35);
  const starsNear = buildStars(1000, 30, 90, 0.85);
  group.add(starsFar, starsNear);

  /* ---------- ASZTEROIDAK: FOLYAMATOS, VALTOZO SURUSUEG ---------- */
  const swarms = [];
  const rockGeo = new THREE.IcosahedronGeometry(1, 0);
  const rockMats = [
    new THREE.MeshStandardMaterial({ color: 0x77808f, metalness: 0.25, roughness: 0.9, emissive: 0x232b36, emissiveIntensity: 0.8, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x626b7a, metalness: 0.3, roughness: 0.95, emissive: 0x1b222e, emissiveIntensity: 0.7, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x8a7f72, metalness: 0.2, roughness: 0.85, emissive: 0x2b2620, emissiveIntensity: 0.7, flatShading: true }),
  ];

  function spawnSwarm() {
    const g = new THREE.Group();

    /* sursuseg: hol keves, hol nagyon sok */
    const roll = Math.random();
    const count = roll < 0.35 ? 6 + Math.floor(Math.random() * 8)
                : roll < 0.8 ? 14 + Math.floor(Math.random() * 12)
                : 28 + Math.floor(Math.random() * 18);

    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(rockGeo, rockMats[Math.floor(Math.random() * rockMats.length)]);
      m.scale.setScalar(0.25 + Math.random() * 1.0);
      m.position.set((Math.random() - 0.5) * (8 + count * 0.4), (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 8);
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      m.userData.spin = new THREE.Vector3(
        (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6);
      g.add(m);
    }

    const side = Math.random() > 0.5 ? 1 : -1;
    g.position.set(-side * 62, (Math.random() - 0.35) * 20, -(22 + Math.random() * 36));
    g.userData = { speed: side * (14 + Math.random() * 16) };
    group.add(g);
    swarms.push(g);

    setTimeout(() => {
      const i = swarms.indexOf(g);
      if (i !== -1) swarms.splice(i, 1);
      group.remove(g);
    }, 13000);
  }

  /* folyamatos aramlas: ha kevesebb mint 3 raj van indul, ujat indit */
  function pump() {
    if (swarms.length < 3) spawnSwarm();
    setTimeout(pump, 3000 + Math.random() * 6000);
  }
  setTimeout(pump, 2500);

  /* ---------- USTOKOS ---------- */
  const comets = [];
  function spawnComet() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0xd6ecff })));
    g.add(createGlow(0x9fd4ff, 7, 0.95));
    const tailLen = 30;
    const tailGeo = new THREE.ConeGeometry(1.0, tailLen, 12, 1, true);
    const tailMat = new THREE.MeshBasicMaterial({
      color: 0x9cc8f2, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.rotation.x = Math.PI / 2; tail.position.z = tailLen / 2;
    g.add(tail);
    g.position.set((Math.random() > 0.5 ? 1 : -1) * 78, 16 + Math.random() * 22, -(38 + Math.random() * 30));
    const dir = new THREE.Vector3(
      (Math.random() > 0.5 ? -1 : 1) * (0.8 + Math.random() * 0.3),
      -0.2 - Math.random() * 0.2, 0.06).normalize();
    g.userData.dir = dir;
    g.lookAt(g.position.clone().add(dir));
    group.add(g); comets.push(g);
    setTimeout(() => {
      const i = comets.indexOf(g);
      if (i !== -1) comets.splice(i, 1);
      group.remove(g);
    }, 11000);
  }
  function scheduleComet() {
    spawnComet();
    setTimeout(scheduleComet, 110000 + Math.random() * 80000);
  }
  setTimeout(scheduleComet, 26000);

  /* ---------- BOGYGOK: texturakkal, gyuruvel, forgassal ---------- */
  const planets = [];

  /* kep-bolygo savokkal + Szaturnusz-gyuruvel */
  const p1 = new THREE.Group();
  const p1body = new THREE.Mesh(new THREE.SphereGeometry(3.4, 40, 40),
    new THREE.MeshStandardMaterial({
      map: bandedTexture('#4a76b8', '#7aa2ff', '#31598f'),
      metalness: 0.08, roughness: 0.85,
      emissive: 0x3a5f9e, emissiveIntensity: 0.22,
    }));
  const ringGeo = new THREE.RingGeometry(4.6, 6.4, 80);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x9db8e8, transparent: true, opacity: 0.4,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const p1ring = new THREE.Mesh(ringGeo, ringMat);
  p1ring.rotation.x = Math.PI / 2.35;
  p1.add(p1body, p1ring, createGlow(0x7aa2ff, 20, 0.3));
  p1.position.set(-30, -11, -46);
  p1.userData.spinBody = p1body;
  group.add(p1); planets.push(p1);

  /* rozsdas bolygo foltokkal */
  const p2 = new THREE.Group();
  const p2body = new THREE.Mesh(new THREE.SphereGeometry(2.2, 36, 36),
    new THREE.MeshStandardMaterial({
      map: mottledTexture('#c47a52', '#8a4a30'),
      metalness: 0.08, roughness: 0.88,
      emissive: 0x9a5a3a, emissiveIntensity: 0.2,
    }));
  p2.add(p2body, createGlow(0xffb08a, 13, 0.28));
  p2.position.set(37, -15, -56);
  p2.userData.spinBody = p2body;
  group.add(p2); planets.push(p2);

  /* zoldes bolygo orvenyekkel */
  const p3 = new THREE.Group();
  const p3body = new THREE.Mesh(new THREE.SphereGeometry(1.6, 32, 32),
    new THREE.MeshStandardMaterial({
      map: mottledTexture('#5aa884', '#2e7a58'),
      metalness: 0.08, roughness: 0.86,
      emissive: 0x3f9a74, emissiveIntensity: 0.22,
    }));
  p3.add(p3body, createGlow(0x9fe8cc, 9, 0.3));
  p3.position.set(12, 26, -68);
  p3.userData.spinBody = p3body;
  group.add(p3); planets.push(p3);

  /* KODMENTESITES minden elemre */
  group.traverse((o) => {
    if (o.material) {
      const list = Array.isArray(o.material) ? o.material : [o.material];
      list.forEach((m) => { m.fog = false; });
    }
  });

  /* ---------- UPDATE ---------- */
  function update(dt, t) {
    starsFar.material.uniforms.uTime.value = t;
    starsNear.material.uniforms.uTime.value = t;

    sunMesh.rotation.y += dt * 0.03;

    moonGroup.rotation.y += dt * 0.02;
    moonGroup.position.x = 34 + Math.sin(t * 0.03) * 7;
    moonGroup.position.y = 17 + Math.cos(t * 0.024) * 4;

    planets.forEach((p) => {
      if (p.userData.spinBody) {
        p.userData.spinBody.rotation.y += dt * 0.12;
      }
    });

    for (let i = swarms.length - 1; i >= 0; i--) {
      const g = swarms[i];
      g.position.x += g.userData.speed * dt;
      g.children.forEach((m) => {
        if (m.userData.spin) {
          m.rotation.x += m.userData.spin.x * dt;
          m.rotation.y += m.userData.spin.y * dt;
          m.rotation.z += m.userData.spin.z * dt;
        }
      });
    }

    for (let i = comets.length - 1; i >= 0; i--) {
      comets[i].position.addScaledVector(comets[i].userData.dir, dt * 30);
    }
  }

  return { group, update };
}