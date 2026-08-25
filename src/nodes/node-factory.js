import * as THREE from 'three';
import { createGlow } from '../visual/glow.js';

/* anyag-segedek */

function stdMat(accent, { metalness = 0.85, roughness = 0.3, ei = 0.3 } = {}) {
  const c = new THREE.Color(accent);
  const m = new THREE.MeshStandardMaterial({
    color: c.clone().multiplyScalar(0.22),
    metalness,
    roughness,
    emissive: c,
    emissiveIntensity: ei,
  });
  m.userData.baseEI = ei;
  return m;
}

function lineMat(accent, opacity = 0.5) {
  return new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity });
}

function edges(geo, accent, opacity = 0.5) {
  return new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat(accent, opacity));
}

function rim(accent, r, tube, opacity) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(r, tube, 8, 80),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity })
  );
}

/* WORK - giroszkop v2 */

function buildGyroFrame(A) {
  const g = new THREE.Group();
  const reactive = [];

  const heartGlow = createGlow(A, 1.5, 0.75);
  g.add(heartGlow);

  const coreMat = stdMat(A, { ei: 0.95 });
  reactive.push(coreMat);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), coreMat);
  g.add(core);

  const frameDefs = [
    { size: 1.62, speed: 0.50 },
    { size: 1.24, speed: -0.68 },
    { size: 0.88, speed: 0.88 },
  ];
  const frames = [];

  frameDefs.forEach((fd, i) => {
    const m = stdMat(A, { ei: 0.25 });
    reactive.push(m);

    const frame = new THREE.Group();
    const half = fd.size / 2;
    const t = 0.05;

    const geoH = new THREE.BoxGeometry(fd.size, t, t);
    const geoV = new THREE.BoxGeometry(t, fd.size, t);

    [half, -half].forEach((y) => { const b = new THREE.Mesh(geoH, m); b.position.y = y; frame.add(b); });
    [half, -half].forEach((x) => { const b = new THREE.Mesh(geoV, m); b.position.x = x; frame.add(b); });

    const edgeMat = lineMat(A, 0.85);
    [half, -half].forEach((y) => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geoH), edgeMat); e.position.y = y; frame.add(e); });
    [half, -half].forEach((x) => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geoV), edgeMat); e.position.x = x; frame.add(e); });

    const cornerGeo = new THREE.SphereGeometry(t * 1.4, 10, 10);
    [[half, half], [-half, half], [half, -half], [-half, -half]].forEach(([x, y]) => {
      const c = new THREE.Mesh(cornerGeo, m);
      c.position.set(x, y, 0);
      frame.add(c);
      const cg = createGlow(A, 0.36, 0.8);
      cg.position.set(x, y, 0);
      frame.add(cg);
    });

    frame.userData = { speed: fd.speed };
    if (i === 1) frame.rotation.x = Math.PI / 2;
    if (i === 2) frame.rotation.y = Math.PI / 2;
    frames.push(frame);
    g.add(frame);
  });

  const haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.08, 0.012, 8, 96),
    new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: 0.5 })
  );
  haloRing.rotation.x = Math.PI / 2;
  g.add(haloRing);

  return {
    group: g, reactive, spin: 0.14,
    customUpdate: (dt, t) => {
      frames[0].rotation.z += dt * frames[0].userData.speed;
      frames[1].rotation.z += dt * frames[1].userData.speed;
      frames[2].rotation.x += dt * frames[2].userData.speed;
      haloRing.rotation.z -= dt * 0.4;
      heartGlow.material.opacity = 0.62 + Math.sin(t * 2.1) * 0.18;
      core.rotation.y += dt * 0.8;
      core.rotation.x += dt * 0.5;
    },
  };
}

/* LEARN v2 - lebego uveglemezek fenycsatornaval es keringo tudaspontokkal */

function buildLayered(A) {
  const g = new THREE.Group();
  const reactive = [];
  const plates = [];

  const defs = [
    { y: -0.52, r: 1.02, ei: 0.28, op: 0.34, s: 0.30 },
    { y: 0.00,  r: 0.80, ei: 0.42, op: 0.46, s: -0.42 },
    { y: 0.52,  r: 0.58, ei: 0.60, op: 0.60, s: 0.52 },
  ];

  defs.forEach((d) => {
    const mat = stdMat(A, { metalness: 0.55, roughness: 0.32, ei: d.ei });
    mat.transparent = true;
    mat.opacity = d.op;
    reactive.push(mat);

    const plate = new THREE.Mesh(new THREE.CylinderGeometry(d.r, d.r, 0.045, 56), mat);
    plate.position.y = d.y;
    g.add(plate);

    const r = rim(A, d.r + 0.02, 0.012, 0.65);
    r.rotation.x = Math.PI / 2;
    r.position.y = d.y;
    g.add(r);

    plates.push({ mesh: plate, s: d.s });
  });

  /* fenycsatorna */
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 1.5, 10),
    new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  g.add(beam);

  /* keringo tudaspontok */
  const orbs = [];
  for (let i = 0; i < 3; i++) {
    const om = stdMat(A, { ei: 0.95 });
    reactive.push(om);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), om);
    orb.userData = { ph: i * 2.1, rr: 1.05 + i * 0.16, sp: 0.9 - i * 0.18 };
    orbs.push(orb);
    g.add(orb);
  }

  const topGlow = createGlow(A, 1.1, 0.5);
  topGlow.position.y = 0.52;
  g.add(topGlow);

  return {
    group: g, reactive, spin: 0.26,
    customUpdate: (dt, t) => {
      plates.forEach((p) => { p.mesh.rotation.y += dt * p.s; });
      orbs.forEach((o) => {
        const a = t * o.userData.sp + o.userData.ph;
        o.position.set(Math.cos(a) * o.userData.rr, 0.52 + Math.sin(t * 1.4 + o.userData.ph) * 0.1, Math.sin(a) * o.userData.rr);
      });
      topGlow.material.opacity = 0.4 + Math.sin(t * 1.8) * 0.12;
    },
  };
}

/* DISCOVER */

function buildBranching(A) {
  const g = new THREE.Group();
  const reactive = [];
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), stdMat(A, { ei: 0.8 }));
  g.add(center);
  reactive.push(center.material);

  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 6; i++) {
    const y = 1 - (2 * (i + 0.5)) / 6;
    const r = Math.sqrt(1 - y * y);
    const phi = i * 2.399;
    const dir = new THREE.Vector3(r * Math.cos(phi), y, r * Math.sin(phi));
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.95, 6), stdMat(A, { ei: 0.25 }));
    branch.quaternion.setFromUnitVectors(up, dir);
    branch.position.copy(dir).multiplyScalar(0.5);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 14), stdMat(A, { ei: 0.7 }));
    tip.position.copy(dir).multiplyScalar(1.04);
    reactive.push(branch.material, tip.material);
    g.add(branch, tip);
  }
  return { group: g, reactive, spin: 0.2 };
}

/* LIFE */

function buildOrbitRing(A) {
  const g = new THREE.Group();
  const ringA = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.03, 8, 72),
    new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: 0.55 })
  );
  const ringB = ringA.clone();
  ringB.material = ringA.material.clone();
  ringB.material.opacity = 0.25;
  ringB.rotation.x = Math.PI / 3;
  const planet = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 18), stdMat(A, { ei: 0.85 }));
  g.add(ringA, ringB, planet);
  return {
    group: g, reactive: [planet.material], spin: 0.42,
    customUpdate: (dt, t) => {
      const a = t * 1.25;
      planet.position.set(Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95);
    },
  };
}

/* WELLBEING */

function buildConcentricSoft(A) {
  const g = new THREE.Group();
  const reactive = [];
  const shells = [
    { r: 0.52, o: 0.24 },
    { r: 0.78, o: 0.16 },
    { r: 1.04, o: 0.10 },
  ];
  for (const s of shells) {
    const m = stdMat(A, { metalness: 0.1, roughness: 0.6, ei: 0.25 });
    m.transparent = true; m.opacity = s.o; m.depthWrite = false;
    reactive.push(m);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(s.r, 32, 32), m));
  }
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.17, 18, 18), stdMat(A, { ei: 0.95 }));
  reactive.push(heart.material);
  g.add(heart);
  const mid = g.children[1];
  return {
    group: g, reactive, spin: 0.12,
    customUpdate: (dt) => { mid.rotation.y -= dt * 0.25; },
  };
}

/* CREATE */

function buildAssembling(A) {
  const g = new THREE.Group();
  const reactive = [];
  const corners = [
    [1, 1, 1], [1, 1, -1], [1, -1, 1], [-1, 1, 1],
    [1, -1, -1], [-1, -1, 1],
  ];
  const pieces = [];
  corners.forEach((c, i) => {
    const dir = new THREE.Vector3(...c).normalize();
    const piece = new THREE.Mesh(new THREE.TetrahedronGeometry(0.26), stdMat(A, { ei: 0.35 }));
    piece.userData = { dir, phase: i * 1.1 };
    reactive.push(piece.material);
    pieces.push(piece);
    g.add(piece);
  });
  const heart = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), stdMat(A, { ei: 0.8 }));
  reactive.push(heart.material);
  g.add(heart);
  return {
    group: g, reactive, spin: 0.34,
    customUpdate: (dt, t) => {
      for (const p of pieces) {
        const { dir, phase } = p.userData;
        const d = 0.74 + Math.sin(t * 1.5 + phase) * 0.08;
        p.position.copy(dir).multiplyScalar(d);
        p.rotation.x += dt * 0.8;
        p.rotation.y += dt * 0.6;
      }
    },
  };
}

/* EXPLORE */

function buildScatterField(A) {
  const g = new THREE.Group();
  const COUNT = 130;
  const positions = new Float32Array(COUNT * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < COUNT; i++) {
    v.randomDirection().multiplyScalar(Math.cbrt(Math.random()) * 0.95);
    positions.set([v.x, v.y, v.z], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({
    color: A, size: 0.05, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  const cage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.05, 0),
    new THREE.MeshBasicMaterial({ color: A, wireframe: true, transparent: true, opacity: 0.16 })
  );
  g.add(points, cage);
  return { group: g, reactive: [], spin: 0.16 };
}

/* ANALYZE v2 - adat-kristaly: kulso hasab + belso forgo varazs + szantalo scan-gyuru */

function buildFacetedCrystal(A) {
  const g = new THREE.Group();
  const reactive = [];

  const geo = new THREE.OctahedronGeometry(0.92, 0);
  geo.scale(1, 1.38, 1);

  const mat = stdMat(A, { ei: 0.34 });
  mat.flatShading = true;
  mat.transparent = true;
  mat.opacity = 0.62;
  mat.depthWrite = false;
  reactive.push(mat);
  const crystal = new THREE.Mesh(geo, mat);
  g.add(crystal, edges(geo, A, 0.85));

  const innerGeo = new THREE.OctahedronGeometry(0.5, 1);
  const inner = new THREE.Mesh(
    innerGeo,
    new THREE.MeshBasicMaterial({ color: A, wireframe: true, transparent: true, opacity: 0.55 })
  );
  g.add(inner);

  const scan = new THREE.Mesh(
    new THREE.TorusGeometry(0.86, 0.014, 8, 64),
    new THREE.MeshBasicMaterial({ color: A, transparent: true, opacity: 0.7 })
  );
  scan.rotation.x = Math.PI / 2;
  g.add(scan);

  const scanGlow = createGlow(A, 0.7, 0.7);
  g.add(scanGlow);

  const base = rim(A, 0.78, 0.012, 0.3);
  base.rotation.x = Math.PI / 2;
  base.position.y = -1.05;
  g.add(base);

  return {
    group: g, reactive, spin: 0.3,
    customUpdate: (dt, t) => {
      crystal.rotation.y += dt * 0.32;
      inner.rotation.y -= dt * 1.1;
      inner.rotation.x += dt * 0.5;
      const sy = Math.sin(t * 1.1) * 0.85;
      scan.position.y = sy;
      scanGlow.position.y = sy;
      scanGlow.material.opacity = 0.5 + Math.sin(t * 2.2) * 0.2;
    },
  };
}

/* PERSONAL v2 - belso mag + ellenforo drothalo + ket dolt paylgyuru muholddal */

function buildCoreSphere(A) {
  const g = new THREE.Group();
  const reactive = [];

  const innerMat = stdMat(A, { metalness: 0.95, roughness: 0.15, ei: 0.4 });
  reactive.push(innerMat);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(0.4, 36, 36), innerMat);
  g.add(inner);

  const wire = new THREE.Mesh(
    new THREE.SphereGeometry(0.58, 24, 16),
    new THREE.MeshBasicMaterial({ color: A, wireframe: true, transparent: true, opacity: 0.22 })
  );
  g.add(wire);

  const shellMat = stdMat(A, { metalness: 0.3, roughness: 0.5, ei: 0.1 });
  shellMat.transparent = true;
  shellMat.opacity = 0.13;
  shellMat.depthWrite = false;
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.74, 40, 40), shellMat);
  g.add(shell);

  const glow = createGlow(A, 2.4, 0.35);
  g.add(glow);

  const ringA = rim(A, 0.98, 0.013, 0.55);
  ringA.rotation.x = Math.PI / 2.6;
  g.add(ringA);

  const ringB = rim(A, 1.08, 0.01, 0.3);
  ringB.rotation.x = Math.PI / 1.7;
  ringB.rotation.y = Math.PI / 5;
  g.add(ringB);

  const satMat = stdMat(A, { ei: 0.95 });
  reactive.push(satMat);
  const sat = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), satMat);
  g.add(sat);

  return {
    group: g, reactive, spin: 0.18,
    customUpdate: (dt, t) => {
      wire.rotation.y -= dt * 0.5;
      wire.rotation.x += dt * 0.18;
      shell.rotation.y += dt * 0.08;
      const a = t * 0.9;
      const ca = Math.cos(a), sa = Math.sin(a);
      const tilt = Math.PI / 2.6;
      sat.position.set(ca * 0.98, sa * Math.sin(tilt) * 0.98, sa * Math.cos(tilt) * 0.98);
      glow.material.opacity = 0.28 + Math.sin(t * 1.6) * 0.09;
    },
  };
}


/* TIMELINE - temporal orbit / idofolyam */

function buildTemporalOrbit(A) {
  const g = new THREE.Group();
  const reactive = [];

  const coreMat = stdMat(A, {
    metalness: 0.92,
    roughness: 0.18,
    ei: 0.95,
  });
  reactive.push(coreMat);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.22, 1),
    coreMat
  );
  g.add(core);

  const coreGlow = createGlow(A, 1.15, 0.75);
  g.add(coreGlow);

  const orbitDefs = [
    { rx: 0.72, rz: 1.12, y: 0.00, rot: 0.35, speed: 0.32, opacity: 0.62 },
    { rx: 0.94, rz: 0.68, y: 0.04, rot: -0.58, speed: -0.24, opacity: 0.48 },
    { rx: 1.12, rz: 0.86, y: -0.05, rot: 1.05, speed: 0.18, opacity: 0.38 },
  ];

  const tracks = [];
  const events = [];

  orbitDefs.forEach((d, i) => {
    const points = [];
    const segments = 96;

    for (let j = 0; j < segments; j++) {
      const a = (j / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(a) * d.rx,
          d.y,
          Math.sin(a) * d.rz
        )
      );
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: A,
      transparent: true,
      opacity: d.opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const track = new THREE.LineLoop(geo, mat);
    track.rotation.y = d.rot;
    track.userData = { speed: d.speed };
    g.add(track);
    tracks.push(track);

    const eventMat = stdMat(A, {
      metalness: 0.75,
      roughness: 0.2,
      ei: 0.95,
    });
    reactive.push(eventMat);

    const event = new THREE.Mesh(
      new THREE.SphereGeometry(i === 0 ? 0.065 : 0.05, 12, 12),
      eventMat
    );

    event.userData = {
      track,
      rx: d.rx,
      rz: d.rz,
      y: d.y,
      phase: i * 2.15,
      speed: 0.55 + i * 0.16,
    };

    g.add(event);
    events.push(event);
  });

  const scan = new THREE.Mesh(
    new THREE.TorusGeometry(0.91, 0.012, 8, 80),
    new THREE.MeshBasicMaterial({
      color: A,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );

  scan.rotation.x = Math.PI / 2;
  g.add(scan);

  return {
    group: g,
    reactive,
    spin: 0.08,

    customUpdate: (dt, t) => {
      core.rotation.x += dt * 0.35;
      core.rotation.y -= dt * 0.52;

      coreGlow.material.opacity =
        0.58 + Math.sin(t * 1.7) * 0.14;

      tracks.forEach((track) => {
        track.rotation.z += dt * track.userData.speed;
      });

      events.forEach((event) => {
        const u = event.userData;
        const a = t * u.speed + u.phase;

        const local = new THREE.Vector3(
          Math.cos(a) * u.rx,
          u.y + Math.sin(t * 1.3 + u.phase) * 0.055,
          Math.sin(a) * u.rz
        );

        local.applyQuaternion(u.track.quaternion);
        event.position.copy(local);
      });

      scan.rotation.z += dt * 0.45;
      scan.material.opacity =
        0.34 + Math.sin(t * 1.4) * 0.10;
    },
  };
}

/* regisztracio */

export const BUILDERS = {
  'gyro-frame': buildGyroFrame,
  'layered': buildLayered,
  'branching': buildBranching,
  'orbit-ring': buildOrbitRing,
  'concentric-soft': buildConcentricSoft,
  'assembling': buildAssembling,
  'scatter-field': buildScatterField,
  'faceted-crystal': buildFacetedCrystal,
  'core-sphere': buildCoreSphere,
  'temporal-orbit': buildTemporalOrbit,
};

export function createVisual(def) {
  const builder = BUILDERS[def.geometry] ?? buildCoreSphere;
  const built = builder(def.accent);

  const group = new THREE.Group();
  group.add(built.group);

  const hitbox = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 12, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );

  return {
    def, group, hitbox,
    reactive: built.reactive ?? [],
    customUpdate: built.customUpdate ?? null,
    spin: built.spin ?? 0.25,
    isHovered: false, scaleCur: 1, pulse: 0,
  };
}

