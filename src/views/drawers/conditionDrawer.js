import {CONDITIONS, EXHAUSTION} from "../../data/conditions.js";
import {state} from "../../store/state.js";
import {toggleCondition, setExhaustion} from "../../store/play.js";
import {activeConditions} from "../../rules/sheet.js";
import {el} from "../dom.js";
import {openDrawer} from "./drawer.js";

function pick(name, effect, isOn, isLocked, onPick){
  const row = el("button", "pick");
  row.type = "button";
  row.dataset.on = isOn ? "on" : "off";
  row.disabled = isLocked;
  row.append(el("b", "pick-name", name), el("span", "pick-effect", effect));
  row.addEventListener("click", onPick);
  return row;
}

function fill(body){
  body.innerHTML = "";
  const active = activeConditions(state.character, state.play).map(condition => condition.key);
  CONDITIONS.forEach(({key, name, effect}) => {
    const isManual = state.play.conditions.includes(key);
    const isFromEffect = active.includes(key) && !isManual;
    body.appendChild(pick(name, isFromEffect ? "From an active feature. " + effect : effect, active.includes(key), isFromEffect, () => {
      toggleCondition(key);
      fill(body);
    }));
  });
  body.appendChild(el("p", "drawer-group", "Exhaustion"));
  EXHAUSTION.forEach((effect, index) => {
    const level = index + 1;
    body.appendChild(pick(`Level ${level}`, effect, state.play.exhaustion >= level, false, () => {
      setExhaustion(state.play.exhaustion === level ? level - 1 : level);
      fill(body);
    }));
  });
}

export const openConditionDrawer = () => fill(openDrawer("Conditions"));
