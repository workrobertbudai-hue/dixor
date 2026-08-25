const KEY = 'dixor.state.v1';

const DEFAULTS = {
  visits: {},
  lastModule: null,
  enteredOnce: false,
  memberSinceMs: null,
  applications: [],
  radarActive: false,
  radarSinceMs: null,
  learnProgress: {},
  chatLog: {},
  profile: {
    headline: 'Open to new opportunities',
    skills: [],
    languages: ['English'],
    location: 'Budapest',
    mobility: 'Hybrid',
    schedule: 'Full-time',
  },
};

export class AppState {
  constructor() {
    this.data = this.#load();
  }

  #load() {
    try {
      const raw = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
      raw.applications = (raw.applications ?? []).map((a) =>
        typeof a === 'string' ? { id: a, at: null } : a
      );
      raw.profile = { ...DEFAULTS.profile, ...(raw.profile ?? {}) };
      raw.learnProgress = raw.learnProgress ?? {};
      raw.chatLog = raw.chatLog ?? {};
      return raw;
    } catch {
      return JSON.parse(JSON.stringify(DEFAULTS));
    }
  }

  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch {}
  }

  recordEnter(moduleId) {
    if (!this.data.memberSinceMs) this.data.memberSinceMs = Date.now();
    this.data.visits[moduleId] = (this.data.visits[moduleId] ?? 0) + 1;
    this.data.lastModule = moduleId;
    this.data.enteredOnce = true;
    this.save();
  }

  recordReturnToCore() {
    this.data.lastModule = null;
    this.save();
  }

  visitCount(moduleId) {
    return this.data.visits[moduleId] ?? 0;
  }

  getVisits() {
    return { ...(this.data.visits ?? {}) };
  }

  memberSince() {
    return this.data.memberSinceMs;
  }

  hasApplied(jobId) {
    return this.data.applications.some((a) => a.id === jobId);
  }

  addApplication(jobId) {
    if (!this.hasApplied(jobId)) {
      this.data.applications.push({ id: jobId, at: Date.now() });
      this.save();
    }
  }

  getApplications() {
    return [...this.data.applications];
  }

  isRadarActive() {
    return !!this.data.radarActive;
  }

  setRadarActive(v) {
    this.data.radarActive = v;
    if (v && !this.data.radarSinceMs) this.data.radarSinceMs = Date.now();
    this.save();
  }

  radarSince() {
    return this.data.radarSinceMs;
  }

  recordLearnSession(langId, knownWords) {
    const lp = this.data.learnProgress;
    const cur = lp[langId] ?? { known: [], sessions: 0 };
    const set = new Set(cur.known);
    (knownWords ?? []).forEach((w) => set.add(w));
    lp[langId] = { known: [...set], sessions: cur.sessions + 1 };
    this.save();
  }

  getLearnProgress() {
    return JSON.parse(JSON.stringify(this.data.learnProgress));
  }

  getChatLog(topicId) {
    return [...((this.data.chatLog ?? {})[topicId] ?? [])];
  }

  addChatMessage(topicId, msg) {
    const cl = this.data.chatLog ?? (this.data.chatLog = {});
    const arr = cl[topicId] ?? (cl[topicId] = []);
    arr.push(msg);
    while (arr.length > 60) arr.shift();
    this.save();
  }

  /* ---- Life data ---- */

  getLife() {
    return JSON.parse(JSON.stringify(this.data.life ?? { planSeeded: false, plan: [], packItems: [], pack: {}, notes: [] }));
  }

  saveLife(life) {
    this.data.life = life;
    this.save();
  }
  /* ---- Generic key-value storage ---- */

  getKV(key, fallback) {
    const v = this.data[key];
    return v === undefined ? fallback : JSON.parse(JSON.stringify(v));
  }

  setKV(key, val) {
    this.data[key] = val;
    this.save();
  }
  /* ---- Constellation events ---- */

  addConstellationStar(typeKey) {
    const list = this.getKV('constellation', []);
    list.push({ t: typeKey, at: Date.now() });
    while (list.length > 120) list.shift();
    this.setKV('constellation', list);
  }
  getProfile() {
    return JSON.parse(JSON.stringify(this.data.profile));
  }

  updateProfile(patch) {
    Object.assign(this.data.profile, patch);
    this.save();
  }

  addSkill(name) {
    const n = (name ?? '').trim().toLowerCase();
    if (n && !this.data.profile.skills.includes(n)) {
      this.data.profile.skills.push(n);
      this.save();
    }
  }

  removeSkill(name) {
    this.data.profile.skills = this.data.profile.skills.filter((s) => s !== name);
    this.save();
  }

  addLanguage(name) {
    const n = (name ?? '').trim();
    if (n && !this.data.profile.languages.includes(n)) {
      this.data.profile.languages.push(n);
      this.save();
    }
  }

  removeLanguage(name) {
    this.data.profile.languages = this.data.profile.languages.filter((s) => s !== name);
    this.save();
  }

  addSkills(list) {
    (list ?? []).forEach((s) => this.addSkill(s));
  }
}