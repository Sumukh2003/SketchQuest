// Lightweight sound effects generated with the Web Audio API — no audio
// files needed, so nothing to load or license.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/**
 * Browsers only let an AudioContext actually produce sound if it was created
 * or resumed during a real user gesture (click/tap/key). Sounds triggered
 * later by a socket event (someone else joining, a guess coming in) don't
 * count as a gesture, so the very first attempt gets silently blocked.
 * Call this from an actual click handler (e.g. "Create Room") as early as
 * possible so the context is already unlocked by the time async events
 * need to play through it.
 */
export function unlockAudio() {
  getCtx();
}

const STORAGE_KEY = "sq_sound_enabled";

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // ignore (private browsing / storage blocked)
  }
}

type Tone = { freq: number; start: number; duration: number; gain?: number; type?: OscillatorType };

function playTones(tones: Tone[]) {
  if (!isSoundEnabled()) return;
  const audio = getCtx();
  if (!audio) return;

  tones.forEach(({ freq, start, duration, gain = 0.15, type = "sine" }) => {
    const osc = audio.createOscillator();
    const gainNode = audio.createGain();
    osc.type = type;
    osc.frequency.value = freq;

    const t0 = audio.currentTime + start;
    gainNode.gain.setValueAtTime(0, t0);
    gainNode.gain.linearRampToValueAtTime(gain, t0 + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gainNode);
    gainNode.connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  });
}

export const sounds = {
  join: () =>
    playTones([
      { freq: 440, start: 0, duration: 0.12, type: "triangle" },
      { freq: 660, start: 0.08, duration: 0.15, type: "triangle" },
    ]),

  leave: () =>
    playTones([
      { freq: 520, start: 0, duration: 0.12, type: "triangle", gain: 0.12 },
      { freq: 350, start: 0.08, duration: 0.16, type: "triangle", gain: 0.12 },
    ]),

  correctGuess: () =>
    playTones([
      { freq: 523, start: 0, duration: 0.12 },
      { freq: 659, start: 0.1, duration: 0.12 },
      { freq: 784, start: 0.2, duration: 0.22 },
    ]),

  wrongGuess: () =>
    playTones([
      { freq: 220, start: 0, duration: 0.16, type: "sawtooth", gain: 0.08 },
      { freq: 180, start: 0.1, duration: 0.2, type: "sawtooth", gain: 0.08 },
    ]),

  tick: () => playTones([{ freq: 880, start: 0, duration: 0.05, gain: 0.06, type: "square" }]),
};
