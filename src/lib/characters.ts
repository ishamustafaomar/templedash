export interface Character {
  id: string;
  name: string;
  title: string;
  description: string;
  ability: string;
  emoji: string;
  bodyColor: number;
  gearColor: number;
  accentColor: number;
  speedMultiplier: number;
  slideDurationMultiplier: number;
  themeColor: string;
}

export const CHARACTERS: Character[] = [
  {
    id: "explorer",
    name: "Amara",
    title: "The Explorer",
    description: "Seasoned tomb scout. Balanced and reliable on any path.",
    ability: "Balanced stats",
    emoji: "🗺️",
    bodyColor: 0xe8c170,
    gearColor: 0x8b6914,
    accentColor: 0xc8a050,
    speedMultiplier: 1.0,
    slideDurationMultiplier: 1.0,
    themeColor: "#e8c170",
  },
  {
    id: "warrior",
    name: "Khan",
    title: "The Warrior",
    description: "Born for the temple's traps. Heavy boots, longer slides.",
    ability: "Longer slides",
    emoji: "⚔️",
    bodyColor: 0xc87941,
    gearColor: 0xf0f0d8,
    accentColor: 0xe03030,
    speedMultiplier: 1.0,
    slideDurationMultiplier: 1.35,
    themeColor: "#e03030",
  },
  {
    id: "hunter",
    name: "Vex",
    title: "The Hunter",
    description: "Lightning-fast scavenger. Runs faster but unforgiving.",
    ability: "+10% speed",
    emoji: "🏹",
    bodyColor: 0x2a2a3a,
    gearColor: 0x1a1a28,
    accentColor: 0x00ff88,
    speedMultiplier: 1.1,
    slideDurationMultiplier: 1.0,
    themeColor: "#00ff88",
  },
];

export const getCharacter = (id: string): Character =>
  CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
