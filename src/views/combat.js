import {DEATH_SAVE_COUNT} from "../data/constants.js";
import {state} from "../store/state.js";
import {setHitDiceSpent, setDeathSaves} from "../store/play.js";
import {setField} from "../store/character.js";
import {armorClass, initiative, speed} from "../rules/sheet.js";
import {signed} from "../rules/format.js";
import {makeDots} from "../ui/dots.js";
import {makeFrame} from "../ui/frame.js";
import {el} from "./dom.js";
import {statBox, editableField} from "./controls.js";

function baseBox(className, field, shownValue, label, isChanged){
  if(state.isEditing){
    const box = el("div", className);
    box.append(editableField("number", state.character[field], value => setField(field, value), label), el("span", "stat-label", label + " (base)"));
    return box;
  }
  const box = statBox(className, shownValue, label);
  box.dataset.changed = isChanged ? "on" : "off";
  return box;
}

export function renderCombat(main){
  const {character, play} = state;
  const ac = armorClass(character, play);
  const moves = speed(character, play);
  const row = el("section", "combat");
  row.append(
    baseBox("combat-ac", "armorClass", ac, "Armor class", ac !== character.armorClass),
    statBox("combat-box", signed(initiative(character)), "Initiative"),
    baseBox("combat-box", "speed", moves + "ft", "Speed", moves !== character.speed));

  const hitDice = makeFrame(el("section", "vital"), "Hit dice");
  const left = character.level - play.hitDiceSpent;
  hitDice.append(
    makeDots(character.level, left, count => setHitDiceSpent(character.level - count), "dice"),
    el("span", "vital-note", `${left} of ${character.level} d${character.hitDie}`));

  const saves = makeFrame(el("section", "vital"), "Death saves");
  const line = (label, kind, feel) => {
    const holder = el("div", "vital-line");
    holder.append(el("span", "vital-note", label), makeDots(DEATH_SAVE_COUNT, play.deathSaves[kind], count => setDeathSaves(kind, count), feel));
    return holder;
  };
  saves.append(line("Successes", "successes", "life"), line("Failures", "failures", "death"));

  const vitals = el("div", "vitals");
  vitals.append(hitDice, saves);
  main.append(row, vitals);
}
