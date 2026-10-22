type Vec3 = [number, number, number];
export interface StressParticle { position: Vec3; tail: Vec3; direction: number; opacity: number }

// 归一化坐标位于试件内部。粒子只表达轴向作用方向与应力强弱，速度不表示应力波速。
export function sampleStressFlow(stressMPa: number, timeSeconds: number): StressParticle[] {
  if (!Number.isFinite(stressMPa) || stressMPa === 0 || !Number.isFinite(timeSeconds)) return [];
  const intensity = 1 / (1 + 100 / Math.abs(stressMPa));
  const count = 2 + Math.floor(6 * intensity);
  const phase = (Math.max(0, timeSeconds) % 6.25) / 6.25;
  const particles: StressParticle[] = [];
  for (let row = 0; row < 4; row++) for (let depth = 0; depth < 3; depth++) {
    const lane = row * 3 + depth;
    for (let packet = 0; packet < count; packet++) for (const side of [-1, 1]) {
      const progress = (phase + packet / count + lane * .137) % 1;
      const distance = stressMPa > 0 ? progress : 1 - progress;
      const x = side * (.025 + .95 * distance);
      const y = (row - 1.5) * .44, z = (depth - 1) * .58;
      const direction = side * Math.sign(stressMPa);
      const tailX = Math.max(-.98, Math.min(.98, x - direction * .055));
      const fade = Math.min(1, distance / .09, (1 - distance) / .09);
      particles.push({ position: [x, y, z], tail: [tailX, y, z], direction, opacity: fade * Math.sqrt(intensity) });
    }
  }
  return particles;
}
