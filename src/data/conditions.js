export const CONDITIONS = [
  {key: "blinded", fx: "lids", name: "Blinded", effect: "Can't see. Attacks against you have advantage, yours have disadvantage.",
    rolls: {attack: "dis", foes: "adv"}},
  {key: "charmed", fx: "hearts", name: "Charmed", effect: "Can't attack the charmer. They have advantage on social checks with you."},
  {key: "deafened", fx: "hush", name: "Deafened", effect: "Can't hear. Fail any check that needs hearing."},
  {key: "frightened", fx: "dread", name: "Frightened", effect: "Disadvantage on checks and attacks while the source is in sight. Can't move closer to it.",
    rolls: {attack: "dis", check: "dis"}},
  {key: "grappled", fx: "clamp", name: "Grappled", effect: "Speed 0.", isSpeedZero: true},
  {key: "incapacitated", fx: "puff", name: "Incapacitated", effect: "No actions or reactions.", isIncapacitated: true},
  {key: "invisible", fx: "vanish", name: "Invisible", effect: "Attacks against you have disadvantage, yours have advantage.",
    rolls: {attack: "adv", foes: "dis"}},
  {key: "paralyzed", fx: "jolt", name: "Paralyzed", effect: "Incapacitated, can't move or speak. Fail STR and DEX saves. Hits within 5 ft are crits.", isSpeedZero: true,
    isIncapacitated: true, rolls: {saves: {str: "fail", dex: "fail"}, foes: "adv"}},
  {key: "petrified", fx: "crumble", name: "Petrified", effect: "Turned to stone. Incapacitated, resistant to all damage, immune to poison and disease.", isSpeedZero: true,
    isIncapacitated: true, rolls: {saves: {str: "fail", dex: "fail"}, foes: "adv"}},
  {key: "poisoned", fx: "bubbles", name: "Poisoned", effect: "Disadvantage on attack rolls and ability checks.",
    rolls: {attack: "dis", check: "dis"}},
  {key: "prone", fx: "thud", name: "Prone", effect: "Crawl only. Disadvantage on attacks. Attacks within 5 ft have advantage, farther ones disadvantage.",
    rolls: {attack: "dis", foes: "near"}},
  {key: "restrained", fx: "bind", name: "Restrained", effect: "Speed 0. Disadvantage on attacks and DEX saves. Attacks against you have advantage.", isSpeedZero: true,
    rolls: {attack: "dis", saves: {dex: "dis"}, foes: "adv"}},
  {key: "stunned", fx: "daze", name: "Stunned", effect: "Incapacitated, can't move. Fail STR and DEX saves. Attacks against you have advantage.", isSpeedZero: true,
    isIncapacitated: true, rolls: {saves: {str: "fail", dex: "fail"}, foes: "adv"}},
  {key: "unconscious", fx: "sleep", name: "Unconscious", effect: "Incapacitated and prone, drop what you hold. Fail STR and DEX saves. Hits within 5 ft are crits.", isSpeedZero: true, isAtZeroHp: true,
    isIncapacitated: true, rolls: {saves: {str: "fail", dex: "fail"}, foes: "adv"}},
  {key: "concentrating", fx: "focus", name: "Concentrating", effect: "When you take damage, CON save of DC 10 or half the damage, whichever is higher."}
];

export const EXHAUSTION = [
  "Disadvantage on ability checks",
  "Speed halved",
  "Disadvantage on attacks and saves",
  "Hit point maximum halved",
  "Speed 0",
  "Death"
];

export const EXHAUSTION_CHECKS_DISADVANTAGED = 1;
export const EXHAUSTION_SPEED_HALVED = 2;
export const EXHAUSTION_ROLLS_DISADVANTAGED = 3;
export const EXHAUSTION_HP_HALVED = 4;
export const EXHAUSTION_SPEED_ZERO = 5;
