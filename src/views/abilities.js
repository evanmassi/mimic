import {ABILITIES} from "../data/abilities.js";
import {SCORE_MIN, SCORE_MAX} from "../data/constants.js";
import {state} from "../store/state.js";
import {setScore} from "../store/character.js";
import {toggleInspiration} from "../store/play.js";
import {modifier, proficiencyBonus} from "../rules/sheet.js";
import {signed} from "../rules/format.js";
import {el} from "./dom.js";
import {pill, editableField} from "./controls.js";

function abilityBox({key, name}){
  const score = state.character.scores[key];
  const box = el("div", "ability");
  const mod = el("b", "ability-mod", signed(modifier(score)));
  const oval = el("span", "ability-score");
  oval.appendChild(state.isEditing ? editableField("number", score, value => {
    const clamped = Math.max(SCORE_MIN, Math.min(SCORE_MAX, value));
    setScore(key, clamped);
    mod.textContent = signed(modifier(clamped));
  }, name + " score") : el("span", null, String(score)));
  box.append(el("span", "ability-name", name), mod, oval);
  return box;
}

export function renderAbilities(main){
  const grid = el("section", "abilities");
  ABILITIES.forEach(ability => grid.appendChild(abilityBox(ability)));
  const pills = el("section", "pills");
  pills.append(
    pill(state.play.inspiration ? "★" : "", "Inspiration", toggleInspiration),
    pill(signed(proficiencyBonus(state.character.level)), "Proficiency bonus"));
  main.append(grid, pills);
}
