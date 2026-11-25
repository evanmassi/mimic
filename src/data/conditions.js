export const CONDITIONS = [
  {key: "blinded", name: "Blinded", effect: "Can't see. Attacks against you have advantage, yours have disadvantage."},
  {key: "charmed", name: "Charmed", effect: "Can't attack the charmer. They have advantage on social checks with you."},
  {key: "deafened", name: "Deafened", effect: "Can't hear. Fail any check that needs hearing."},
  {key: "frightened", name: "Frightened", effect: "Disadvantage on checks and attacks while the source is in sight. Can't move closer to it."},
  {key: "grappled", name: "Grappled", effect: "Speed 0.", isSpeedZero: true},
  {key: "incapacitated", name: "Incapacitated", effect: "No actions or reactions."},
  {key: "invisible", name: "Invisible", effect: "Attacks against you have disadvantage, yours have advantage."},
  {key: "paralyzed", name: "Paralyzed", effect: "Incapacitated, can't move or speak. Fail STR and DEX saves. Hits within 5 ft are crits.", isSpeedZero: true},
  {key: "petrified", name: "Petrified", effect: "Turned to stone. Incapacitated, resistant to all damage, immune to poison and disease.", isSpeedZero: true},
  {key: "poisoned", name: "Poisoned", effect: "Disadvantage on attack rolls and ability checks."},
  {key: "prone", name: "Prone", effect: "Crawl only. Disadvantage on attacks. Attacks within 5 ft have advantage, farther ones disadvantage."},
  {key: "restrained", name: "Restrained", effect: "Speed 0. Disadvantage on attacks and DEX saves. Attacks against you have advantage.", isSpeedZero: true},
  {key: "stunned", name: "Stunned", effect: "Incapacitated, can't move. Fail STR and DEX saves. Attacks against you have advantage.", isSpeedZero: true},
  {key: "unconscious", name: "Unconscious", effect: "Incapacitated and prone, drop what you hold. Fail STR and DEX saves. Hits within 5 ft are crits.", isSpeedZero: true},
  {key: "concentrating", name: "Concentrating", effect: "When you take damage, CON save of DC 10 or half the damage, whichever is higher."}
];

export const EXHAUSTION = [
  "Disadvantage on ability checks",
  "Speed halved",
  "Disadvantage on attacks and saves",
  "Hit point maximum halved",
  "Speed 0",
  "Death"
];

export const EXHAUSTION_SPEED_HALVED = 2;
export const EXHAUSTION_HP_HALVED = 4;
export const EXHAUSTION_SPEED_ZERO = 5;
