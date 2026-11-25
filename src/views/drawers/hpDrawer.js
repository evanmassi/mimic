import {state} from "../../store/state.js";
import {takeDamage, heal, addTempHp} from "../../store/play.js";
import {setMaxHp} from "../../store/character.js";
import {makeField} from "../../ui/field.js";
import {el} from "../dom.js";
import {actionButton} from "../controls.js";
import {openDrawer, closeDrawer} from "./drawer.js";

function numberInput(placeholder, value){
  const input = el("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.placeholder = placeholder;
  input.value = value;
  return input;
}

const readPositive = input => {
  const value = parseInt(input.value, 10);
  return value > 0 ? value : null;
};

function maxRow(){
  const input = numberInput("Max", String(state.character.maxHp));
  const row = el("div", "drawer-entry");
  row.append(el("span", "drawer-label", "Hit point maximum"), makeField(input), actionButton("Set", {}, () => {
    const max = readPositive(input);
    if(max === null) return;
    setMaxHp(max);
    closeDrawer();
  }));
  return row;
}

export function openHpDrawer(){
  const body = openDrawer("Hit points");
  const input = numberInput("Amount", "");
  const apply = change => () => {
    const amount = readPositive(input);
    if(amount === null) return;
    change(amount);
    closeDrawer();
  };
  const actions = el("div", "drawer-actions");
  actions.append(
    actionButton("Damage", {tone: "blood"}, apply(takeDamage)),
    actionButton("Heal", {tone: "verdant"}, apply(heal)),
    actionButton("Temp HP", {tone: "arcane"}, apply(addTempHp)));
  const entry = el("div", "drawer-entry");
  entry.appendChild(makeField(input));
  body.append(entry, actions, maxRow());
  input.focus();
}
