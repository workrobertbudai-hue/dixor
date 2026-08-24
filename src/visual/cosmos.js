import * as THREE from 'three';
import { createGlow } from './glow.js';

/**
 * LIVING COSMOS - nap, hold, gazdag csillagmezok, asteroida-svarmok,
 * ustokos fenytarokkal es tavoli bolygok. Minden elem lassan, elettel mozog.
 */
export function createCosmos(scene) {
  const group = new THREE.Group();
  scene.add(group);

  /* ---------- NAP (meleg arany, tavol) ---------- */
  const sunGroup = new THREE.Group();
  const sunCore = new THREE.Mesh(
    new THREE.SphereGeometry(6, 40, 40),
    new THREE.MeshBasicMaterial({ color: 0xffd27a })
  );
  const sunHalo = createGlow(0xffb347, 34, 0.5);
  const sunHalo2 = createGlow(0xffe9c4, 18, 0.55);
  sunGroup.add(sunCore, sunHalo, sunHalo2);
  sunGroup.position.set(-70, 26, -95);
  group.add(sunGroup);

  /* ---------- HOLD (ezust, lassan vandorlo) ---------- */
  const moonGroup = new THREE.Group();
  const moonMat = new THREE.MeshStandardMaterial({
    color: 0xd8dee8, metalness: 0.15, roughness: 0.85,
    emissive: 0x8fa3c0, emissiveIntensity: 0.22,
  });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(3.4, 36, 36), moonMat);
  const moonHalo = createGlow(0xaebfd8, 12, 0.28);
  moonGroup.add(moon, moonHalo);
  moonGroup.position.set(62, 30, -80);
  group.add(moonGroup);

  /* ---------- CSILLAGOK V2: tobb, szines tincsekkel + villogas ----------
     Egyedi attributum: fazis + sebesseg -> shader nelkul, pontszinekkel
     es enyhe meretvaltozattal oldjuk meg a "twinkle" erzetet. */
  const starLayers = [];

  function buildStars(count, minR, maxR, sizeBase) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    const palette = [
      new THREE.Color(0xbfd9de), /* hideg-feher */
      new THREE.Color(0x9fbfff), /* kekes */
      new THREE.Color(0xffe9c9), /* meleg */
      new THREE.Color(0xd7c9ff), /* halvany ibolya */
      new THREE.Color(0xffffff),
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
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        attribute float aSpeed;
        uniform float uTime;
        varying vec3 vColor2;
        void main() {
          vColor2 = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float tw = 0.72 + 0.28 * sin(uTime * aSpeed + aPhase);
          gl_PointSize = aSize * tw * (240.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColor2;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float soft = smoothstep(0.5, 0.05, d);
          gl_FragColor = vec4(vColor2, soft);
        }
      `,
      vertexColors: true,
    });

    const pts = new THREE.Points(geo, mat);
    pts.userData.mat = mat;
    return pts;
  }

  const starsFar = buildStars(2600, 60, 190, 1.35);
  const starsNear = buildStars(1000, 30, 90, 0.85);
  starLayers.push(starsFar, starsNear);
  group.add(starsFar, starsNear);

  /* ---------- ASZTEROIDA-SVARMOK (kb percenkent atsuhanva) ---------- */
  const swarms = [];
  const rockGeo = new THREE.IcosahedronGeometry(1, 0);
  const rockMatA = new THREE.MeshStandardMaterial({
    color: 0x6b7480, metalness: 0.25, roughness: 0.9,
    emissive: 0x1a2028, emissiveIntensity: 0.5, flatShading: true,
  });
  const rockMatB = new THREE.MeshStandardMaterial({
    color: 0x57606e, metalness: 0.3, roughness: 0.95,
    emissive: 0x141a24, emissiveIntensity: 0.45, flatShading: true,
  });

  function spawnSwarm() {
    const g = new THREE.Group();

    const count = 14 + Math.floor(Math.random() * 12);
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(
        rockGeo,
        Math.random() > 0.5 ? rockMatA : rockMatB
      );
      const s = 0.25 + Math.random() * 0.85;
      m.scale.setScalar(s);
      m.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      m.userData.spin = new THREE.Vector3(
        (Math.random() - 0.5) * 1.4,
        (Math.random() - 0.5) * 1.4,
        (Math.random() - 0.5) * 1.4
      );
      g.add(m);
    }

    /* utvonal: egyik oldalrol a masikra a kamera elott */
    const side = Math.random() > 0.5 ? 1 : -1;
    const y = (Math.random() - 0.3) * 24;
    const z = -(30 + Math.random() * 50);
    g.position.set(-side * 95, y, z);

    const speed = side * (16 + Math.random() * 14); /* lathato, de kovetheto */
    g.userData = { speed };
    group.add(g);
    swarms.push(g);

    setTimeout(() => {
      const idx = swarms.indexOf(g);
      if (idx !== -1) swarms.splice(idx, 1);
      group.remove(g);
      g.traverse((o) => { if (o.geometry && o.geometry !== rockGeo) o.geometry.dispose?.(); });
    }, 14000);
  }

  function scheduleSwarm() {
    spawnSwarm();
    setTimeout(scheduleSwarm, 42000 + Math.random() * 35000);
  }
  setTimeout(scheduleSwarm, 6000);

  /* ---------- USTOKOS fenytarokkal (ritkan) ---------- */
  const comets = [];
  function spawnComet() {
    const g = new THREE.Group();
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0xcfeaff })
    );
    const headGlow = createGlow(0x9fd4ff, 6, 0.85);

    /* farok: hosszu halvanyodo csik */
    const tailLen = 26;
    const tailGeo = new THREE.ConeGeometry(0.9, tailLen, 12, 1, true);
    const tailMat = new THREE.MeshBasicMaterial({
      color: 0x86b8e8, transparent: true, opacity: 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.rotation.x = Math.PI / 2;
    tail.position.z = tailLen / 2;

    g.add(head, headGlow, tail);
    g.position.set((Math.random() > 0.5 ? 1 : -1) * 110, 20 + Math.random() * 30, -(60 + Math.random() * 40));

    const dir = new THREE.Vector3(
      (Math.random() > 0.5 ? -1 : 1) * (0.75 + Math.random() * 0.3),
      -0.18 - Math.random() * 0.2,
      0.08
    ).normalize();
    g.userData.dir = dir;

    /* a farkat az irany ellenkezojebe fordítjuk */
    g.lookAt(g.position.clone().add(dir));

    group.add(g);
    comets.push(g);

    setTimeout(() => {
      const idx = comets.indexOf(g);
      if (idx !== -1) comets.splice(idx, 1);
      group.remove(g);
      tailGeo.dispose(); tailMat.dispose();
    }, 12000);
  }
  function scheduleComet() {
    spawnComet();
    setTimeout(scheduleComet, 150000 + Math.random() * 130000);
  }
  setTimeout(scheduleComet, 45000);

  /* ---------- TAVOLI BOGYGOK (2-3, legkor-gyuruvel) ---------- */
  const planets = [];
  function buildPlanet(cfg) {
    const pg = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(cfg.r, 32, 32),
      new THREE.MeshStandardMaterial({
        color: cfg.color, metalness: 0.1, roughness: 0.8,
        emissive: cfg.color, emissiveIntensity: 0.12,
      })
    );
    const atm = new THREE.Mesh(
      new THREE.SphereGeometry(cfg.r * 1.12, 32, 32),
      new THREE.MeshBasicMaterial({
        color: cfg.atm, transparent: true, opacity: 0.14,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
      })
    );
    const halo = createGlow(cfg.color, cfg.r * 5.5, 0.2);
    pg.add(body, atm, halo);
    pg.position.copy(cfg.pos);
    group.add(pg);
    planets.push({ g: pg, speed: cfg.speed });
  }

  buildPlanet({ r: 4.2, color: 0x4f7fc4, atm: 0x7aa2ff, pos: new THREE.Vector3(-52, -20, -70), speed: 0.008 });
  buildPlanet({ r: 2.6, color: 0xc47a5f, atm: 0xffb08a, pos: new THREE.Vector3(58, -26, -88), speed: 0.011 });
  buildPlanet({ r: 1.8, color: 0x6fb99a, atm: 0x9fe8cc, pos: new THREE.Vector3(20, 44, -110), speed: 0.006 });

  /* ---------- UPDATE ---------- */
  function update(dt, t) {
    starLayers.forEach((s) => { s.userData.mat.uniforms.uTime.value = t; });
    moonGroup.position.x = 62 + Math.sin(t * 0.02) * 10;
    moonGroup.position.y = 30 + Math.cos(t * 0.017) * 5;
    planets.forEach((p) => { p.g.rotation.y += dt * p.speed * 8; });

    const camDirXZ = null; /* helytakarekossag */

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
      const c = comets[i];
      c.position.addScaledVector(c.userData.dir, dt * 34);
    }
  }

  return { group, update };
}