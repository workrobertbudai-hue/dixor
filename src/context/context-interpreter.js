export class ContextInterpreter {
  constructor() {}

  interpret(context) {
    const source = context ?? {};

    const signals = {
      learning: Number(source.signals?.learning) || 0,
      work: Number(source.signals?.work) || 0,
      discovery: Number(source.signals?.discovery) || 0,
      creation: Number(source.signals?.creation) || 0,
      planning: Number(source.signals?.planning) || 0,
      social: Number(source.signals?.social) || 0
    };

    const activityCount =
      Array.isArray(source.activity?.recent)
        ? source.activity.recent.length
        : 0;

    const focus = this.#determineFocus(signals);

    const phase = this.#determinePhase({
      signals,
      activityCount
    });

    const momentum = this.#calculateMomentum({
      signals,
      activityCount
    });

    const confidence = this.#calculateConfidence({
      source,
      signals,
      activityCount
    });

    const direction = this.#determineDirection({
      focus,
      phase,
      signals
    });

    const alternatives = this.#determineAlternatives({
      focus,
      signals
    });

    return {
      ...source,

      currentState: {
        ...(source.currentState || {}),
        phase,
        focus,
        momentum,
        confidence
      },

      trajectory: {
        ...(source.trajectory || {}),
        direction,
        signals: this.#buildTrajectorySignals(signals),
        alternatives
      },

      updatedAt: Date.now()
    };
  }

  #determineFocus(signals) {
    const entries = Object.entries(signals);

    entries.sort((a, b) => b[1] - a[1]);

    const [name, value] = entries[0] || ['none', 0];

    if (value <= 0) return null;

    const map = {
      learning: 'learning',
      work: 'career',
      discovery: 'exploration',
      creation: 'creation',
      planning: 'planning',
      social: 'social'
    };

    return map[name] || name;
  }

  #determinePhase({ signals, activityCount }) {
    if (activityCount === 0) {
      return 'initial';
    }

    const values = Object.values(signals);
    const maxSignal = Math.max(...values);

    if (maxSignal >= 70) {
      return 'active';
    }

    if (maxSignal >= 35) {
      return 'exploration';
    }

    if (activityCount >= 3) {
      return 'forming';
    }

    return 'initial';
  }

  #calculateMomentum({ signals, activityCount }) {
    const values = Object.values(signals);
    const strongest = Math.max(...values);

    const activityBonus = Math.min(30, activityCount * 3);

    return Math.max(
      0,
      Math.min(
        100,
        Math.round((strongest * 0.7) + activityBonus)
      )
    );
  }

  #calculateConfidence({ source, signals, activityCount }) {
    let score = 0;

    if (activityCount > 0) score += 25;
    if (source.skills?.length) score += 20;
    if (source.interests?.length) score += 15;
    if (source.opportunities?.length) score += 20;
    if (source.goals?.length) score += 10;

    const activeSignals =
      Object.values(signals)
        .filter((value) => value > 0)
        .length;

    score += Math.min(10, activeSignals * 2);

    return Math.max(
      0,
      Math.min(100, score)
    );
  }

  #determineDirection({ focus, phase, signals }) {
    if (!focus) {
      return null;
    }

    /*
     * RELATIONAL INTERPRETATION
     *
     * A strong learning signal combined with a strong
     * work signal represents career development rather
     * than isolated skill development.
     *
     * This rule intentionally runs before focus-specific
     * interpretation because the strongest individual
     * signal alone is not sufficient to describe trajectory.
     */
    const careerDevelopment =
      signals.learning >= 60 &&
      signals.work >= 50;

    if (careerDevelopment) {
      return 'career-development';
    }

    if (focus === 'career') {
      if (signals.learning >= signals.work) {
        return 'career-development';
      }

      return 'career-action';
    }

    if (focus === 'learning') {
      return 'skill-development';
    }

    if (focus === 'exploration') {
      return 'discovery';
    }

    if (focus === 'creation') {
      return 'creative-production';
    }

    if (focus === 'planning') {
      return 'planning';
    }

    if (focus === 'social') {
      return 'social-engagement';
    }

    return `${phase}-${focus}`;
  }

  #determineAlternatives({ focus, signals }) {
    const alternatives = [];

    const ranked = Object.entries(signals)
      .filter(
        ([name, value]) =>
          name !== this.#signalForFocus(focus) &&
          value > 0
      )
      .sort((a, b) => b[1] - a[1]);

    for (const [name, value] of ranked.slice(0, 3)) {
      alternatives.push({
        direction: this.#directionForSignal(name),
        strength: value
      });
    }

    return alternatives;
  }

  #signalForFocus(focus) {
    const map = {
      learning: 'learning',
      career: 'work',
      exploration: 'discovery',
      creation: 'creation',
      planning: 'planning',
      social: 'social'
    };

    return map[focus] || null;
  }

  #directionForSignal(signal) {
    const map = {
      learning: 'skill-development',
      work: 'career-action',
      discovery: 'discovery',
      creation: 'creative-production',
      planning: 'planning',
      social: 'social-engagement'
    };

    return map[signal] || signal;
  }

  #buildTrajectorySignals(signals) {
    return Object.entries(signals)
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, strength]) => ({
        name,
        strength
      }));
  }
}

export function createContextInterpreter() {
  return new ContextInterpreter();
}
