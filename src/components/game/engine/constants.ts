export const LANE_WIDTH = 2.2;
export const LANE_X = [-LANE_WIDTH, 0, LANE_WIDTH] as const;

// Player physics
export const PLAYER_HEIGHT = 1.8;
export const PLAYER_HALF_WIDTH = 0.5;
export const PLAYER_SLIDE_HEIGHT = 0.9;
export const GRAVITY = 38;
export const JUMP_VELOCITY = 12;
export const SLIDE_DURATION = 0.7; // seconds
export const LANE_CHANGE_DURATION = 0.12; // seconds — snappy at high speed

// World
export const START_SPEED = 14; // units / sec
export const MAX_SPEED = 38;
export const SPEED_RAMP = 0.25; // units / sec / sec
export const SPAWN_AHEAD = 140; // spawn things this far ahead
export const DESPAWN_BEHIND = 8;

// Spawner
export const CHUNK_LENGTH = 22;

// Camera
export const CAMERA_POS: [number, number, number] = [0, 4.2, 7];
export const CAMERA_LOOK: [number, number, number] = [0, 1.2, -4];

// Power-up base durations (seconds)
export const POWERUP_BASE_DUR = {
  shield: 0,         // shield is a one-hit; timer not used
  magnet: 6,
  speed: 3,
  invincibility: 4,
} as const;
