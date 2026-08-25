const DEFAULT_CONTEXT = {
  version: "0.1.0",

  currentState: {
    phase: "initial",
    focus: null,
    momentum: 0,
    confidence: 0
  },

  activity: {
    recent: [],
    counts: {}
  },

  interests: [],
  goals: [],
  skills: [],
  opportunities: [],

  trajectory: {
    direction: null,
    signals: [],
    alternatives: []
  },

  signals: {
    learning: 0,
    work: 0,
    discovery: 0,
    creation: 0,
    planning: 0,
    social: 0
  },

  updatedAt: null
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export class ContextState {
  constructor(initial = {}) {
    this.state = {
      ...clone(DEFAULT_CONTEXT),
      ...clone(initial),
      currentState: {
        ...clone(DEFAULT_CONTEXT.currentState),
        ...(initial.currentState || {})
      },
      activity: {
        ...clone(DEFAULT_CONTEXT.activity),
        ...(initial.activity || {})
      },
      trajectory: {
        ...clone(DEFAULT_CONTEXT.trajectory),
        ...(initial.trajectory || {})
      },
      signals: {
        ...clone(DEFAULT_CONTEXT.signals),
        ...(initial.signals || {})
      }
    };

    this.state.updatedAt = Date.now();
  }

  get() {
    return clone(this.state);
  }

  update(patch = {}) {
    this.state = {
      ...this.state,
      ...clone(patch),
      updatedAt: Date.now()
    };

    return this.get();
  }

  setCurrentState(patch = {}) {
    this.state.currentState = {
      ...this.state.currentState,
      ...clone(patch)
    };

    this.state.updatedAt = Date.now();

    return this.get();
  }

  addActivity(activity) {
    if (!activity || !activity.type) return this.get();

    const item = {
      id: activity.id || `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: activity.type,
      source: activity.source || "dixor",
      label: activity.label || "",
      at: activity.at || Date.now()
    };

    this.state.activity.recent.unshift(item);

    this.state.activity.recent =
      this.state.activity.recent.slice(0, 100);

    this.state.activity.counts[item.type] =
      (this.state.activity.counts[item.type] || 0) + 1;

    this.state.updatedAt = Date.now();

    return this.get();
  }

  setSignal(name, value) {
    if (!(name in this.state.signals)) return this.get();

    this.state.signals[name] = Math.max(
      0,
      Math.min(100, Number(value) || 0)
    );

    this.state.updatedAt = Date.now();

    return this.get();
  }

  addInterest(value) {
    if (!value) return this.get();

    const normalized = String(value).trim();

    if (!normalized) return this.get();

    if (!this.state.interests.includes(normalized)) {
      this.state.interests.push(normalized);
    }

    this.state.updatedAt = Date.now();

    return this.get();
  }

  addGoal(value) {
    if (!value) return this.get();

    const normalized = String(value).trim();

    if (!normalized) return this.get();

    if (!this.state.goals.includes(normalized)) {
      this.state.goals.push(normalized);
    }

    this.state.updatedAt = Date.now();

    return this.get();
  }

  addSkill(value) {
    if (!value) return this.get();

    const normalized = String(value).trim();

    if (!normalized) return this.get();

    if (!this.state.skills.includes(normalized)) {
      this.state.skills.push(normalized);
    }

    this.state.updatedAt = Date.now();

    return this.get();
  }

  addOpportunity(value) {
    if (!value) return this.get();

    this.state.opportunities.push({
      ...clone(value),
      at: value.at || Date.now()
    });

    this.state.opportunities =
      this.state.opportunities.slice(-100);

    this.state.updatedAt = Date.now();

    return this.get();
  }

  reset() {
    this.state = clone(DEFAULT_CONTEXT);
    this.state.updatedAt = Date.now();

    return this.get();
  }
}

export function createContextState(initial = {}) {
  return new ContextState(initial);
}

export { DEFAULT_CONTEXT };
