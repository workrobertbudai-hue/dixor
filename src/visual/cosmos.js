import * as THREE from 'three';
import { createGlow } from './glow.js';

function tex(draw) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  draw(c.getContext('2d'), 256, 128);
  return new THREE.CanvasTexture(c);
}

function sunTexture() {
  return tex((x, W, H) => {
    x.fillStyle = '#ff7a30'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 80; i++) {
      x.fillStyle = 'rgba(255,' + (110 + Math.floor(Math.random() * 90)) + ',45,' + (0.25 + Math.random() * 0.5) + ')';
      x.beginPath(); x.arc(Math.random() * W, Math.random() * H, 3 + Math.random() * 12, 0, Math.PI * 2); x.fill();
    }
    for (let i = 0; i < 12; i++) {
      x.fillStyle = 'rgba(150,38,10,' + (0.45 + Math.random() * 0.35) + ')';
      x.beginPath(); x.arc(Math.random() * W, Math.random() * H, 2 + Math.random() * 7, 0, Math.PI * 2); x.fill();
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

/**
 * LIVING COSMOS v5
 * - tuzes nap (csÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³vÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡k NÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°LKÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“L, csak lobogo korona)
 * - krateres hold
 * - villogo csillagok
 * - ASZTEROIDAK: teljes feluletrol, minden iranybol, LASSAN
 * - meteorok megmaradnak
 * - UJ: tavoli spiralgalaxis + nebula foltok
 */
export function createCosmos(scene) {
  const group = new THREE.Group();
  scene.add(group);

  /* ---------- NAP ---------- */
  const sunGroup = new THREE.Group();
  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(5, 40, 40),
    new THREE.MeshBasicMaterial({ map: sunTexture() })
  );
  const corona = createGlow(0xff6a3d, 30, 0.62);
  const coronaIn = createGlow(0xffb37a, 15, 0.68);
  sunGroup.add(sunMesh, corona, coronaIn);
  sunGroup.position.set(-42, 20, -66);
  group.add(sunGroup);

  /* ---------- HOLD ---------- */
  const moonGroup = new THREE.Group();
  const moonMat = new THREE.MeshStandardMaterial({
    map: moonTexture(), metalness: 0.1, roughness: 0.9,
    emissive: 0x93a8c8, emissiveIntensity: 0.3,
  });
  moonGroup.add(new THREE.Mesh(new THREE.SphereGeometry(2.7, 36, 36), moonMat));
  moonGroup.add(createGlow(0xaebfd8, 11, 0.38));
  moonGroup.position.set(34, 17, -56);
  group.add(moonGroup);

  /* ---------- CSILLAGOK ---------- */
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

  const starsFar = buildStars(5200, 60, 190, 1.35);
  const starsNear = buildStars(2200, 30, 90, 0.85);
  group.add(starsFar, starsNear);

  /* ---------- SPIRALGALAXIS (tavol, lassan forog) ---------- */
  function buildGalaxy() {
    const count = 8200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const arms = 3;
    const cIn = new THREE.Color(0xffd9a0);
    const cOut = new THREE.Color(0x7aa2ff);

    for (let i = 0; i < count; i++) {
      const arm = i % arms;
      const tt = Math.pow(Math.random(), 1.6);
      const r = 1.6 + tt * 110;
      const angle = arm * (Math.PI * 2 / arms) + tt * 4.4 + (Math.random() - 0.5) * 0.38;
      positions[i * 3]     = Math.cos(angle) * r + (Math.random() - 0.5) * 1.4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * (1.4 - tt * 1.1);
      positions[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 1.4;
      const c = cIn.clone().lerp(cOut, tt).multiplyScalar(1 - tt * 0.78);
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.21, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
      vertexColors: true, fog: false,
    });

    const pts = new THREE.Points(geo, mat);
    pts.position.set(0, 12, -230);
    pts.rotation.z = 0.5;
    pts.rotation.x = 0.62;

    /* magfeny */
    pts.add(createGlow(0xffd9a0, 10, 0.5));

    return pts;
  }

  const galaxy = buildGalaxy();
  group.add(galaxy);

  /* ---------- NEBULA FOLTOK ---------- */
  const nebulas = [];
  function addNebula(colorHex, scale, pos, opacity) {
    const n = createGlow(colorHex, scale, opacity);
    n.position.copy(pos);
    group.add(n);
    nebulas.push(n);
  }
  addNebula(0x1c3f66, 130, new THREE.Vector3(-70, -30, -140), 0.16);
  addNebula(0x3a2470, 110, new THREE.Vector3(85, 25, -150), 0.14);
  addNebula(0x11444a, 95,  new THREE.Vector3(30, -50, -125), 0.15);
  addNebula(0x4a1f38, 80,  new THREE.Vector3(-20, 55, -135), 0.12);

  /* ---------- ASZTEROIDAK: minden iranybol, LASSAN ---------- */
  const swarms = [];
  const rockGeo = new THREE.IcosahedronGeometry(1, 0);
  const rockMats = [
    new THREE.MeshStandardMaterial({ color: 0x77808f, metalness: 0.25, roughness: 0.9, emissive: 0x232b36, emissiveIntensity: 0.8, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x626b7a, metalness: 0.3, roughness: 0.95, emissive: 0x1b222e, emissiveIntensity: 0.7, flatShading: true }),
    new THREE.MeshStandardMaterial({ color: 0x8a7f72, metalness: 0.2, roughness: 0.85, emissive: 0x2b2620, emissiveIntensity: 0.7, flatShading: true }),
  ];

  function spawnSwarm() {
    const g = new THREE.Group();
    const roll = Math.random();
    const count = roll < 0.35 ? 6 + Math.floor(Math.random() * 8)
                : roll < 0.8 ? 14 + Math.floor(Math.random() * 12)
                : 28 + Math.floor(Math.random() * 18);
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(rockGeo, rockMats[Math.floor(Math.random() * rockMats.length)]);
      m.scale.setScalar(0.25 + Math.random() * 1.0);
      m.position.set((Math.random() - 0.5) * (8 + count * 0.4), (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 9);
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      m.userData.spin = new THREE.Vector3(
        (Math.random() - 0.5) * 1.1, (Math.random() - 0.5) * 1.1, (Math.random() - 0.5) * 1.1);
      g.add(m);
    }

    /* teljes felulet: veletlen irany a gobon, at a terkozepen */
    const dir = new THREE.Vector3().randomDirection();
    const startDist = 70;
    g.position.copy(dir).multiplyScalar(startDist);
    g.position.y += (Math.random() - 0.5) * 10;

    const targetDir = new THREE.Vector3().randomDirection();
    const target = targetDir.multiplyScalar(70);
    const vel = target.sub(g.position.clone()).normalize().multiplyScalar(5 + Math.random() * 4);
    g.userData.vel = vel;

    group.add(g); swarms.push(g);

    setTimeout(() => {
      const i = swarms.indexOf(g);
      if (i !== -1) swarms.splice(i, 1);
      group.remove(g);
    }, 24000);
  }
  function pump() {
    if (swarms.length < 3) spawnSwarm();
    setTimeout(pump, 3500 + Math.random() * 6000);
  }
  setTimeout(pump, 2500);

  /* ---------- METEOROK ---------- */
  const meteors = [];
  function spawnMeteor() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff2d8, fog: false })));
    const tg = new THREE.ConeGeometry(0.28, 13, 8, 1, true);
    const tm = new THREE.MeshBasicMaterial({
      color: 0xffe4b8, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
      side: THREE.DoubleSide, fog: false,
    });
    const tr = new THREE.Mesh(tg, tm);
    tr.rotation.x = Math.PI / 2; tr.position.z = 6.5;
    g.add(tr);
    g.position.set((Math.random() > 0.5 ? 1 : -1) * 64, 2 + Math.random() * 16, -(16 + Math.random() * 28));
    const dir = new THREE.Vector3(
      (Math.random() > 0.5 ? -1 : 1) * (0.85 + Math.random() * 0.25),
      -(0.15 + Math.random() * 0.25), 0.05).normalize();
    g.userData.dir = dir;
    g.lookAt(g.position.clone().add(dir));
    group.add(g); meteors.push(g);
    setTimeout(() => {
      const i = meteors.indexOf(g);
      if (i !== -1) meteors.splice(i, 1);
      group.remove(g);
      tg.dispose(); tm.dispose();
    }, 6000);
  }
  function scheduleMeteor() {
    spawnMeteor();
    if (Math.random() > 0.6) spawnMeteor();
    setTimeout(scheduleMeteor, 7000 + Math.random() * 6000);
  }
  setTimeout(scheduleMeteor, 12000);

  /* KODMENTESITES */
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
    corona.material.opacity = 0.55 + Math.sin(t * 6.5) * 0.07 + Math.sin(t * 11.3) * 0.05;
    coronaIn.material.opacity = 0.6 + Math.sin(t * 8.1 + 1.7) * 0.08;

    moonGroup.rotation.y += dt * 0.02;
    moonGroup.position.x = 34 + Math.sin(t * 0.03) * 7;
    moonGroup.position.y = 17 + Math.cos(t * 0.024) * 4;

    galaxy.rotation.y += dt * 0.02;
    nebulas.forEach((n, i) => {
      n.material.opacity = (i % 2 === 0 ? 0.13 : 0.11) + Math.sin(t * 0.25 + i * 1.9) * 0.04;
    });

    for (let i = swarms.length - 1; i >= 0; i--) {
      const g = swarms[i];
      g.position.addScaledVector(g.userData.vel, dt);
      g.children.forEach((m) => {
        if (m.userData.spin) {
          m.rotation.x += m.userData.spin.x * dt;
          m.rotation.y += m.userData.spin.y * dt;
          m.rotation.z += m.userData.spin.z * dt;
        }
      });
    }

    for (let i = meteors.length - 1; i >= 0; i--) {
      meteors[i].position.addScaledVector(meteors[i].userData.dir, dt * 26);
    }
  }

  return { group, update };
}