import {RECHARGE_LABEL} from "../data/constants.js";
import {state} from "../store/state.js";
import {toggleUse, spendPool, restorePool, toggleActive, spendSlot} from "../store/play.js";
import {formulaValue, slotDice, slotsLeft} from "../rules/sheet.js";
import {makeToggleDots} from "../ui/dots.js";
import {makeFrame} from "../ui/frame.js";
import {spawnFx} from "../ui/fx.js";
import {el} from "./dom.js";
import {actionButton} from "./controls.js";

const poolSpent = feature => state.play.spent[feature.id] || 0;

function usesTracker(feature){
  const max = formulaValue(state.character, feature.tracker.max);
  const spent = state.play.spent[feature.id] || [];
  const ready = Array.from({length: max}, (_, index) => !spent.includes(index));
  const row = el("div", "tracker");
  row.append(
    makeToggleDots(ready, index => toggleUse(feature.id, index), "holy"),
    el("span", "tracker-note", RECHARGE_LABEL[feature.tracker.recharge]));
  return row;
}

function poolStep(label, isDisabled, onPress){
  const button = actionButton(label, {tone: "holy"}, onPress);
  button.disabled = isDisabled;
  return button;
}

function poolTracker(feature){
  const {steps, isHealing, recharge} = feature.tracker;
  const max = formulaValue(state.character, feature.tracker.max);
  const left = max - poolSpent(feature);
  const bar = el("span", "pool-bar");
  const fill = el("span", "pool-fill");
  fill.style.width = left / max * 100 + "%";
  bar.append(fill, el("b", "pool-count", `${left}/${max}`));
  const row = el("div", "tracker");
  row.append(
    ...steps.toReversed().map(step => poolStep("−" + step, left === 0, () => spendPool(feature, step, false))),
    bar,
    ...steps.map(step => poolStep("+" + step, left === max, () => restorePool(feature, step))));
  const foot = el("div", "tracker");
  if(isHealing){
    const step = steps[steps.length - 1];
    foot.appendChild(actionButton("Heal me " + step, {tone: "verdant"}, () => spendPool(feature, step, true)));
  }
  foot.appendChild(el("span", "tracker-note", RECHARGE_LABEL[recharge]));
  const pool = el("div", "pool");
  pool.append(row, foot);
  return pool;
}

function toggleTracker(feature){
  const isOn = state.play.active.includes(feature.id);
  const row = el("div", "tracker");
  const {onLabel, offLabel} = feature.tracker;
  row.appendChild(actionButton(isOn ? onLabel : offLabel, {tone: "arcane", chosen: isOn}, () => toggleActive(feature.id)));
  return row;
}

function slotSpendTracker(feature){
  const row = el("div", "tracker");
  Object.keys(state.character.spellcasting.slots).forEach(level => {
    const button = actionButton(`Lv ${level} · ${slotDice(feature.tracker, Number(level))}`, {tone: "mana"}, () => {
      spawnFx("holy", button.getBoundingClientRect(), {tone: "gold"});
      spendSlot(level);
    });
    button.disabled = slotsLeft(state.character, state.play, level) === 0;
    row.appendChild(button);
  });
  return row;
}

const TRACKERS = {uses: usesTracker, pool: poolTracker, toggle: toggleTracker, slotSpend: slotSpendTracker};

export function renderFeatures(main){
  const box = makeFrame(el("section"), "Features & traits");
  state.character.features.forEach(feature => {
    const item = el("div", "feature");
    item.dataset.active = state.play.active.includes(feature.id) ? "on" : "off";
    item.appendChild(el("h3", "feature-name", feature.name));
    if(feature.tracker) item.appendChild(TRACKERS[feature.tracker.kind](feature));
    item.appendChild(el("p", "feature-text", feature.text));
    box.appendChild(item);
  });
  main.appendChild(box);
}
