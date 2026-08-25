const KEY = 'dixor.state.v1';

function dayStr(d) {
  const x = d || new Date();
  return x.getFullYear() + '-' + String(x.getMonth()+1).padStart(2,'0') + '-' + String(x.getDate()).padStart(2,'0');
}

const DEFAULTS = {
  visits: {}, lastModule: null, enteredOnce: false, memberSinceMs: null,
  streakCount: 0, bestStreak: 0, lastVisitDay: null,
  applications: [], radarActive: false, radarSinceMs: null,
  learnProgress: {}, chatLog: {},
  profile: {
    headline: 'Open to new opportunities',
    skills: [], languages: ['English'],
    location: 'Budapest', mobility: 'Hybrid', schedule: 'Full-time',
  },
};

export class AppState {
  constructor() { this.data = this.#load(); }

  #load() {
    try {
      const raw = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
      raw.applications = (raw.applications ?? []).map((a) =>
        typeof a === 'string' ? { id: a, at: null } : a);
      raw.profile = { ...DEFAULTS.profile, ...(raw.profile ?? {}) };
      raw.learnProgress = raw.learnProgress ?? {};
      raw.chatLog = raw.chatLog ?? {};
      raw.visits = raw.visits ?? {};
      return raw;
    } catch { return JSON.parse(JSON.stringify(DEFAULTS)); }
  }

  save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch {} }

  /* csillag-esemenenyelo: az app fogja es a csillagkepet boviti */
  _star(t) { try { window.dispatchEvent(new CustomEvent('dx-star', { detail: t })); } catch {} }

  recordEnter(moduleId) {
    if (!this.data.memberSinceMs) this.data.memberSinceMs = Date.now();
    this.#touchStreak();
    this.data.visits[moduleId] = (this.data.visits[moduleId] ?? 0) + 1;
    this.data.lastModule = moduleId;
    const first = !this.data.enteredOnce;
    this.data.enteredOnce = true;
    this.save();
    if (first) this._star('ENTER_FIRST');
  }

  #touchStreak() {
    const today = dayStr();
    if (this.data.lastVisitDay === today) return;
    const yest = dayStr(new Date(Date.now() - 86400000));
    this.data.streakCount = this.data.lastVisitDay === yest ? (this.data.streakCount || 0) + 1 : 1;
    this.data.bestStreak = Math.max(this.data.bestStreak || 0, this.data.streakCount);
    this.data.lastVisitDay = today;
  }

  getStreak() { return { count: this.data.streakCount || 0, best: this.data.bestStreak || 0 }; }

  recordReturnToCore() { this.data.lastModule = null; this.save(); }
  visitCount(m) { return this.data.visits[m] ?? 0; }
  getVisits() { return { ...(this.data.visits ?? {}) }; }
  memberSince() { return this.data.memberSinceMs; }

  hasApplied(id) { return this.data.applications.some((a) => a.id === id); }
  addApplication(id) {
    if (!this.hasApplied(id)) {
      this.data.applications.push({ id, at: Date.now() });
      this.save();
      this._star('JOB_TRACKED');
    }
  }
  getApplications() { return [...this.data.applications]; }

  isRadarActive() { return !!this.data.radarActive; }
  setRadarActive(v) {
    this.data.radarActive = v;
    if (v && !this.data.radarSinceMs) this.data.radarSinceMs = Date.now();
    this.save();
    if (v) this._star('RADAR_ON');
  }
  radarSince() { return this.data.radarSinceMs; }

  recordLearnSession(langId, knownWords) {
    const lp = this.data.learnProgress;
    const cur = lp[langId] ?? { known: [], sessions: 0 };
    const set = new Set(cur.known);
    (knownWords ?? []).forEach((w) => set.add(w));
    lp[langId] = { known: [...set], sessions: cur.sessions + 1 };
    this.save();
    this._star('LEARN_SESSION');
  }
  getLearnProgress() { return JSON.parse(JSON.stringify(this.data.learnProgress)); }

  getChatLog(tid) { return [...((this.data.chatLog ?? {})[tid] ?? [])]; }
  addChatMessage(tid, msg) {
    const cl = this.data.chatLog ?? (this.data.chatLog = {});
    const arr = cl[tid] ?? (cl[tid] = []);
    arr.push(msg);
    while (arr.length > 60) arr.shift();
    this.save();
    this._star('CHAT_JOINED');
  }

  getLife() { return JSON.parse(JSON.stringify(this.data.life ?? { planSeeded:false, plan:[], packItems:[], pack:{}, notes:[] })); }
  saveLife(life) { this.data.life = life; this.save(); }

  getKV(k, f) { const v = this.data[k]; return v === undefined ? f : JSON.parse(JSON.stringify(v)); }
  setKV(k, val) { this.data[k] = val; this.save(); }

  addConstellationStar(t) { this._star(t); }

  getProfile() { return JSON.parse(JSON.stringify(this.data.profile)); }
  updateProfile(p) { Object.assign(this.data.profile, p); this.save(); }
  addSkill(n) { n=(n??'').trim().toLowerCase(); if(n && !this.data.profile.skills.includes(n)){this.data.profile.skills.push(n);this.save();} }
  removeSkill(n){ this.data.profile.skills=this.data.profile.skills.filter(s=>s!==n); this.save(); }
  addLanguage(n){ n=(n??'').trim(); if(n && !this.data.profile.languages.includes(n)){this.data.profile.languages.push(n);this.save();} }
  removeLanguage(n){ this.data.profile.languages=this.data.profile.languages.filter(s=>s!==n); this.save(); }
  addSkills(list){ (list??[]).forEach(s=>this.addSkill(s)); if((list??[]).length) this._star('SKILL_FOUND'); }
}