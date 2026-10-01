// Pure helpers for the course video step (client/src/components/lms/VideoStep.tsx).

/** Extract an 11-char YouTube id from watch?v=, youtu.be/, /embed/, /shorts/, /live/. */
export function youtubeIdFrom(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/**
 * A single poll may only credit real elapsed playback. A bigger forward jump
 * (or any backward jump) is a seek and earns nothing, so scrubbing to the end
 * never unlocks the exam. Rewatching counts, which is fine.
 */
export const MAX_CREDIT_PER_TICK_S = 2.5;

export function creditWatch(
  watchedSeconds: number,
  lastTime: number | null,
  now: number,
  playing: boolean,
): number {
  if (!playing || lastTime === null) return watchedSeconds;
  const delta = now - lastTime;
  return delta > 0 && delta <= MAX_CREDIT_PER_TICK_S ? watchedSeconds + delta : watchedSeconds;
}

export function watchedPercent(watchedSeconds: number, duration: number): number {
  if (!(duration > 0)) return 0;
  return Math.min(100, Math.round((watchedSeconds / duration) * 100));
}
