import { createContextState } from './context-state.js';

export class ContextCollector {
  constructor(stateStore, contextState = createContextState()) {
    this.stateStore = stateStore;
    this.context = contextState;
  }

  collect() {
    this.collectActivity();
    this.collectLearning();
    this.collectWork();
    this.collectDiscovery();
    this.collectSignals();

    return this.context.get();
  }

  collectActivity() {
    const constellation =
      this.stateStore.getKV('constellation', []);

    constellation.forEach((event) => {
      if (!event) return;

      this.context.addActivity({
        id: event.id,
        type: event.t || 'EVENT',
        source: 'constellation',
        label: event.label || '',
        at: event.at || Date.now()
      });
    });

    const discoveryJournal =
      this.stateStore.getKV('discoveryJournal', []);

    discoveryJournal.forEach((item) => {
      if (!item) return;

      this.context.addActivity({
        id: item.id,
        type: 'DISCOVERY',
        source: 'discovery',
        label: item.q || '',
        at: item.at || Date.now()
      });
    });
  }

  collectLearning() {
    const progress = this.stateStore.getLearnProgress();

    if (!progress) return;

    Object.keys(progress).forEach((language) => {
      const data = progress[language];

      if (!data) return;

      const known =
        Array.isArray(data.known)
          ? data.known.length
          : 0;

      if (known > 0) {
        this.context.addSkill(language);
      }
    });
  }

  collectWork() {
    const applications =
      this.stateStore.getApplications();

    if (!Array.isArray(applications)) return;

    applications.forEach((application) => {
      if (!application) return;

      this.context.addOpportunity({
        id: application.id,
        type: 'APPLICATION',
        source: 'work',
        at: application.at || Date.now()
      });
    });
  }

  collectDiscovery() {
    const journal =
      this.stateStore.getKV('discoveryJournal', []);

    if (!Array.isArray(journal)) return;

    journal.forEach((item) => {
      if (!item || !item.q) return;

      this.context.addInterest(item.q);
    });
  }

  collectSignals() {
    const constellation =
      this.stateStore.getKV('constellation', []);

    if (!Array.isArray(constellation)) return;

    const counts = {};

    constellation.forEach((event) => {
      if (!event || !event.t) return;

      counts[event.t] =
        (counts[event.t] || 0) + 1;
    });

    const total =
      Object.values(counts)
        .reduce((sum, value) => sum + value, 0);

    if (!total) return;

    const normalize = (value) =>
      Math.min(100, Math.round((value / total) * 100));

    this.context.setSignal(
      'learning',
      normalize(
        (counts.LEARN_SESSION || 0) +
        (counts.SKILL_FOUND || 0)
      )
    );

    this.context.setSignal(
      'work',
      normalize(
        (counts.JOB_TRACKED || 0) +
        (counts.APPLICATION || 0) +
        (counts.CAREER_STEP || 0)
      )
    );

    this.context.setSignal(
      'discovery',
      normalize(
        (counts.DISCOVERY || 0)
      )
    );

    this.context.setSignal(
      'creation',
      normalize(
        (counts.CREATION || 0)
      )
    );

    this.context.setSignal(
      'social',
      normalize(
        (counts.CHAT_JOINED || 0) +
        (counts.CHAT || 0)
      )
    );
  }

  getContext() {
    return this.context.get();
  }
}

export function createContextCollector(stateStore) {
  return new ContextCollector(stateStore);
}
