import {CONDITIONS} from "../data/conditions.js";
import {signed} from "./format.js";

const note = (value, text, tone = null) => ({value, text, tone});
const count = value => Array.isArray(value) ? value.length : value || 0;

function hpNote(before, after){
  const lost = before.hp + before.tempHp - after.hp - after.tempHp;
  if(after.tempHp > before.tempHp && after.hp === before.hp) return note(signed(after.tempHp - before.tempHp), "temp HP", "up");
  return lost ? note(signed(-lost), "HP", lost > 0 ? "down" : "up") : null;
}

function slotNote(before, after){
  const levels = new Set([...Object.keys(before.slotsSpent), ...Object.keys(after.slotsSpent)]);
  for(const level of levels){
    const change = count(after.slotsSpent[level]) - count(before.slotsSpent[level]);
    if(change) return note(`Lv ${level}`, change > 0 ? "slot spent" : "slot back");
  }
  return null;
}

function featureNote(character, before, after){
  for(const feature of character.features){
    const change = count(after.spent[feature.id]) - count(before.spent[feature.id]);
    if(!change) continue;
    if(feature.tracker.kind === "pool") return note(signed(-change), feature.name, change > 0 ? "down" : "up");
    return note(feature.name, change > 0 ? "used" : "back");
  }
  const toggled = character.features.find(feature => before.active.includes(feature.id) !== after.active.includes(feature.id));
  return toggled ? note(toggled.name, after.active.includes(toggled.id) ? "on" : "off") : null;
}

function conditionNote(before, after){
  const added = CONDITIONS.find(condition => after.conditions.includes(condition.key) && !before.conditions.includes(condition.key));
  if(added) return note(added.name, "on");
  const removed = CONDITIONS.find(condition => before.conditions.includes(condition.key) && !after.conditions.includes(condition.key));
  return removed ? note(removed.name, "off") : null;
}

function otherNote(before, after){
  if(after.exhaustion !== before.exhaustion) return note(after.exhaustion ? `Level ${after.exhaustion}` : "No", "exhaustion");
  const {successes, failures} = after.deathSaves;
  if(successes !== before.deathSaves.successes || failures !== before.deathSaves.failures){
    return note(`${successes} saved · ${failures} failed`, "death saves");
  }
  const dice = after.hitDiceSpent - before.hitDiceSpent;
  if(dice) return note(String(Math.abs(dice)), dice > 0 ? "hit die spent" : "hit die back");
  if(after.inspiration !== before.inspiration) return note("Inspiration", after.inspiration ? "gained" : "spent");
  return null;
}

export const describeChange = (character, before, after) =>
  hpNote(before, after) || slotNote(before, after) || featureNote(character, before, after)
  || conditionNote(before, after) || otherNote(before, after) || note("", "Changed");
