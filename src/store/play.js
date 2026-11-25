import {state, changes, persistPlay} from "./state.js";
import {adjusted, damaged, healed, withTempHp, afterShortRest, afterLongRest} from "../rules/play.js";
import {toggled} from "../rules/lists.js";
import {hpMax, slotsLeft, formulaValue} from "../rules/sheet.js";

function commit(next){
  state.play = next;
  persistPlay();
  changes.notify();
}

const edit = fields => commit({...state.play, ...fields});
const currentMax = () => hpMax(state.character, state.play);

export const adjustHp = delta => commit(adjusted(state.play, delta, currentMax()));
export const takeDamage = amount => commit(damaged(state.play, amount));
export const heal = amount => commit(healed(state.play, amount, currentMax()));
export const addTempHp = amount => commit(withTempHp(state.play, amount));

export const toggleCondition = key => edit({conditions: toggled(state.play.conditions, key)});
export const toggleActive = id => edit({active: toggled(state.play.active, id)});
export const toggleInspiration = () => edit({inspiration: !state.play.inspiration});

export function setExhaustion(level){
  const next = {...state.play, exhaustion: level};
  commit({...next, hp: Math.min(next.hp, hpMax(state.character, next))});
}

export const setDeathSaves = (kind, count) => edit({deathSaves: {...state.play.deathSaves, [kind]: count}});
export const setHitDiceSpent = count => edit({hitDiceSpent: count});
export const setSpent = (id, count) => edit({spent: {...state.play.spent, [id]: count}});

const spentSlots = level => state.play.slotsSpent[level] || [];
const setSpentSlots = (level, spent) => edit({slotsSpent: {...state.play.slotsSpent, [level]: spent}});

export const toggleSlot = (level, index) => setSpentSlots(level, toggled(spentSlots(level), index));

export function spendSlot(level){
  if(slotsLeft(state.character, state.play, level) === 0) return;
  const total = state.character.spellcasting.slots[level];
  const index = Array.from({length: total}, (_, at) => total - 1 - at).find(at => !spentSlots(level).includes(at));
  setSpentSlots(level, spentSlots(level).concat(index));
}

export function spendPool(feature, amount, isOnSelf){
  const left = formulaValue(state.character, feature.tracker.max) - (state.play.spent[feature.id] || 0);
  const used = Math.min(amount, left);
  const next = {...state.play, spent: {...state.play.spent, [feature.id]: (state.play.spent[feature.id] || 0) + used}};
  commit(isOnSelf ? healed(next, used, currentMax()) : next);
}

export const shortRest = () => commit(afterShortRest(state.character, state.play));
export const longRest = () => commit(afterLongRest(state.character, state.play));
