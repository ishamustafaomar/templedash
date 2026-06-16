# Native iOS wrapper (Capacitor)

Temple Dash ships to iOS via [Capacitor](https://capacitorjs.com). The native shell loads the published web app at `https://templedash.lovable.app` — every Lovable deploy updates the app instantly with no resubmission (subject to App Store guidelines).

## Build approach: local on your Mac

You have a Mac and an Apple Developer account, so the simplest, cheapest, and most reliable path is **building locally in Xcode**. No third-party cloud build service is needed.

Why local is the right call here:
- **Free** beyond your $99/yr Apple Developer fee — no Codemagic/Appflow subscription.
- **Full Xcode control** for signing, provisioning, simulator runs, TestFlight uploads, and archive distribution.
- **Fast iteration** — rebuild and re-run on a connected device or simulator in seconds.
- **No external service** sitting between your code and Apple.

## One-time setup

```bash
# 1. Make sure deps are installed
bun install

# 2. Add the iOS native project (creates an `ios/` folder)
npx cap add ios

# 3. Open in Xcode
npx cap open ios
```

In Xcode: pick your Apple Team under **Signing & Capabilities**, then Run on a device or simulator.

## App identity (already configured)

In `capacitor.config.ts`:
- App name: **Temple Dash**
- Bundle ID: **com.templedash.app**
- `server.url`: `https://templedash.lovable.app` — the native shell loads the live web app, so a Lovable redeploy ships instantly to users without an App Store resubmission.

If you change `appId` or `appName`, re-run `npx cap sync ios`.

## Required Info.plist keys (App Store submission)

Apple will reject the build if you touch the motion sensors without a usage-description string. Temple Dash's *Tilt steering* uses the gyroscope, so before submitting, open `ios/App/App/Info.plist` in Xcode and add:

```xml
<key>NSMotionUsageDescription</key>
<string>Temple Dash uses motion sensors only while you are actively playing, so you can switch lanes by tilting your phone. Motion data is processed on-device and never leaves your phone.</string>
```

## App Store submission checklist

### In App Store Connect (web)
- Create the app record with bundle ID `com.templedash.app`.
- **Listing copy**: title, subtitle, promotional text, keywords (comma-separated, ~100 chars), short + long description. Pull from the optimized copy already in the project.
- **Screenshots**: required sizes — 6.7" iPhone (1290×2796) and 6.5" iPhone (1242×2688). iPad screenshots only if you ship for iPad.
- **App icon**: 1024×1024 PNG, no transparency, no rounded corners (Apple rounds them).
- **Support URL**: `https://templedash.fun/`
- **Marketing URL**: `https://templedash.fun/`
- **Privacy Policy URL**: `https://templedash.fun/privacy`
- **Privacy nutrition label**: declare *Identifiers (User ID)* and *Other Usage Data (gameplay stats)*, both linked to your account, **not used for tracking**.
- **Age rating**: complete the questionnaire (likely 4+ for an endless runner with no objectionable content).
- **Category**: Games → Action (primary), Arcade (secondary).

### In Xcode (build and upload)
1. Confirm `NSMotionUsageDescription` is in `Info.plist`.
2. Set the version (e.g. `1.0.0`) and build number (increment each upload).
3. Select **Any iOS Device (arm64)** as the run destination.
4. **Product → Archive**.
5. In the Organizer window: **Distribute App → App Store Connect → Upload**.
6. Wait for processing (5–30 min), then assign the build to your TestFlight or App Store version in App Store Connect.

### Before hitting Submit for Review
- Test once via TestFlight on a real device.
- Verify the live URL loads cleanly inside the native shell (no mixed content, no broken auth redirects).
- Make sure the privacy policy URL resolves publicly.

## After web changes

Because the shell loads the live URL, you usually don't need to rebuild the native app — a Lovable redeploy is enough.

Only rebuild + resubmit if you:
- Change Capacitor plugins or native config
- Bump the iOS version/build number for a feature requiring review
- Switch to bundling assets offline (set `webDir` to a local build, drop `server.url`):

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

Apple requires IAP for digital goods sold inside the app. When you're ready, use a Capacitor IAP plugin (e.g. `@revenuecat/purchases-capacitor`) and set up products in App Store Connect. No code wired yet.
