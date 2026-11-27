import {UNDO_DEPTH, HIT_GROUP_MS, DEATH_SAVE_COUNT} from "../data/constants.js";
import {state, changes, persistPlay} from "./state.js";
import {adjusted, damaged, healed, withTempHp, afterShortRest, afterLongRest} from "../rules/play.js";
import {withItem} from "../rules/lists.js";
import {hpMax, slotsLeft, formulaValue, activeConditions} from "../rules/sheet.js";

let promptId = 0;

function concentrationNotice(before, next){
  const lost = before.hp + before.tempHp - next.hp - next.tempHp;
  const isConcentrating = activeConditions(state.character, before).some(({key}) => key === "concentrating");
  if(lost <= 0 || next.hp === 0 || !isConcentrating) return null;
  const now = Date.now();
  const pending = state.notice && now - state.notice.at < HIT_GROUP_MS ? state.notice : null;
  return {id: pending ? pending.id : ++promptId, damage: lost + (pending ? pending.damage : 0), at: now};
}

function commit(next){
  const before = state.play;
  state.history = [...state.history, before].slice(-UNDO_DEPTH);
  state.notice = concentrationNotice(before, next);
  state.play = next;
  persistPlay();
  changes.notify();
}

// PITFALL: a quiet edit rewrites the undo snapshots too, or undoing an earlier change would quietly revert it.
function quietly(change){
  state.play = change(state.play);
  state.history = state.history.map(change);
  persistPlay();
  changes.notify();
}

function flipQuietly(field, item){
  const isIn = !state.play[field].includes(item);
  quietly(play => ({...play, [field]: withItem(play[field], item, isIn)}));
}

export function undo(){
  const last = state.history[state.history.length - 1];
  if(!last) return;
  state.history = state.history.slice(0, -1);
  state.notice = null;
  state.play = last;
  persistPlay();
  changes.notify();
}

export function dismissNotice(id){
  if(!state.notice || state.notice.id !== id) return;
  state.notice = null;
  changes.notify();
}

export function loseConcentration(){
  commit({...state.play, conditions: state.play.conditions.filter(key => key !== "concentrating")});
}

const edit = fields => commit({...state.play, ...fields});
const currentMax = () => hpMax(state.character, state.play);

export const adjustHp = delta => commit(adjusted(state.play, delta, currentMax()));
export const takeDamage = amount => commit(damaged(state.play, amount));
export const heal = amount => commit(healed(state.play, amount, currentMax()));
export const addTempHp = amount => commit(withTempHp(state.play, amount));

export const toggleCondition = key => flipQuietly("conditions", key);
export const toggleActive = id => flipQuietly("active", id);

export function toggleInspiration(){
  const inspiration = !state.play.inspiration;
  quietly(play => ({...play, inspiration}));
}

export function setExhaustion(level){
  const next = {...state.play, exhaustion: level};
  commit({...next, hp: Math.min(next.hp, hpMax(state.character, next))});
}

const within = (value, max) => Math.min(max, Math.max(0, value));

export function setDeathSaves(kind, count){
  const step = count - state.play.deathSaves[kind];
  quietly(play => ({...play, deathSaves: {...play.deathSaves, [kind]: within(play.deathSaves[kind] + step, DEATH_SAVE_COUNT)}}));
}

export function setHitDiceSpent(count){
  const step = count - state.play.hitDiceSpent;
  quietly(play => ({...play, hitDiceSpent: within(play.hitDiceSpent + step, state.character.level)}));
}

function flipOrbQuietly(field, key, index){
  const isSpent = !(state.play[field][key] || []).includes(index);
  quietly(play => ({...play, [field]: {...play[field], [key]: withItem(play[field][key] || [], index, isSpent)}}));
}

export const toggleUse = (id, index) => flipOrbQuietly("spent", id, index);
export const toggleSlot = (level, index) => flipOrbQuietly("slotsSpent", level, index);

const spentSlots = level => state.play.slotsSpent[level] || [];

export function spendSlot(level){
  if(slotsLeft(state.character, state.play, level) === 0) return null;
  const total = state.character.spellcasting.slots[level];
  const index = Array.from({length: total}, (_, at) => total - 1 - at).find(at => !spentSlots(level).includes(at));
  edit({slotsSpent: {...state.play.slotsSpent, [level]: spentSlots(level).concat(index)}});
  return index;
}

export function spendPool(feature, amount, isOnSelf){
  const left = formulaValue(state.character, feature.tracker.max) - (state.play.spent[feature.id] || 0);
  const used = Math.min(amount, left);
  const next = {...state.play, spent: {...state.play.spent, [feature.id]: (state.play.spent[feature.id] || 0) + used}};
  commit(isOnSelf ? healed(next, used, currentMax()) : next);
}

export function restorePool(feature, amount){
  edit({spent: {...state.play.spent, [feature.id]: Math.max(0, (state.play.spent[feature.id] || 0) - amount)}});
}

export const shortRest = () => commit(afterShortRest(state.character, state.play));
export const longRest = () => commit(afterLongRest(state.character, state.play));
