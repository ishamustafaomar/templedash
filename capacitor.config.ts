import type { CapacitorConfig } from "@capacitor/cli";

// Temple Dash — iOS wrapper.
// The app is server-rendered on Cloudflare, so the native shell loads
// the published web app directly. Switch `server.url` to your preview
// URL while testing pre-release changes, or remove `server` and point
// `webDir` at a static export if you ship offline-first later.
const config: CapacitorConfig = {
  appId: "com.templedash.app",
  appName: "Temple Dash",
  webDir: "dist",
  server: {
    url: "https://templedash.lovable.app",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0f172a",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#0f172a",
      showSpinner: false,
      iosSpinnerStyle: "small",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0f172a",
      overlaysWebView: false,
    },
  },
};

export default config;
