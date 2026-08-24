import MODULES from '../data/modules.json';

export { MODULES };
export const CORE = MODULES.core;
export const MODULE_LIST = MODULES.modules;

// Kozosseg-funkcio minden modulnak - tematikus chat szobak
MODULE_LIST.forEach((m) => {
  if (!m.functions.includes('Community Chat')) m.functions.push('Community Chat');
});

export function getModuleById(id) {
  return MODULE_LIST.find((m) => m.id === id) ?? null;
}