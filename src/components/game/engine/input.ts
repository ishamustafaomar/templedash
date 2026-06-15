import { useEffect } from "react";
import { useGameStore } from "./store";

const SWIPE_THRESHOLD = 30; // px

export function useGameInput(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const s = useGameStore.getState();

    // Keyboard
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": case " ": case "w": case "W": s.jump(); break;
        case "ArrowDown": case "s": case "S": s.slide(); break;
        case "ArrowLeft": case "a": case "A": s.moveLeft(); break;
        case "ArrowRight": case "d": case "D": s.moveRight(); break;
      }
    };

    // Touch / pointer swipes
    let startX = 0, startY = 0, startT = 0, tracking = false;
    const onDown = (e: PointerEvent) => {
      // ignore non-touch / non-primary
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startX = e.clientX; startY = e.clientY; startT = performance.now(); tracking = true;
    };
    const onUp = (e: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const dt = performance.now() - startT;
      if (dt > 700) return; // too slow
      const ax = Math.abs(dx), ay = Math.abs(dy);
      if (Math.max(ax, ay) < SWIPE_THRESHOLD) return;
      const st = useGameStore.getState();
      if (ax > ay) {
        if (dx > 0) st.moveRight(); else st.moveLeft();
      } else {
        if (dy > 0) st.slide(); else st.jump();
      }
    };

    const onCancel = () => { tracking = false; };

    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [enabled]);
}

