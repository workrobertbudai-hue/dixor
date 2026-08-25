const KNOWN = {
  work: ["find-jobs","active-matches","open-to-me","job-radar","my-applications","my-profile","discover-my-skills"],
  wellbeing: ["60-second-reset","breathing","quiet-mode"],
  learn: ["languages","practice","progress"],
  personal: ["profile","history","saved","progress","preferences"],
  analyze: ["compare","research","understand","decision-support","what-if"],
  discover: ["search","topics","explore","research","why","what-if"],
  timeline: ["your-journey","history","temporal-context","personal-events","community-chat"]
};

export const Router = {
  subs: {},
  suppress: false,
  _started: false,

  parse() {
    const h = location.hash.replace(/^#\/?/, "");
    if (!h) return { view: "core" };
    const p = h.split("/").filter(Boolean);
    if (p[0] === "discover" && p[1] === "entity" && p[2]) {
      return { view: "entity", entityId: decodeURIComponent(p[2]) };
    }
    if (!p[0]) return { view: "core" };
    return { view: "module", module: p[0], fn: p[1] ? decodeURIComponent(p[1]) : null };
  },

  hash(s) {
    if (s.view === "core") return "#/";
    if (s.view === "entity") return "#/discover/entity/" + encodeURIComponent(s.entityId);
    return "#/" + s.module + (s.fn ? "/" + s.fn : "");
  },

  push(s) {
    const h = this.hash(s);
    if (location.hash !== h) {
      this.suppress = true;
      location.hash = h;
      setTimeout(() => { this.suppress = false; }, 0);
    }
  },

  replace(s) {
    const url = location.pathname + location.search + this.hash(s);
    this.suppress = true;
    history.replaceState(null, "", url);
    setTimeout(() => { this.suppress = false; }, 0);
  },

  on(ev, fn) {
    (this.subs[ev] = this.subs[ev] || []).push(fn);
  },

  fire(ev) {
    if (this.suppress) return;
    const list = this.subs[ev] || [];
    list.forEach((fn) => { try { fn(); } catch (e) { console.error("[router]", e); } });
  },

  /* kompatibilitas-nev: a regi app-verziok emit-et hivnak */
  emit(ev) { this.fire(ev); },

  start() {
    if (this._started) return;
    this._started = true;
    window.addEventListener("hashchange", () => this.fire("change"));
  },

  functionId(r) {
    if (r.view !== "module" || !r.fn) return null;
    if (r.module === "discover" && r.fn === "entity") return null;
    const l = KNOWN[r.module];
    if (l && l.indexOf(r.fn) === -1) return null;
    return r.module + ":" + r.fn;
  },

  /* kompatibilitas-nev: az app.js fid-kent hivja */
  fid(r) { return this.functionId(r); }
};

