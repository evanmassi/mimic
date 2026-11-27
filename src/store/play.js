import {UNDO_DEPTH, HIT_GROUP_MS} from "../data/constants.js";
import {state, changes, persistPlay} from "./state.js";
import {adjusted, damaged, healed, withTempHp, afterShortRest, afterLongRest} from "../rules/play.js";
import {describeChange} from "../rules/changes.js";
import {toggled} from "../rules/lists.js";
import {hpMax, slotsLeft, formulaValue, activeConditions} from "../rules/sheet.js";

let noticeId = 0;

function concentrationNotice(before, next){
  const lost = before.hp + before.tempHp - next.hp - next.tempHp;
  const isConcentrating = activeConditions(state.character, before).some(({key}) => key === "concentrating");
  if(lost <= 0 || next.hp === 0 || !isConcentrating) return null;
  const now = Date.now();
  const pending = state.notice && state.notice.kind === "concentration" && now - state.notice.at < HIT_GROUP_MS ? state.notice : null;
  return {kind: "concentration", id: pending ? pending.id : ++noticeId, damage: lost + (pending ? pending.damage : 0), at: now};
}

function commit(next, note = null){
  const before = state.play;
  state.history = [...state.history, {play: before, note: note || describeChange(state.character, before, next)}].slice(-UNDO_DEPTH);
  state.notice = concentrationNotice(before, next) || {kind: "change", id: ++noticeId};
  state.play = next;
  persistPlay();
  changes.notify();
}

export function undo(){
  const last = state.history[state.history.length - 1];
  if(!last) return;
  state.history = state.history.slice(0, -1);
  state.notice = state.history.length ? {kind: "change", id: ++noticeId} : null;
  state.play = last.play;
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

export const toggleCondition = key => edit({conditions: toggled(state.play.conditions, key)});
export const toggleActive = id => edit({active: toggled(state.play.active, id)});
export const toggleInspiration = () => edit({inspiration: !state.play.inspiration});

export function setExhaustion(level){
  const next = {...state.play, exhaustion: level};
  commit({...next, hp: Math.min(next.hp, hpMax(state.character, next))});
}

export const setDeathSaves = (kind, count) => edit({deathSaves: {...state.play.deathSaves, [kind]: count}});
export const setHitDiceSpent = count => edit({hitDiceSpent: count});
const setSpent = (id, spent) => edit({spent: {...state.play.spent, [id]: spent}});

export const toggleUse = (id, index) => setSpent(id, toggled(state.play.spent[id] || [], index));

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

export function restorePool(feature, amount){
  setSpent(feature.id, Math.max(0, (state.play.spent[feature.id] || 0) - amount));
}

export const shortRest = () => commit(afterShortRest(state.character, state.play), {value: "Short rest", text: "taken", tone: null});
export const longRest = () => commit(afterLongRest(state.character, state.play), {value: "Long rest", text: "taken", tone: null});
