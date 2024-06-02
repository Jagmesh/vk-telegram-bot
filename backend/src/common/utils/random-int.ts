export function randomInt(from: number, to: number): number {
  if (from >= to) return 0;
  return Math.floor(Math.random() * (to - from + 1)) + from;
}
