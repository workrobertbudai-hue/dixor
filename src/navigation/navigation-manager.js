import * as THREE from 'three';
import { ModuleWorld } from '../world/module-world.js';

const CAM_HOME_POS = new THREE.Vector3(0, 2.2, 14);
const CAM_HOME_LOOK = new THREE.Vector3(0, 0, 0);
const CAM_MODULE_POS = new THREE.Vector3(0, 2, 11);

export class NavigationManager {
  constructor({ app }) {
    this.app = app;
    this.state = 'core';
    this.moduleWorlds = new Map();
    this.current = null;
    this.pending = null;

    this.transition = app.transition;
    this.breadcrumbs = app.breadcrumbs;
    this.backButton = app.backButton;
    this.coreWorld = app.coreWorld;
    this.nodes = app.nodes;
    this.scene = app.scene;
    this.camera = app.camera;
  }

  #closePanels() {
    this.app.actionPanel.hide();
    (this.app.panels ?? []).forEach((p) => p.close ? p.close() : null);
  }

  gotoModule(id) {
    const node = this.nodes.getById(id);
    if (!node) return;
    if (this.state === 'core') this.enterModule(node);
    else if (this.state === 'module') {
      this.pending = node;
      this.returnToCore();
    }
  }

  enterModule(node) {
    if (this.state !== 'core' || !node) return;
    this.state = 'traveling';
    this.app.lockInteraction(true);
    this.#closePanels();

    const target = node.group.position.clone();
    const dir = this.camera.position.clone().sub(target).normalize();
    const endPos = target.clone().addScaledVector(dir, 3.4);

    this.transition.flyTo(endPos, target, 1.15, () => {
      this.transition.veilIn(() => {
        this.coreWorld.group.visible = false;
        this.nodes.group.visible = false;

        let world = this.moduleWorlds.get(node.def.id);
        if (!world) {
          world = new ModuleWorld(node.def);
          this.moduleWorlds.set(node.def.id, world);
          this.scene.add(world.group);
        }
        world.group.visible = true;
        this.current = world;

        this.camera.position.copy(CAM_MODULE_POS);
        this.transition.lookTarget.copy(CAM_HOME_LOOK);
        this.camera.lookAt(CAM_HOME_LOOK);
        this.transition.veilOut();

        this.state = 'module';
        this.breadcrumbs.setTrail([
          { id: 'core', label: 'DIXOR' },
          { id: node.def.id, label: node.def.label },
        ]);
        this.backButton.show();

        const visits = this.app.state.recordEnter(node.def.id);
        this.app.statusBar.setArea(
          node.def.label,
          node.def.accent,
          'VISIT #' + visits + ' \u00B7 ESC \u2014 BACK TO CORE'
        );
        this.app.lockInteraction(false);

        if (this.pending) {
          const next = this.pending;
          this.pending = null;
          setTimeout(() => this.enterModule(next), 400);
        }
      });
    });
  }

  returnToCore() {
    if (this.state !== 'module') return;
    this.state = 'traveling';
    this.app.lockInteraction(true);
    this.#closePanels();

    this.transition.veilIn(() => {
      if (this.current) this.current.group.visible = false;
      this.current = null;

      this.coreWorld.group.visible = true;
      this.nodes.group.visible = true;

      this.camera.position.copy(CAM_HOME_POS);
      this.transition.lookTarget.copy(CAM_HOME_LOOK);
      this.camera.lookAt(CAM_HOME_LOOK);
      this.transition.veilOut();

      this.state = 'core';
      this.breadcrumbs.setTrail([{ id: 'core', label: 'CORE' }]);
      this.backButton.hide();
      this.app.state.recordReturnToCore();
      this.app.statusBar.setArea('CORE', null, 'PRESS / TO SEARCH');
      this.app.lockInteraction(false);

      if (this.pending) {
        const next = this.pending;
        this.pending = null;
        setTimeout(() => this.enterModule(next), 400);
      }
    });
  }
}
