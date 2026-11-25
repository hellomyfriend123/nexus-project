// Lucian UX/UI Prompt #363 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#363
export type DotWave = { x: number; y: number; t: number; a: number };

/** Original #363 interference envelope, in viewport CSS pixels and milliseconds. */
export function dotWaveHeight(x: number, y: number, now: number, waves: readonly DotWave[]) {
  let h = 0;
  for (const wave of waves) {
    const age = (now - wave.t) / 1000;
    if (age < 0 || age >= 2.6) continue;
    const k = Math.hypot(x - wave.x, y - wave.y) - age * 170;
    if (k > 0 || k < -90) continue;
    h += Math.sin(k / 14) * Math.exp(k / 60) * wave.a * Math.exp(-age * 1.3);
  }
  return Math.max(-1, Math.min(1.6, h));
}
