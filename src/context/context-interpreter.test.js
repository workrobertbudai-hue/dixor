import { describe, it, expect } from 'vitest';
import { ContextInterpreter } from './context-interpreter.js';

function createContext(overrides = {}) {
  return {
    currentState: {
      phase: 'initial',
      focus: null,
      momentum: 0,
      confidence: 0
    },

    activity: {
      recent: [
        { id: '1', type: 'LEARN_SESSION' },
        { id: '2', type: 'JOB_TRACKED' },
        { id: '3', type: 'DISCOVERY' }
      ]
    },

    interests: ['Spanish'],
    goals: [],
    skills: ['spanish'],
    opportunities: [
      { id: 'job-1', type: 'APPLICATION' }
    ],

    trajectory: {
      direction: null,
      signals: [],
      alternatives: []
    },

    signals: {
      learning: 70,
      work: 50,
      discovery: 20,
      creation: 0,
      planning: 0,
      social: 0
    },

    ...overrides
  };
}

describe('ContextInterpreter', () => {

  it('interprets the strongest signal as the current focus', () => {
    const interpreter = new ContextInterpreter();

    const result = interpreter.interpret(
      createContext()
    );

    expect(result.currentState.focus).toBe('learning');
  });

  it('derives an active phase from strong signals', () => {
    const interpreter = new ContextInterpreter();

    const result = interpreter.interpret(
      createContext()
    );

    expect(result.currentState.phase).toBe('active');
  });

  it('calculates momentum from signals and activity', () => {
    const interpreter = new ContextInterpreter();

    const result = interpreter.interpret(
      createContext()
    );

    expect(result.currentState.momentum).toBeGreaterThan(0);
    expect(result.currentState.momentum).toBeLessThanOrEqual(100);
  });

  it('calculates contextual confidence', () => {
    const interpreter = new ContextInterpreter();

    const result = interpreter.interpret(
      createContext()
    );

    expect(result.currentState.confidence).toBeGreaterThan(0);
    expect(result.currentState.confidence).toBeLessThanOrEqual(100);
  });

  it('derives career development direction when learning supports career', () => {
    const interpreter = new ContextInterpreter();

    const result = interpreter.interpret(
      createContext({
        signals: {
          learning: 80,
          work: 70,
          discovery: 10,
          creation: 0,
          planning: 0,
          social: 0
        }
      })
    );

    expect(result.trajectory.direction)
      .toBe('career-development');
  });

  it('creates ranked trajectory signals', () => {
    const interpreter = new ContextInterpreter();

    const result = interpreter.interpret(
      createContext()
    );

    expect(result.trajectory.signals.length)
      .toBeGreaterThan(0);

    expect(result.trajectory.signals[0].name)
      .toBe('learning');

    expect(result.trajectory.signals[0].strength)
      .toBe(70);
  });

});
