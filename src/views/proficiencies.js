import {ABILITIES, SKILLS} from "../data/abilities.js";
import {state} from "../store/state.js";
import {toggleSaveProficiency, toggleSkillProficiency} from "../store/character.js";
import {saveBonus, saveSeals, skillBonus, skillAbility, passivePerception, rollMark} from "../rules/sheet.js";
import {signed} from "../rules/format.js";
import {makeDots} from "../ui/dots.js";
import {makeFrame} from "../ui/frame.js";
import {el} from "./dom.js";
import {pill, diceMark} from "./controls.js";

const sharedRoll = rolls => rolls.every(roll => roll && roll === rolls[0]) ? rolls[0] : null;

function profRow(isProficient, value, name, roll, note, onToggle){
  const row = el("li", "prof");
  row.append(makeDots(1, isProficient ? 1 : 0, state.isEditing ? onToggle : null), el("b", "prof-value", signed(value)), el("span", "prof-name", name));
  if(roll) row.appendChild(diceMark(roll));
  if(note) row.appendChild(el("span", "prof-note", note));
  return row;
}

function addSeals(frame, seals){
  if(!seals.length) return;
  frame.dataset.seal = seals.some(seal => seal.isLit) ? "lit" : "out";
  const holder = el("div", "seals");
  seals.forEach(({label, amount, isLit}) => {
    const seal = el("span", "seal");
    seal.dataset.lit = isLit ? "on" : "off";
    seal.append(el("b", "seal-amount", signed(amount)), el("span", "seal-label", label));
    holder.appendChild(seal);
  });
  frame.appendChild(holder);
}

export function renderProficiencies(main){
  const {character, play} = state;
  const saveRolls = ABILITIES.map(({key}) => rollMark(character, play, "save", key));
  const shared = sharedRoll(saveRolls);
  const saves = makeFrame(el("section"), "Saving throws", shared ? diceMark(shared) : null);
  const saveList = el("ul", "prof-list");
  ABILITIES.forEach(({key, name}, index) => saveList.appendChild(
    profRow(character.saveProficiencies.includes(key), saveBonus(character, key), name, shared ? null : saveRolls[index], null,
      () => toggleSaveProficiency(key))));
  saves.appendChild(saveList);
  addSeals(saves, saveSeals(character, play));

  const check = rollMark(character, play, "check");
  const skills = makeFrame(el("section"), "Skills", check ? diceMark(check) : null);
  const skillList = el("ul", "prof-list");
  SKILLS.forEach(skill => skillList.appendChild(
    profRow(character.skillProficiencies.includes(skill.id), skillBonus(character, skill), skill.name, null,
      skillAbility(character, skill), () => toggleSkillProficiency(skill.id))));
  skills.appendChild(skillList);

  const passive = el("section", "pills");
  passive.appendChild(pill(String(passivePerception(character)), "Passive wisdom (perception)"));
  main.append(saves, skills, passive);
}
