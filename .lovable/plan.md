# Finalize iOS Local Build Setup

## Context
User confirmed they have a Mac and an Apple Developer account ($99/yr). Local Capacitor build is the chosen approach.

## What we will do

1. **Update NATIVE_iOS.md**
   - Remove the tentative "cloud build alternatives" language and state clearly that local Capacitor build is the recommended path.
   - Add a short section explaining *why* local is best for them (free after dev fee, full Xcode control, no third-party build service needed).
   - Keep all existing setup steps, Info.plist guidance, and plugin docs intact.

2. **Confirm capacitor.config.ts is ready**
   - `appId: "com.templedash.app"` and `appName: "Temple Dash"` are already set.
   - `server.url` points to the live published site — this is correct for OTA updates without resubmission.
   - No changes needed; just verify in the doc that these values are final.

3. **Add App Store submission checklist to NATIVE_iOS.md**
   - App Store Connect listing reminders (screenshots, description, keywords, support/privacy URLs).
   - Build → Archive → Distribute via Xcode steps.
   - Reminder to add `NSMotionUsageDescription` in Info.plist before first upload.

## Out of scope
- No new dependencies or plugins.
- No code changes to the game itself.
- No Capacitor IAP wiring (user said "later" in the doc).

## Expected result
A single, authoritative NATIVE_iOS.md that the user can follow start-to-finish to build, archive, and submit Temple Dash to the App Store from their Mac.