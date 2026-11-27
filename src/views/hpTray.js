import {HP_STEPS} from "../data/constants.js";
import {state, closeTray} from "../store/state.js";
import {adjustHp, takeDamage, heal, addTempHp} from "../store/play.js";
import {setMaxHp} from "../store/character.js";
import {damaged, healed, withTempHp} from "../rules/play.js";
import {hpMax} from "../rules/sheet.js";
import {makeField} from "../ui/field.js";
import {el} from "./dom.js";
import {actionButton, numberBox, readAmount, amountRow} from "./controls.js";
import {makeScroll} from "./scroll.js";

function stepRow(){
  const row = el("div", "hp-steps");
  const step = (amount, tone) => actionButton((amount < 0 ? "−" : "+") + Math.abs(amount), {tone}, () => adjustHp(amount));
  row.append(...HP_STEPS.toReversed().map(amount => step(-amount, "blood")), el("span", "hp-steps-gap"),
    ...HP_STEPS.map(amount => step(amount, "verdant")));
  return row;
}

function entryRow(){
  const max = hpMax(state.character, state.play);
  const then = apply => amount => {
    closeTray();
    apply(amount);
  };
  return amountRow([
    {label: "Damage", tone: "blood", apply: then(takeDamage), result: amount => "→ " + damaged(state.play, amount).hp},
    {label: "Heal", tone: "verdant", apply: then(heal), result: amount => "→ " + healed(state.play, amount, max).hp},
    {label: "Temp HP", tone: "arcane", apply: then(addTempHp), result: amount => "+" + withTempHp(state.play, amount).tempHp}
  ]);
}

function footRow(){
  const row = el("div", "hp-foot");
  const maxSpot = el("span", "hp-max");
  const change = el("button", "hp-max-change");
  change.type = "button";
  change.append(el("span", "hp-max-word", "Max"), el("b", "hp-max-value", String(state.character.maxHp)), el("span", "hp-max-word", "change"));
  change.addEventListener("click", () => {
    const input = numberBox("Max", String(state.character.maxHp));
    maxSpot.innerHTML = "";
    maxSpot.append(el("span", "hp-max-word", "Max"), makeField(input), actionButton("Set", {}, () => {
      const max = readAmount(input);
      if(max !== null) setMaxHp(max);
    }));
    input.focus();
  });
  maxSpot.appendChild(change);
  row.append(el("span", "hud-mini-label", `${state.play.hp} of ${hpMax(state.character, state.play)}`), maxSpot);
  return row;
}

export function makeHpTray(isOpening){
  const scroll = makeScroll("Hit points", isOpening);
  scroll.body.append(stepRow(), entryRow(), footRow());
  return scroll;
}
