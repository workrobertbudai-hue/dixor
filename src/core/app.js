import * as THREE from 'three';
import { createScene } from './scene.js';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { createLights } from './lights.js';
import { createEnvironment } from './environment.js';
import { CoreWorld } from '../world/core-world.js';
import { WorldTransition } from '../world/world-transition.js';
import { NodeManager } from '../nodes/node-manager.js';
import { getModuleById } from '../nodes/node-data.js';
import { Mouse } from '../interaction/mouse.js';
import { RaycasterService } from '../interaction/raycaster.js';
import { HoverController } from '../interaction/hover.js';
import { ClickController } from '../interaction/click.js';
import { ZoomController } from '../interaction/zoom.js';
import { OrbitController } from '../interaction/orbit.js';
import { SoundSystem } from '../audio/sound.js';
import { NodeLabel } from '../ui/node-label.js';
import { WelcomeScreen } from '../ui/welcome-screen.js';
import { SearchInterface } from '../ui/search-interface.js';
import { ActionPanel } from '../ui/action-panel.js';
import { StatusBar } from '../ui/status-bar.js';
import { PresenceWidget } from '../ui/presence-widget.js';
import { ChatView } from '../ui/chat-view.js';
import { JobBrowser } from '../ui/job-browser.js';
import { ApplicationsView } from '../ui/applications-view.js';
import { JobRadarView } from '../ui/job-radar-view.js';
import { ProfileView } from '../ui/profile-view.js';
import { SkillsDiscovery } from '../ui/skills-discovery.js';
import { ActiveMatchesView, OpenToMeView } from '../ui/matches-views.js';
import { WellbeingView, setQuiet } from '../ui/wellbeing-view.js';
import { LearnView } from '../ui/learn-view.js';
import { PersonalView } from '../ui/personal-view.js';
import { EntityView } from '../ui/entity-view.js';
import { AnalyzeView } from '../ui/analyze-view.js';
import { EmployerInsightView } from '../ui/employer-view.js';
import { InterviewView } from '../ui/interview-view.js';
import { CareerView } from '../ui/career-view.js';
import { ExploreView } from '../ui/explore-view.js';
import { LifeView } from '../ui/life-view.js';
import { CreateView } from '../ui/create-view.js';
import { Router } from '../router/router.js';
import { setupRouter } from '../router/integrate.js';
import { Breadcrumbs } from '../navigation/breadcrumbs.js';
import { BackToCore } from '../navigation/back-to-core.js';
import { NavigationManager } from '../navigation/navigation-manager.js';
import { AppState } from '../state/app-state.js';
import { ConnectionWeb } from '../visual/connections.js';
import { createCosmos } from '../visual/cosmos.js';

export class App {
  constructor(container) {
    this.container = container;
    this.clock = new THREE.Clock();
    this.updatables = [];
    this.navLocked = false;
    this.stateStore = new AppState();
    this.panels = [];
  }

  init() {
    this.scene = createScene();
    this.camera = createCamera(this.container);
    this.renderer = createRenderer(this.container);

    this.camera.position.set(0, 7, 34);
    this.camera.lookAt(0, 0, 0);

    createLights(this.scene);

    const cosmos = createCosmos(this.scene);
    const environment = createEnvironment();
    this.scene.add(environment.group);
    this.registerUpdate(environment.update);
    this.registerUpdate(cosmos.update);

    this.coreWorld = new CoreWorld();
    this.scene.add(this.coreWorld.group);
    this.registerUpdate((dt, t) => this.coreWorld.update(dt, t));

    this.transition = new WorldTransition(this.camera);
    this.registerUpdate((dt) => this.transition.update(dt));

    this.nodes = new NodeManager(this.scene);
    this.registerUpdate((dt, t) => this.nodes.update(dt, t));

    this.connections = new ConnectionWeb(this.scene, this.nodes.nodes);
    this.registerUpdate((dt, t) =>
      this.connections.update(dt, t, this.hover ? this.hover.current : null)
    );

    this.statusBar = new StatusBar();
    this.actionPanel = new ActionPanel();
    this.presence = new PresenceWidget();

    this.jobBrowser = new JobBrowser({ stateStore: this.stateStore });
    this.applicationsView = new ApplicationsView({ stateStore: this.stateStore });
    this.radarView = new JobRadarView({ stateStore: this.stateStore });
    this.profileView = new ProfileView({ stateStore: this.stateStore });
    this.skillsDiscovery = new SkillsDiscovery({ stateStore: this.stateStore });
    this.activeMatchesView = new ActiveMatchesView({ stateStore: this.stateStore });
    this.openToMeView = new OpenToMeView({ stateStore: this.stateStore });
    this.wellbeingView = new WellbeingView();
    this.learnView = new LearnView({ stateStore: this.stateStore });
    this.chatView = new ChatView({ stateStore: this.stateStore });
    this.personalView = new PersonalView({
      stateStore: this.stateStore,
      onEditProfile: () => this.profileView.open(),
    });
    this.entityView = new EntityView();
    this.analyzeView = new AnalyzeView();
    this.employerView = new EmployerInsightView({ stateStore: this.stateStore });
    this.interviewView = new InterviewView({ stateStore: this.stateStore });
    this.careerView = new CareerView({ stateStore: this.stateStore });
    this.exploreView = new ExploreView({ stateStore: this.stateStore });
    this.lifeView = new LifeView({ stateStore: this.stateStore });
    this.createView = new CreateView({ stateStore: this.stateStore });

    this.panels.push(
      this.jobBrowser,
      this.applicationsView,
      this.radarView,
      this.profileView,
      this.skillsDiscovery,
      this.activeMatchesView,
      this.openToMeView,
      this.wellbeingView,
      this.learnView,
      this.chatView,
      this.personalView,
      this.entityView,
      this.analyzeView,
      this.lifeView,
      this.createView,
      this.employerView,
      this.interviewView,
      this.careerView,
      this.exploreView
    );

    this.breadcrumbs = new Breadcrumbs({
      onRootClick: () => this.navigation.returnToCore(),
    });
    this.backButton = new BackToCore({
      onBack: () => this.navigation.returnToCore(),
    });
    this.navigation = new NavigationManager({ app: this });

    this.registerUpdate((dt, t) => {
      if (this.navigation.state === 'module' && this.navigation.current) {
        this.navigation.current.update(dt, t);
      }
    });

    this.welcome = new WelcomeScreen({
      onEnter: () => {
        this.transition.flyTo(
          new THREE.Vector3(0, 2.2, 14),
          new THREE.Vector3(0, 0, 0),
          1.9
        );
      },
    });

    if (this.stateStore.data.enteredOnce) {
      this.welcome.setButtonLabel('RETURN TO DIXOR');
    }

    this.search = new SearchInterface({
      onGo: (def) => this.navigation.gotoModule(def.id),
      onEntity: (ent) => { Router.push({ view: 'entity', entityId: ent.id }); },
    });

    this.mouse = new Mouse(this.renderer.domElement);
    this.zoomCtl = new ZoomController(this);
    this.orbitCtl = new OrbitController(this);
    this.soundCtl = new SoundSystem(this);
    this.raycaster = new RaycasterService();
    this.label = new NodeLabel();
    this.hover = new HoverController({ dom: this.renderer.domElement, label: this.label });
    this.click = new ClickController({
      dom: this.renderer.domElement,
      onSelect: (def) => {
        if (def.kind === 'function') {
          if (def.id === 'work:find-jobs') { this.jobBrowser.open(); return; }
          if (def.id === 'work:my-applications') { this.applicationsView.open(); return; }
          if (def.id === 'work:job-radar') { this.radarView.open(); return; }
          if (def.id === 'work:my-profile') { this.profileView.open(); return; }
          if (def.id === 'work:discover-my-skills') { this.skillsDiscovery.open(); return; }
          if (def.id === 'work:active-matches') { this.activeMatchesView.open(); return; }
          if (def.id === 'work:open-to-me') { this.openToMeView.open(); return; }
          if (def.id === 'wellbeing:60-second-reset') { this.wellbeingView.open('reset'); return; }
          if (def.id === 'wellbeing:breathing') { this.wellbeingView.open('breath'); return; }
          if (def.id === 'wellbeing:quiet-mode') { setQuiet(!document.body.classList.contains('dx-quiet')); return; }
          if (def.id === 'learn:languages') { this.learnView.open(); return; }
          if (def.id === 'learn:practice') { this.learnView.open(); return; }
          if (def.id === 'learn:progress') { this.learnView.openProgress(); return; }
          if (def.id.startsWith('personal:')) { this.personalView.open(); return; }
          if (def.id.startsWith('discover:')) {
            const slug = def.id.slice('discover:'.length);
            const known = ['search','topics','explore','research','timeline'];
            if (known.indexOf(slug) !== -1) { this.entityView.openIndex(); return; }
            this.actionPanel.show(def, getModuleById(def.moduleId));
            return;
          }
          if (def.id === 'analyze:compare') { this.analyzeView.open(); return; }
          if (def.id.startsWith('life:')) { const mt = { 'life:planning': 'plan', 'life:travel': 'travel', 'life:organization': 'notes' }[def.id] || 'plan'; this.lifeView.open(mt); return; }
          if (def.id.startsWith('create:')) { const mt = { 'create:documents': 'doc', 'create:writing': 'scratch', 'create:presentations': 'slides', 'create:images': 'board' }[def.id] || 'doc'; this.createView.open(mt); return; }
          if (def.id === 'work:career-path') { Router.push({view:'module',module:'work',fn:'career-path'}); this.careerView.open(); return; }
          if (def.id === 'work:interview-preparation') { Router.push({view:'module',module:'work',fn:'interview-preparation'}); this.interviewView.open(); return; }
          if (def.id === 'work:employer-insight') { Router.push({view:'module',module:'work',fn:'employer-insight'}); this.employerView.open(); return; }
          if (def.id.startsWith('explore:') && def.id !== 'explore:community-chat') { Router.push({view:'module',module:'explore'}); this.exploreView.open(); return; }
          if (def.id.endsWith(':community-chat')) { this.chatView.open(def.moduleId); return; }
          this.actionPanel.show(def, getModuleById(def.moduleId));
        } else {
          this.navigation.enterModule(this.nodes.getById(def.id));
        }
      },
    });

    this.registerUpdate(() => {
      const clear = () => {
        this.hover.update(null, this.mouse);
        this.click.update(null);
      };

      if (this.welcome.isOpen) return clear();

      const navState = this.navigation.state;
      let targets = [];
      if (navState === 'core') targets = this.nodes.targets;
      else if (navState === 'module') targets = this.navigation.current ? this.navigation.current.targets : [];
      else return clear();

      if (!targets.length) return clear();

      this.scene.updateMatrixWorld();
      const hit = this.raycaster.pick(this.camera, targets, this.mouse.ndc);
      const node = hit ? hit.object.userData.nodeRef : null;
      this.hover.update(node, this.mouse);
      this.click.update(node);
    });

    setupRouter(this);
    window.addEventListener('resize', () => this.onResize());
    this.renderer.setAnimationLoop(() => this.tick());
  }

  lockInteraction(v) { this.navLocked = v; }
  registerUpdate(fn) { this.updatables.push(fn); }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    for (const fn of this.updatables) fn(dt, t);
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / Math.max(h, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}