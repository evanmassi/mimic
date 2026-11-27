export const APP_VERSION = "0.1.0";

export const CHARACTER_KEY = "mimic.character.v1";
export const PLAY_KEY = "mimic.play.v1";
export const NOTES_KEY = "mimic.notes.v1";

export const HP_DRAG_FULL_SWIPE = 0.6;
export const HP_DRAG_TAP_PX = 6;
export const DRAWER_CLOSE_MS = 220;
export const TRAY_CLOSE_MS = 320;
export const UNDO_DEPTH = 5;
export const HP_STEPS = [1, 5, 10];
export const HIT_GROUP_MS = 2000;
export const CONCENTRATION_MIN_DC = 10;
export const DEATH_SAVE_COUNT = 3;
export const DRAW_LINE_WIDTH = 2.2;
export const HIT_BUZZ_MS = [30, 40, 30];
export const FALL_BUZZ_MS = [60, 40, 220];
export const ROLL_BUZZ_MS = [10, 20, 10, 20, 10, 20, 30];
// PITFALL: each crack's along is where its drawing in --texture-crack-N starts, as a share of the bar's width.
export const HP_CRACKS = [
  {at: 0.18, along: 0.84}, {at: 0.32, along: 0.05}, {at: 0.46, along: 0.79},
  {at: 0.6, along: 0.28}, {at: 0.74, along: 0.98}, {at: 0.88, along: 0.43}
];
export const SCORE_MIN = 1;
export const SCORE_MAX = 30;
export const SPELL_RESULT_LIMIT = 60;
export const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
export const HOMEMADE_SPELL_LEVEL = 1;
export const MAX_SPELL_LEVEL = 9;
export const ATTACK_ABILITIES = ["str", "dex"];
export const NEW_ATTACK = {name: "New attack", ability: "str", magicBonus: 0, damageDice: "1d6", damageBonus: 0, damageType: "B"};

export const COINS = ["cp", "sp", "ep", "gp", "pp"];
export const RECHARGE_LABEL = {short: "short rest", long: "long rest"};
export const ROLL_LABEL = {adv: "Adv.", dis: "Disadv.", fail: "Fail", even: "Straight"};
export const FOES_LABEL = {adv: "Foes adv.", dis: "Foes disadv.", even: "Foes roll straight", near: "Near foes adv."};
