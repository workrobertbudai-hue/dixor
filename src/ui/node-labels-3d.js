import * as THREE from 'three';

/**
 * NODE LABELS 3D - mindig lathato nevek a modul-node-ok alatt,
 * tavolsag szerint halvanyulva + hover-re sci-fi celkeret.
 */
export class NodeLabels3D {
  constructor(app) {
    this.app = app;
    this.labels = [];
    this.frameEl = null;

    app.nodes.nodes.forEach((node) => {
      const el = document.createElement('div');
      el.className = 'dx-nlabel';
      el.textContent = node.def.label;
      el.style.setProperty('--c', node.def.accent);
      document.body.appendChild(el);
      this.labels.push({ node, el });
    });

    /* celkeret: 4 sarok-zarojel + forgo gyuru */
    const f = document.createElement('div');
    f.className = 'dx-target';
    f.innerHTML =
      '<i class="tl"></i><i class="tr"></i><i class="bl"></i><i class="br"></i>' +
      '<i class="spin"></i>';
    document.body.appendChild(f);
    this.frameEl = f;

    this._v = new THREE.Vector3();
    this._camDir = new THREE.Vector3();
    this._nDir = new THREE.Vector3();

    window.addEventListener('resize', () => this.#placeAll());
  }

  #project(pos) {
    const a = this.app;
    this._v.copy(pos).project(a.camera);
    return {
      x: (this._v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-this._v.y * 0.5 + 0.5) * window.innerHeight,
      z: this._v.z,
      behind: this._v.z > 1 || this._v.z < -1,
    };
  }

  update(dt, hovered) {
    const a = this.app;
    if (!a || !a.camera) return;

    /* csak CORE allapotban mutatjuk (modul-vilagban mas a UI-logika) */
    const inCore = a.navigation && a.navigation.state === 'core';

    /* kamera irany a kozpont felol - ehhez hasonlitunk a node iranyat */
    a.camera.getWorldDirection(this._camDir);

    for (const { node, el } of this.labels) {
      if (!inCore) { el.classList.remove('is-on'); continue; }

      const p = this.#project(node.group.position);

      if (p.behind) { el.classList.remove('is-on'); continue; }

      /* tavolsag-alapu athuszatsag */
      const dist = a.camera.position.distanceTo(node.group.position);
      const fade = THREE.MathUtils.clamp(1.35 - dist / 16, 0.25, 1);

      el.classList.add('is-on');
      el.style.left = p.x + 'px';
      el.style.top = p.y + 'px';
      el.style.opacity = String(fade * (hovered === node ? 1 : 0.8));
      el.style.borderColor = hovered === node ? 'var(--c)' : 'transparent';
    }

    /* celkeret kovetes */
    if (inCore && hovered) {
      const p = this.#project(hovered.group.position);
      if (!p.behind) {
        this.frameEl.classList.add('is-on');
        this.frameEl.style.left = p.x + 'px';
        this.frameEl.style.top = p.y + 'px';
        return;
      }
    }
    this.frameEl.classList.remove('is-on');
  }

  #placeAll() {}
}