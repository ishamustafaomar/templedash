import { describe, expect, test } from "bun:test";
import { levelCost, nearestUpgrade, upgradeDetails, type UpgradeProfile } from "./upgrade-goals";

const profile: UpgradeProfile = {
  total_coins: 50, shield_level: 1, magnet_level: 1, speed_level: 1,
  invincibility_level: 1, coin_multiplier: false, head_start: false,
};

describe("upgrade goals", () => {
  test("50 coins leaves 100 more toward the visible 150-coin upgrade", () => {
    expect(upgradeDetails("shield_level", profile)).toMatchObject({ cost: 150, remaining: 100 });
  });
  test("next durations match the existing base plus two seconds per upgrade", () => {
    expect(["shield_level", "magnet_level", "speed_level", "invincibility_level"].map(
      (field) => upgradeDetails(field as "shield_level", profile)?.nextDuration,
    )).toEqual([6, 8, 5, 6]);
  });
  test("affordable goals take priority and need no more coins", () => {
    expect(nearestUpgrade({ ...profile, total_coins: 350, shield_level: 5 })).toMatchObject({ field: "magnet_level", cost: 150, remaining: 0 });
  });
  test("saving goal selects the smallest coin gap", () => {
    expect(nearestUpgrade({ ...profile, shield_level: 4 })).toMatchObject({ field: "magnet_level", remaining: 100 });
  });
  test("owned and max-level upgrades are excluded", () => {
    expect(nearestUpgrade({ ...profile, shield_level: 5, magnet_level: 5, speed_level: 5, invincibility_level: 5, coin_multiplier: true, head_start: true })).toBeNull();
    expect(levelCost(5)).toBeNull();
  });
  test("one-time upgrades retain their existing prices", () => {
    expect(upgradeDetails("coin_multiplier", profile)?.cost).toBe(500);
    expect(upgradeDetails("head_start", profile)?.cost).toBe(350);
  });
});