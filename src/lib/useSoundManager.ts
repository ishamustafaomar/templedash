import { useRef, useCallback } from "react";

type SoundName =
  | "coin"
  | "shield"
  | "magnet"
  | "speed"
  | "invincibility"
  | "shieldBreak"
  | "collision"
  | "trip"
  | "jump"
  | "slide";

export function useSoundManager() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC = (window.AudioContext || (window as any).webkitAudioContext) as
        | typeof AudioContext
        | undefined;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  };

  const tone = (
    ctx: AudioContext,
    freq: number,
    dur: number,
    type: OscillatorType = "sine",
    vol = 0.18,
    slide = 0,
  ) => {
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  };

  const noise = (ctx: AudioContext, dur: number, vol = 0.2) => {
    const t0 = ctx.currentTime;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(gain).connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  };

  const play = useCallback((name: SoundName) => {
    const ctx = getCtx();
    if (!ctx) return;
    switch (name) {
      case "coin":
        tone(ctx, 880, 0.08, "triangle", 0.15);
        tone(ctx, 1320, 0.12, "triangle", 0.12, 200);
        break;
      case "shield":
        tone(ctx, 220, 0.4, "sine", 0.18, 180);
        tone(ctx, 440, 0.25, "triangle", 0.12);
        break;
      case "magnet":
        tone(ctx, 660, 0.18, "square", 0.1, 220);
        tone(ctx, 990, 0.18, "triangle", 0.1, 220);
        break;
      case "speed":
        tone(ctx, 300, 0.25, "sawtooth", 0.15, 600);
        break;
      case "invincibility":
        tone(ctx, 440, 0.35, "triangle", 0.18, 440);
        tone(ctx, 660, 0.35, "sine", 0.14, 440);
        break;
      case "shieldBreak":
        noise(ctx, 0.25, 0.18);
        tone(ctx, 180, 0.18, "square", 0.16, -120);
        break;
      case "collision":
        noise(ctx, 0.5, 0.3);
        tone(ctx, 110, 0.45, "sawtooth", 0.2, -60);
        break;
      case "trip":
        tone(ctx, 200, 0.3, "square", 0.18, -120);
        noise(ctx, 0.2, 0.15);
        break;
      case "jump":
        tone(ctx, 440, 0.12, "sine", 0.14, 220);
        break;
      case "slide":
        noise(ctx, 0.15, 0.12);
        break;
    }
  }, []);

  return { play };
}
