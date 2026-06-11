# Guest Mode + Fix Email Sign-In

## How other mobile games do it
Most mobile games save progress **locally on the device** (the equivalent of `localStorage` in a web game). No account is required — the save data just lives on that phone. The trade-off: progress is lost if the player clears their browser data or switches devices. That's why games offer an *optional* "sign in to back up your progress" later. We'll implement this same pattern.

## What I'll change

### 1. Guest mode (play instantly, no sign-in)
- Move the game and shop out of the login-required area so anyone can play immediately.
- Create a local save system: high score, coins, and all shop upgrades stored on the device.
- The game works identically for guests — scores, coins, and shop purchases all persist locally.
- The auth page becomes optional: a "Play as Guest" path is the default, with sign-in offered as "back up your progress to the cloud."

### 2. Progress sync on sign-in
- When a guest later creates an account, their local progress (high score, coins, upgrades) is automatically merged into their cloud profile — they keep the best of both.

### 3. Fix email & password sign-up
- Right now, new sign-ups require clicking a confirmation email before the session activates — so signing up appears to "not work" (you're bounced back to the login screen). I'll enable instant account activation so email/password works immediately.
- Better error messages on the auth form so failures are visible.

### 4. Remove Apple sign-in
- The Apple button is removed since the managed flow mentions Lovable. Auth options become: **Guest (default)** and **Email & Password**.

## Technical details
- Local saves: a `useLocalProfile` hook backed by `localStorage`, mirroring the cloud profile shape (high_score, total_coins, upgrade levels, consumables).
- Routes: game moves from `/_authenticated/` to public `/`; shop to public `/shop`. The `_authenticated` layout is removed. The game page picks cloud profile when signed in, local profile otherwise.
- Sign-in merge: on first authenticated load, compare local vs cloud values (max of high scores, sum-safe handling of coins, max of upgrade levels), write merged result to the cloud profile, then clear the local save.
- Auth config: enable auto-confirm email signups; disable the Apple provider.
