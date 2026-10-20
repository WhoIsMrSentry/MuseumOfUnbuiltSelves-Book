export const MOBILE_MQ = '(max-width: 639px)';
export const BAT_COUNT = 8;
export const BAT_WING_CYCLE_MS = 400;
export const BAT_SPAWN_INTERVAL_MS = 500;
export const BAT_TRANSITION_MS = 5000;
export const BAT_NAVIGATE_DELAY_MS = BAT_TRANSITION_MS - 500;

export function shouldUseBatTransition() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
