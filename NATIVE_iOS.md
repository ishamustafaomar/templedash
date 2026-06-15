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

## Required Info.plist keys (App Store submission)

Apple will reject the build if you touch the motion sensors without a usage-description string. Temple Dash's *Tilt steering* uses the gyroscope, so before submitting, open `ios/App/App/Info.plist` in Xcode and add:

```xml
<key>NSMotionUsageDescription</key>
<string>Temple Dash uses motion sensors only while you are actively playing, so you can switch lanes by tilting your phone. Motion data is processed on-device and never leaves your phone.</string>
```

Other Apple-required listing items handled outside the repo:
- **Privacy nutrition label** in App Store Connect — declare *Identifiers (User ID)* and *Other Usage Data (gameplay stats)*, both linked to your account, not used for tracking.
- **Support URL**: `https://templedash.fun/`
- **Marketing URL**: `https://templedash.fun/`
- **Privacy Policy URL**: `https://templedash.fun/privacy`



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
