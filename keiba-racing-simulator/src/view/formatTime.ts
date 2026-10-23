export function formatTime(seconds: number): string {
  const tenths = Math.max(0, Math.round(seconds * 10));
  const mins = Math.floor(tenths / 600);
  const rem = tenths % 600;
  const secs = Math.floor(rem / 10);
  const tenth = rem % 10;
  return `${mins}:${String(secs).padStart(2, "0")}.${tenth}`;
}
