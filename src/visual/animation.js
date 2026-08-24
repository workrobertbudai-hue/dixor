/** Egyszerű easing-gyűjtemény a kamerarepülésekhez. */
export const Easing = {
  linear: (t) => t,
  cubicOut: (t) => 1 - Math.pow(1 - t, 3),
  cubicInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
};
