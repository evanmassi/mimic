import {state, setOpenAttack} from "../store/state.js";
import {setAttack, cycleAttackAbility, addAttack, removeAttack} from "../store/character.js";
import {attackBonus, damageBonus, rollMark, attacksPerAction} from "../rules/sheet.js";
import {signed} from "../rules/format.js";
import {makeFrame} from "../ui/frame.js";
import {el} from "./dom.js";
import {actionButton, editableField, diceMark} from "./controls.js";

function labeled(label, field){
  const holder = el("label", "attack-field");
  holder.append(el("span", "stat-label", label), field);
  return holder;
}

function attackEditor(attack, index){
  const card = el("div", "attack-edit");
  const set = field => value => setAttack(index, field, value);
  card.append(
    labeled("Name", editableField("text", attack.name, set("name"), "Attack name")),
    labeled("Uses", actionButton(attack.ability.toUpperCase(), {}, () => cycleAttackAbility(index))),
    labeled("Magic +", editableField("number", attack.magicBonus, set("magicBonus"), "Magic bonus")),
    labeled("Dice", editableField("text", attack.damageDice, set("damageDice"), "Damage dice")),
    labeled("Extra dmg", editableField("number", attack.damageBonus, set("damageBonus"), "Extra damage")),
    labeled("Type", editableField("text", attack.damageType, set("damageType"), "Damage type")),
    actionButton("Remove", {tone: "blood"}, () => {
      setOpenAttack(null);
      removeAttack(index);
    }),
    actionButton("Done", {tone: "arcane"}, () => setOpenAttack(null)));
  return card;
}

function damageType(type){
  const short = type.trim().length === 1;
  const mark = el("span", "damage-type", short ? type.trim().toUpperCase() : type.trim());
  mark.dataset.type = short ? type.trim().toUpperCase() : "word";
  return mark;
}

function attackRow(attack, index){
  const character = state.character;
  const row = el("button", "attack");
  row.type = "button";
  const hit = el("span", "attack-cell attack-hit");
  hit.append(el("b", "attack-bonus", signed(attackBonus(character, attack))), el("span", "attack-ability", attack.ability.toUpperCase()));
  const damage = el("span", "attack-cell attack-damage");
  damage.append(el("b", "attack-dice", attack.damageDice + signed(damageBonus(character, attack))), damageType(attack.damageType));
  row.append(el("span", "attack-cell attack-name", attack.name), hit, damage);
  row.addEventListener("click", () => setOpenAttack(index));
  return row;
}

export function renderAttacks(main){
  const attacks = state.character.attacks;
  const box = makeFrame(el("section"), "Attacks & spellcasting · tap one to change it");
  const count = attacksPerAction(state.character, state.play);
  const roll = rollMark(state.character, state.play, "attack");
  if(count > 1 || roll){
    const top = el("div", "attack-top");
    top.appendChild(el("span", "attack-count", count > 1 ? `${count} attacks per Attack action` : ""));
    if(roll) top.appendChild(diceMark(roll));
    box.appendChild(top);
  }
  const head = el("div", "attack-head");
  ["Name", "Atk bonus", "Damage/type"].forEach(text => head.appendChild(el("span", "attack-label", text)));
  box.appendChild(head);
  attacks.forEach((attack, index) => box.appendChild(state.openAttack === index ? attackEditor(attack, index) : attackRow(attack, index)));
  box.appendChild(actionButton("+ Add an attack", {}, () => {
    setOpenAttack(attacks.length);
    addAttack();
  }));
  main.appendChild(box);
}
