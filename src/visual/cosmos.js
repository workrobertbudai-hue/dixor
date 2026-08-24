import * as THREE from 'three';
import { createGlow } from './glow.js';

/**
 * LIVING COSMOS v2 - kodmentes (fog:false), ezert MINDEN elem lathato.
 * Nap, Hold, villogo csillagok, asteroida-svarmok, ustokosok, bolygok.
 */
export function createCosmos(scene) {
  const group = new THREE.Group();
  scene.add(group);

  /* ---------- NAP ---------- */
  const sunGroup = new THREE.Group();
  sunGroup.add(new THREE.Mesh(
    new THREE.SphereGeometry(5, 36, 36),
    new THREE.MeshBasicMaterial({ color: 0xffd27a })
  ));
  sunGroup.add(createGlow(0xffb347, 30, 0.6));
  sunGroup.add(createGlow(0xffe9c4, 15, 0.65));
  sunGroup.position.set(-42, 20, -66);
  group.add(sunGroup);

  /* ---------- HOLD ---------- */
  const moonGroup = new THREE.Group();
  const moonMat = new THREE.MeshStandardMaterial({
    color: 0xdde4ee, metalness: 0.15, roughness: 0.85,
    emissive: 0x93a8c8, emissiveIntensity: 0.35,
  });
  moonGroup.add(new THREE.Mesh(new THREE.SphereGeometry(2.7, 32, 32), moonMat));
  moonGroup.add(createGlow(0xaebfd8, 11, 0.4));
  moonGroup.position.set(34, 17, -56);
  group.add(moonGroup);

  /* ---------- CSILLAGOK: villogoak, szinesek ---------- */
  function buildStars(count, minR, maxR, sizeBase) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    const palette = [
      new THREE.Color(0xbfd9de),
      new THREE.Color(0x9fbfff),
      new THREE.Color(0xffe9c9),
      new THREE.Color(0xd7c9ff),
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

    return new THREE.Points(geo, mat);
  }

  const starsFar = buildStars(2600, 60, 190, 1.35);
  const starsNear = buildStars(1000, 30, 90, 0.85);
  group.add(starsFar, starsNear);

  /* ---------- ASZTEROIDAK ---------- */
  const swarms = [];
  const rockGeo = new THREE.IcosahedronGeometry(1, 0);
  const rockMatA = new THREE.MeshStandardMaterial({
    color: 0x77808f, metalness: 0.25, roughness: 0.9,
    emissive: 0x232b36, emissiveIntensity: 0.8, flatShading: true,
  });
  const rockMatB = new THREE.MeshStandardMaterial({
    color: 0x626b7a, metalness: 0.3, roughness: 0.95,
    emissive: 0x1b222e, emissiveIntensity: 0.7, flatShading: true,
  });

  function spawnSwarm() {
    const g = new THREE.Group();
    const count = 16 + Math.floor(Math.random() * 12);
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(rockGeo, Math.random() > 0.5 ? rockMatA : rockMatB);
      m.scale.setScalar(0.3 + Math.random() * 0.9);
      m.position.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 8);
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      m.userData.spin = new THREE.Vector3(
        (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6);
      g.add(m);
    }
    const side = Math.random() > 0.5 ? 1 : -1;
    g.position.set(-side * 62, (Math.random() - 0.35) * 20, -(22 + Math.random() * 36));
    g.userData = { speed: side * (18 + Math.random() * 14) };
    group.add(g);
    swarms.push(g);

    setTimeout(() => {
      const i = swarms.indexOf(g);
      if (i !== -1) swarms.splice(i, 1);
      group.remove(g);
    }, 13000);
  }
  function scheduleSwarm() {
    spawnSwarm();
    setTimeout(scheduleSwarm, 38000 + Math.random() * 30000);
  }
  setTimeout(scheduleSwarm, 5000);

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
    tail.rotation.x = Math.PI / 2;
    tail.position.z = tailLen / 2;
    g.add(tail);

    g.position.set((Math.random() > 0.5 ? 1 : -1) * 78, 16 + Math.random() * 22, -(38 + Math.random() * 30));

    const dir = new THREE.Vector3(
      (Math.random() > 0.5 ? -1 : 1) * (0.8 + Math.random() * 0.3),
      -0.2 - Math.random() * 0.2, 0.06).normalize();
    g.userData.dir = dir;
    g.lookAt(g.position.clone().add(dir));

    group.add(g);
    comets.push(g);
    setTimeout(() => {
      const i = comets.indexOf(g);
      if (i !== -1) comets.splice(i, 1);
      group.remove(g);
    }, 11000);
  }
  function scheduleComet() {
    spawnComet();
    setTimeout(scheduleComet, 120000 + Math.random() * 90000);
  }
  setTimeout(scheduleComet, 30000);

  /* ---------- BOGYGOK ---------- */
  const planets = [];
  function buildPlanet(r, color, atmColor, pos, spin) {
    const pg = new THREE.Group();
    pg.add(new THREE.Mesh(new THREE.SphereGeometry(r, 32, 32),
      new THREE.MeshStandardMaterial({
        color, metalness: 0.1, roughness: 0.8,
        emissive: color, emissiveIntensity: 0.25,
      })));
    pg.add(new THREE.Mesh(new THREE.SphereGeometry(r * 1.14, 32, 32),
      new THREE.MeshBasicMaterial({
        color: atmColor, transparent: true, opacity: 0.18,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
      })));
    pg.add(createGlow(color, r * 6, 0.3));
    pg.position.copy(pos);
    group.add(pg);
    planets.push({ g: pg, spin });
  }

  buildPlanet(3.4, 0x5a8ad0, 0x7aa2ff, new THREE.Vector3(-30, -11, -46), 0.09);
  buildPlanet(2.2, 0xd0805f, 0xffb08a, new THREE.Vector3(37, -15, -56), 0.12);
  buildPlanet(1.6, 0x74c49e, 0x9fe8cc, new THREE.Vector3(12, 26, -68), 0.07);

  /* KODMENTESITES: minden anyag figyelmen kivul hagyja a ter kodjet */
  group.traverse((o) => {
    if (o.material) {
      const list = Array.isArray(o.material) ? o.material : [o.material];
      list.forEach((m) => { m.fog = false; });
    }
  });

  /* ---------- UPDATE ---------- */
  function update(dt, t) {
    [starsFar, starsNear].forEach((s) => { s.material.uniforms.uTime.value = t; });

    moonGroup.position.x = 34 + Math.sin(t * 0.03) * 7;
    moonGroup.position.y = 17 + Math.cos(t * 0.024) * 4;

    planets.forEach((p) => { p.g.rotation.y += dt * p.spin; });

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