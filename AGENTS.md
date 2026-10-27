# Project conventions

- Keep upgrade-goal calculations in the browser-safe `src/lib/upgrade-goals.ts` module, shared by shop cards and game-over feedback, so prices and previews agree without changing gameplay or purchases.
- Test upgrade-goal rules with Bun's built-in test runner, avoiding extra test dependencies.