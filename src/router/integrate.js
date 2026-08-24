import { Router } from './router.js';

function waitNav(app, cond, cb) {
  let n = 0;
  const iv = setInterval(() => {
    n += 1;
    let ok = false;
    try { ok = cond(); } catch (e) { ok = false; }
    if (ok) { clearInterval(iv); cb(); }
    else if (n > 160) { clearInterval(iv); }
  }, 50);
}

export function setupRouter(app) {
  if (app.__routerOn) return;
  app.__routerOn = true;

  Router.start();

  const openByFid = (fid) => {
    switch (fid) {
      case 'work:find-jobs': app.jobBrowser.open(); return true;
      case 'work:my-applications': app.applicationsView.open(); return true;
      case 'work:job-radar': app.radarView.open(); return true;
      case 'work:my-profile': app.profileView.open(); return true;
      case 'work:discover-my-skills': app.skillsDiscovery.open(); return true;
      case 'work:active-matches': app.activeMatchesView.open(); return true;
      case 'work:open-to-me': app.openToMeView.open(); return true;
      case 'wellbeing:60-second-reset': app.wellbeingView.open('reset'); return true;
      case 'wellbeing:breathing': app.wellbeingView.open('breath'); return true;
      case 'wellbeing:quiet-mode': return true;
      case 'learn:languages':
      case 'learn:practice': app.learnView.open(); return true;
      case 'learn:progress': app.learnView.openProgress(); return true;
      case 'analyze:compare': app.analyzeView.open(); return true;
      case 'work:employer-insight': app.employerView.open(); return true;
      case 'work:interview-preparation': app.interviewView.open(); return true;
      case 'work:career-path': app.careerView.open(); return true;
      case 'life:planning': app.lifeView.open('plan'); return true;
      case 'life:travel': app.lifeView.open('travel'); return true;
      case 'life:organization': app.lifeView.open('notes'); return true;
      case 'create:documents': app.createView.open('doc'); return true;
      case 'create:presentations': app.createView.open('slides'); return true;
      case 'create:writing': app.createView.open('scratch'); return true;
      case 'create:images': app.createView.open('board'); return true;
    }
    if (typeof fid === 'string' && fid.startsWith('explore:')) { app.exploreView.open(); return true; }
    const parts = fid.split(':');
    const mod = parts[0];
    const slug = parts[1] || '';
    if (mod === 'personal') { app.personalView.open(); return true; }
    const disc = ['search', 'topics', 'explore', 'research', 'timeline'];
    if (mod === 'discover' && disc.indexOf(slug) !== -1) { app.entityView.openIndex(); return true; }
    return false;
  };

  const arriveModule = (moduleId, cb) => {
    waitNav(app, () =>
      app.navigation.state === 'module' &&
      app.navigation.current &&
      app.navigation.current.def.id === moduleId,
      cb);
  };

  /* hash szinkron a felhasznaloi navigacio korul */
  const nav = app.navigation;
  if (!nav.__rw) {
    nav.__rw = true;

    const oEnter = nav.enterModule.bind(nav);
    nav.enterModule = (node) => {
      oEnter(node);
      if (!node) return;
      arriveModule(node.def.id, () => {
        const mid = app.navigation.current.def.id;
        const pe = app._pendEnt; app._pendEnt = null;
        if (pe) {
          Router.push({ view: 'entity', entityId: pe });
          app.entityView.open(pe);
        } else {
          Router.replace({ view: 'module', module: mid });
          const pf = app._pendFn; app._pendFn = null;
          if (pf && !openByFid(pf)) {
            app.actionPanel.show(
              { id: pf, label: String(pf.split(':')[1] || '').toUpperCase(), moduleId: mid },
              null);
          }
        }
      });
    };

    const oRet = nav.returnToCore.bind(nav);
    nav.returnToCore = () => {
      oRet();
      waitNav(app, () => app.navigation.state === 'core', () => {
        Router.replace({ view: 'core' });
      });
    };
  }

  const goModuleDeep = (moduleId, fid) => {
    if (app.navigation.state === 'traveling') return;

    const inIt = app.navigation.state === 'module' &&
                 app.navigation.current &&
                 app.navigation.current.def.id === moduleId;

    if (inIt) {
      if (fid) {
        if (!openByFid(fid)) {
          app.actionPanel.show(
            { id: fid, label: String(fid.split(':')[1] || '').toUpperCase(), moduleId },
            null);
        }
      } else {
        app.panels.forEach((p) => { if (p.close) p.close(); });
        app.entityView.close();
      }
      return;
    }

    app._pendFn = fid || null;
    const node = app.nodes.getById(moduleId);
    if (!node) { Router.replace({ view: 'core' }); return; }

    if (app.navigation.state === 'module') nav.gotoModule(moduleId);
    else nav.enterModule(node);
  };

  const resolve = () => {
    const r = Router.parse();

    if (r.view === 'entity') {
      app.entityView.open(r.entityId);
      return;
    }

    if (app.entityView.isOpen) app.entityView.close();

    if (r.view === 'core') {
      if (app.navigation.state === 'module') nav.returnToCore();
      return;
    }

    if (r.view === 'module') {
      const fid = r.fn ? r.module + ':' + r.fn : null;
      goModuleDeep(r.module, fid);
    }
  };

  const readyResolve = () => {
    if (app.welcome && app.welcome.isOpen) { setTimeout(readyResolve, 250); return; }
    resolve();
  };

  Router.on('change', () => {
    if (app.welcome && app.welcome.isOpen) { readyResolve(); return; }
    resolve();
  });

  readyResolve();
}