import {HP_DRAG_FULL_SWIPE, DEATH_SAVE_COUNT, CONCENTRATION_MIN_DC} from "../data/constants.js";
import {hpMax} from "./sheet.js";

const NO_DEATH_SAVES = {successes: 0, failures: 0};

export function newPlay(character){
  return {hp: character.maxHp, tempHp: 0, hitDiceSpent: 0, deathSaves: NO_DEATH_SAVES, conditions: [],
    exhaustion: 0, inspiration: false, slotsSpent: {}, spent: {}, active: []};
}

export function damaged(play, amount){
  const fromTemp = Math.min(play.tempHp, amount);
  return {...play, tempHp: play.tempHp - fromTemp, hp: Math.max(0, play.hp - (amount - fromTemp))};
}

export function healed(play, amount, max){
  return {...play, hp: Math.min(max, play.hp + amount), deathSaves: play.hp === 0 ? NO_DEATH_SAVES : play.deathSaves};
}

export const withTempHp = (play, amount) => ({...play, tempHp: Math.max(play.tempHp, amount)});

export const adjusted = (play, delta, max) => delta < 0 ? damaged(play, -delta) : healed(play, delta, max);

export const concentrationDc = damage => Math.max(CONCENTRATION_MIN_DC, Math.floor(damage / 2));

export const hpWear = (play, max) => 1 - Math.min(play.hp, max) / max;

export function deathFate(play){
  if(play.hp > 0) return "alive";
  if(play.deathSaves.failures >= DEATH_SAVE_COUNT) return "dead";
  return play.deathSaves.successes >= DEATH_SAVE_COUNT ? "stable" : "dying";
}

export function poolDrag(dx, width, max, left){
  if(!width) return 0;
  return Math.max(-left, Math.min(max - left, Math.round(dx / width * max * HP_DRAG_FULL_SWIPE)));
}

export function dragAmount(dx, width, play, max){
  if(!width) return 0;
  const raw = Math.round(dx / width * max * HP_DRAG_FULL_SWIPE);
  return Math.max(-(play.hp + play.tempHp), Math.min(max - play.hp, raw));
}

const rechargesOn = (character, recharges) => character.features
  .filter(feature => feature.tracker && recharges.includes(feature.tracker.recharge))
  .map(feature => feature.id);

const withoutSpent = (spent, ids) =>
  Object.fromEntries(Object.entries(spent).filter(([id]) => !ids.includes(id)));

export const afterShortRest = (character, play) =>
  ({...play, spent: withoutSpent(play.spent, rechargesOn(character, ["short"]))});

export function afterLongRest(character, play){
  const rested = {...play, exhaustion: Math.max(0, play.exhaustion - 1)};
  return {...rested, hp: hpMax(character, rested), tempHp: 0, deathSaves: NO_DEATH_SAVES,
    hitDiceSpent: Math.max(0, play.hitDiceSpent - Math.max(1, Math.floor(character.level / 2))),
    slotsSpent: {}, spent: withoutSpent(play.spent, rechargesOn(character, ["short", "long"])), active: []};
}
