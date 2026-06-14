import { useEffect } from "react";
import { useGameStore } from "./store";

const TILT_THRESHOLD = 12; // degrees of gamma to trigger a lane change
const COOLDOWN_MS = 280;

export function useTiltInput(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;

    let lastMove = 0;
    let neutral = true;

    const onOrient = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0; // left/right tilt in degrees
      const now = performance.now();
      if (Math.abs(gamma) < TILT_THRESHOLD / 2) {
        neutral = true;
        return;
      }
      if (!neutral) return;
      if (now - lastMove < COOLDOWN_MS) return;
      if (Math.abs(gamma) < TILT_THRESHOLD) return;
      const st = useGameStore.getState();
      if (gamma > 0) st.moveRight(); else st.moveLeft();
      lastMove = now;
      neutral = false;
    };

    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, [enabled]);
}

export async function requestTiltPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return false;
  const AnyDOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<"granted" | "denied"> };
  if (typeof AnyDOE.requestPermission === "function") {
    try {
      const res = await AnyDOE.requestPermission();
      return res === "granted";
    } catch {
      return false;
    }
  }
  return true;
}
