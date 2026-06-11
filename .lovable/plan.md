# Rebuild Temple Dash (Full Clone)

The current game has bars floating above the player so nothing actually hits you. We're going to scrap the gameplay layer and rebuild it as a real 3-lane endless runner in true 3D, matching the Base44 reference (voxel character, dim corridor, coins, HUD, Game Over screen, shop).

Scope is the full clone: gameplay + shop + power-ups + best score + sound + swipe controls.

## What you'll be able to do

- Run forward automatically down a 3-lane corridor that speeds up over time
- **Swipe up** to jump, **swipe down** to slide, **swipe left/right** to change lanes
- Dodge four obstacle types that actually collide with you:
  - Low bars at head height → must slide under
  - Hurdles at foot height → must jump over
  - Full-lane blockers (walls/boulders) → must switch lanes
  - Moving hazards (swinging bars / spinning saws) → timing-based
- Collect coins along the track (lane-aligned, in arcs and lines)
- Grab power-ups: **Magnet** (pulls coins), **Shield** (one free hit), **2x Coins**, **Boost** (temporary speed + invincibility)
- See live Score, Distance, Coins, and active power-up timers in the HUD
- Die on collision → Game Over screen with Score, Distance, Coins, Best Score, Play Again, Main Menu, Visit Shop
- Spend coins in the Shop on characters/skins and power-up upgrades (start-with-shield, longer magnet, etc.)
- Hear footsteps, coin pickups, jump/slide whooshes, crash, and power-up SFX
- Progress saves locally for guests and syncs to the cloud when signed in (already wired via `useProfile`)

## On-screen hints

The JUMP / LEFT / SLIDE / RIGHT labels stay as a non-interactive legend at the bottom (like Base44) showing what swipes do. They don't need to be tappable.

## How it's built (technical)

**Renderer:** Three.js via `@react-three/fiber` + `@react-three/drei`. New deps to install: `three`, `@react-three/fiber`, `@react-three/drei`.

**Replace the existing engine.** `GameEngine.ts` was the source of the broken bar collisions. The new structure under `src/components/game/`:

```text
game/
  Game.tsx               ← <Canvas> + game loop, owns runtime state
  scene/
    Corridor.tsx         ← tiling floor + walls + pillars, scrolls toward camera
    Player.tsx           ← voxel character, jump/slide/lane-change animation
    Obstacle.tsx         ← bar | hurdle | blocker | swinging | saw
    Coin.tsx             ← spinning coin with magnet attraction
    PowerUp.tsx          ← magnet | shield | 2x | boost pickup
    Lighting.tsx         ← warm torch lights matching Base44 vibe
  systems/
    useGameLoop.ts       ← per-frame tick: speed, spawn, despawn, collisions
    spawner.ts           ← procedural chunk spawner (pattern templates so it's fair)
    collision.ts         ← AABB checks in player-local space; respects jump/slide state
    input.ts             ← swipe gesture detection (pointer events, with keyboard fallback)
    constants.ts         ← LANE_X, GRAVITY, JUMP_V, SLIDE_DURATION, START_SPEED, MAX_SPEED, SPEED_RAMP
  state/
    useGameStore.ts      ← zustand store: status, score, distance, coins, activePowerUps, best
```

**Collision model (the fix for the floating bars):**
- Player hitbox is a capsule that shrinks vertically while sliding and rises while jumping.
- Each obstacle declares a 3D AABB at its real world height. A low bar's box sits at head height — if you don't slide, you collide. A hurdle's box sits at foot height — if you don't jump, you collide.
- Collision is checked in the player's local Z slice each frame, not by spawning bars "above" the player.

**Spawner:** chunks are 20m segments picked from a small library of hand-authored safe patterns (e.g. "hurdle in lane 2, coin arc lane 1", "low bar across all lanes, slide window"). Guarantees every spawn is dodgeable. Difficulty ramps by speed, not by unfair spawns.

**Controls:** `input.ts` listens for `pointerdown`/`pointerup`, computes dx/dy, and emits `jump | slide | left | right` if the swipe passes a threshold. Arrow keys / WASD wired as desktop fallback. The bottom legend is pure presentation.

**Shop:** keep existing `src/components/shop/` and `src/routes/shop.tsx`. Wire purchased character skin into `Player.tsx` via the profile. Power-up upgrades stored on the profile and read by the spawner / power-up system.

**Persistence:** keep `useProfile` as-is. Best score, coins, owned skins, upgrades all flow through it (guest = localStorage, signed-in = cloud).

**Routes:** no changes — `/` is the game, `/shop` is the shop, `/auth` unchanged.

## Files

- Install: `three`, `@react-three/fiber`, `@react-three/drei`
- Delete: `src/components/game/GameEngine.ts` (broken), `MobileControls.tsx` (replaced by swipe + legend)
- New: everything under `src/components/game/scene/`, `systems/`, `state/`, plus `Game.tsx`
- Edit: `src/routes/index.tsx` to mount `<Game />`, `GameHUD.tsx` to read from the new store, `GameOver.tsx` to read final stats from the store, `StartScreen.tsx` unchanged except wiring the new start action
- Keep: `PowerUpHUD.tsx`, `PowerUpActivationFlash.tsx`, `TripOverlay.tsx`, `SwipeFlash.tsx`, `CharacterSelect.tsx`, `TiltIndicator.tsx` (wire to new store)

## Out of scope for this pass

- Multiplayer / leaderboards
- New 3D character models beyond simple voxel/box-built characters (the current "guy with hat" look)
- Procedurally generated environments beyond the corridor theme

If you want a second biome (e.g. outdoor temple) we can add it after the core feels right.
