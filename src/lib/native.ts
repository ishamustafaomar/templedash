// Thin wrapper around Capacitor plugins. All calls are no-ops on the web
// so the same code runs in the browser and inside the iOS shell.
import { Capacitor } from "@capacitor/core";

export const isNative = () => Capacitor.isNativePlatform();

export async function initNativeShell() {
  if (!isNative()) return;
  try {
    const [{ StatusBar, Style }, { SplashScreen }] = await Promise.all([
      import("@capacitor/status-bar"),
      import("@capacitor/splash-screen"),
    ]);
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#0f172a" });
    await SplashScreen.hide();
  } catch (err) {
    console.warn("[native] init failed", err);
  }
}

export type HapticStrength = "light" | "medium" | "heavy" | "success" | "warning" | "error";

export async function haptic(kind: HapticStrength = "light") {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle, NotificationType } = await import("@capacitor/haptics");
    switch (kind) {
      case "light": return Haptics.impact({ style: ImpactStyle.Light });
      case "medium": return Haptics.impact({ style: ImpactStyle.Medium });
      case "heavy": return Haptics.impact({ style: ImpactStyle.Heavy });
      case "success": return Haptics.notification({ type: NotificationType.Success });
      case "warning": return Haptics.notification({ type: NotificationType.Warning });
      case "error": return Haptics.notification({ type: NotificationType.Error });
    }
  } catch {
    /* noop */
  }
}
