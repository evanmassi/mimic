import {TRAY_CLOSE_MS} from "../data/constants.js";
import {CONDITIONS, EXHAUSTION} from "../data/conditions.js";
import {state, openConditionTray, closeConditionTray} from "../store/state.js";
import {toggleCondition} from "../store/play.js";
import {activeConditions, conditionCause} from "../rules/sheet.js";
import {el} from "./dom.js";
import {actionButton} from "./controls.js";

const CAUSE_NOTES = {feature: "From an active feature. ", zeroHp: "From dropping to 0 HP. "};

export function conditionTag(condition, onPress){
  const tag = el("button", "tag", condition.name);
  tag.type = "button";
  tag.dataset.condition = condition.key;
  tag.addEventListener("click", onPress);
  return tag;
}

export function rollUp(tray){
  if(tray.dataset.motion === "close") return;
  tray.dataset.motion = "close";
  setTimeout(closeConditionTray, TRAY_CLOSE_MS);
}

function trayRule(rule, causes){
  const box = el("div", "tray-rule");
  const condition = CONDITIONS.find(({key}) => key === rule);
  const level = state.play.exhaustion;
  let name = "Conditions";
  let text = "Tap one to add it and see what it does.";
  if(condition){
    box.dataset.condition = condition.key;
    name = condition.name;
    text = (CAUSE_NOTES[causes[condition.key]] || "") + condition.effect;
  }else if(rule === "exhaustion"){
    name = level ? `Exhaustion ${level}` : "No exhaustion";
    text = level ? EXHAUSTION.slice(0, level).join(". ") + "." : "Tap a dot to set the level.";
  }
  box.append(el("b", "tray-rule-name", name), el("span", "tray-rule-text", text));
  return box;
}

export function makeConditionTray(isOpening){
  const active = activeConditions(state.character, state.play).map(({key}) => key);
  const causes = Object.fromEntries(active.map(key => [key, conditionCause(state.character, state.play, key)]));
  const tray = el("div", "tray");
  tray.dataset.motion = isOpening ? "open" : "still";
  tray.style.setProperty("--tray-close", TRAY_CLOSE_MS + "ms");
  const head = el("div", "tray-head");
  head.append(el("span", "tray-title", "Tap to add or remove"), actionButton("Close", {}, () => rollUp(tray)));
  const chips = el("div", "tray-chips");
  CONDITIONS.forEach(condition => {
    const isLocked = Boolean(causes[condition.key]);
    const chip = conditionTag(condition, () => {
      openConditionTray(condition.key);
      if(!isLocked) toggleCondition(condition.key);
    });
    chip.dataset.on = active.includes(condition.key) ? "on" : "off";
    chip.dataset.locked = isLocked ? "on" : "off";
    chips.appendChild(chip);
  });
  const body = el("div", "tray-body");
  body.append(head, chips, trayRule(state.conditionTray.rule, causes));
  const roll = el("div", "tray-roll");
  roll.appendChild(body);
  tray.append(el("div", "tray-lip"), roll, el("div", "tray-rod"));
  return {tray, roll};
}
