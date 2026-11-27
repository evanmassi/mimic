import {DEATH_SAVE_COUNT, FOES_LABEL, ROLL_BUZZ_MS} from "../data/constants.js";
import {state} from "../store/state.js";
import {setHitDiceSpent, setDeathSaves} from "../store/play.js";
import {setField} from "../store/character.js";
import {armorClass, initiative, speed, rollMark} from "../rules/sheet.js";
import {signed} from "../rules/format.js";
import {makeDots} from "../ui/dots.js";
import {makeFrame} from "../ui/frame.js";
import {buzz} from "../ui/fx.js";
import {el} from "./dom.js";
import {statBox, editableField, diceMark} from "./controls.js";

let shownDiceLeft = null;

function diceRack(character, play){
  const left = character.level - play.hitDiceSpent;
  const before = shownDiceLeft === null ? left : shownDiceLeft;
  const rack = el("div", "dice-rack");
  for(let index = 0; index < character.level; index++){
    const isReady = index < left;
    const die = el("button", "die");
    die.type = "button";
    die.dataset.die = "d" + character.hitDie;
    die.dataset.on = isReady ? "on" : "off";
    die.dataset.motion = isReady && index >= before ? "in" : !isReady && index < before ? "out" : "still";
    die.style.setProperty("--i", String(index));
    die.setAttribute("aria-label", isReady ? `Spend a hit die (${left} left)` : "Get a hit die back");
    die.addEventListener("click", () => {
      if(isReady) buzz(ROLL_BUZZ_MS);
      setHitDiceSpent(play.hitDiceSpent + (isReady ? 1 : -1));
    });
    rack.appendChild(die);
  }
  shownDiceLeft = left;
  return rack;
}

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
  const acBox = baseBox("combat-ac", "armorClass", ac, "Armor class", ac !== character.armorClass);
  const foes = rollMark(character, play, "foes");
  if(foes){
    const note = el("span", "foes-note", FOES_LABEL[foes]);
    note.dataset.roll = foes;
    acBox.appendChild(note);
  }
  const initiativeBox = statBox("combat-box", signed(initiative(character)), "Initiative");
  const check = rollMark(character, play, "check");
  if(check) initiativeBox.appendChild(diceMark(check));
  const row = el("section", "combat");
  row.append(acBox, initiativeBox, baseBox("combat-box", "speed", moves + "ft", "Speed", moves !== character.speed));

  const hitDice = makeFrame(el("section", "vital"), "Hit dice");
  const left = character.level - play.hitDiceSpent;
  hitDice.append(diceRack(character, play), el("span", "vital-note", `${left} of ${character.level} d${character.hitDie}`));

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
