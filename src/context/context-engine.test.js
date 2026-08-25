import { describe, it, expect } from 'vitest';
import { ContextCollector } from './context-collector.js';

function createMockStateStore() {
  const kv = {
    constellation: [
      { id: '1', t: 'LEARN_SESSION', at: 1000 },
      { id: '2', t: 'JOB_TRACKED', at: 2000 },
      { id: '3', t: 'DISCOVERY', at: 3000 }
    ],
    discoveryJournal: [
      { id: 'd1', q: 'Spanish', at: 4000 }
    ]
  };

  return {
    getKV(key, fallback) {
      return kv[key] ?? fallback;
    },

    getApplications() {
      return [
        { id: 'job-1', at: 5000 }
      ];
    },

    getLearnProgress() {
      return {
        spanish: {
          known: ['hola', 'gracias', 'trabajo']
        }
      };
    }
  };
}

describe('ContextCollector', () => {

  it('creates context from existing DIXOR state', () => {
    const store = createMockStateStore();
    const collector = new ContextCollector(store);

    const context = collector.collect();

    expect(context).toBeDefined();
    expect(context.activity.recent.length).toBeGreaterThan(0);
    expect(context.skills).toContain('spanish');
    expect(context.interests).toContain('Spanish');
    expect(context.opportunities.length).toBe(1);
  });

  it('generates activity signals', () => {
    const store = createMockStateStore();
    const collector = new ContextCollector(store);

    const context = collector.collect();

    expect(context.signals.learning).toBeGreaterThan(0);
    expect(context.signals.work).toBeGreaterThan(0);
    expect(context.signals.discovery).toBeGreaterThan(0);
  });

});
