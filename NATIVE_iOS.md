# Native iOS wrapper (Capacitor)

Temple Dash ships to iOS via [Capacitor](https://capacitorjs.com). The native shell loads the published web app at `https://templedash.lovable.app` — every Lovable deploy updates the app instantly with no resubmission (subject to App Store guidelines).

## One-time setup (Mac required)

```bash
# 1. Make sure deps are installed
bun install

# 2. Add the iOS native project (creates an `ios/` folder)
npx cap add ios

# 3. Open in Xcode
npx cap open ios
```

In Xcode: pick your Apple Team under **Signing & Capabilities**, then Run on a device or simulator.

## After web changes

Because the shell loads the live URL, you usually don't need to rebuild the native app. If you switch to bundling assets (set `webDir` to a local build, drop `server.url` in `capacitor.config.ts`) then run:

```bash
bun run build           # produces dist/
npx cap sync ios        # copies web assets + plugins into the iOS project
npx cap open ios
```

## Plugins wired

- `@capacitor/status-bar` — dark status bar matching the app background
- `@capacitor/splash-screen` — 1.2s launch screen, hidden after first paint
- `@capacitor/haptics` — call `haptic("light" | "medium" | "success" | …)` from `src/lib/native.ts` anywhere in the game (no-op on web)

## In-App Purchases (later)

Apple requires IAP for digital goods. When you're ready, use a Capacitor IAP plugin (e.g. `@revenuecat/purchases-capacitor`) and set up products in App Store Connect. No code wired yet.

## App identity

- App name: **Temple Dash**
- Bundle ID: **com.templedash.app**

Change these in `capacitor.config.ts` and re-run `npx cap sync ios`.
