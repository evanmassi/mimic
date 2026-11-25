import {state, setOpenAttack} from "../store/state.js";
import {setAttack, cycleAttackAbility, addAttack, removeAttack} from "../store/character.js";
import {attackBonus, damageBonus} from "../rules/sheet.js";
import {signed} from "../rules/format.js";
import {makeFrame} from "../ui/frame.js";
import {el} from "./dom.js";
import {actionButton, editableField} from "./controls.js";

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

function attackRow(attack, index){
  const character = state.character;
  const row = el("button", "attack");
  row.type = "button";
  [attack.name, signed(attackBonus(character, attack)), `${attack.damageDice}${signed(damageBonus(character, attack))} ${attack.damageType}`]
    .forEach(text => row.appendChild(el("span", "attack-cell", text)));
  row.addEventListener("click", () => setOpenAttack(index));
  return row;
}

export function renderAttacks(main){
  const attacks = state.character.attacks;
  const box = makeFrame(el("section"), "Attacks & spellcasting · tap one to change it");
  const head = el("div", "attack-head");
  ["Name", "Atk bonus", "Damage/type"].forEach(text => head.appendChild(el("span", "attack-cell", text)));
  box.appendChild(head);
  attacks.forEach((attack, index) => box.appendChild(state.openAttack === index ? attackEditor(attack, index) : attackRow(attack, index)));
  box.appendChild(actionButton("+ Add an attack", {}, () => {
    setOpenAttack(attacks.length);
    addAttack();
  }));
  main.appendChild(box);
}
