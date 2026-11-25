import {RECHARGE_LABEL} from "../data/constants.js";
import {state} from "../store/state.js";
import {setSpent, spendPool, toggleActive, spendSlot} from "../store/play.js";
import {formulaValue, slotDice, slotsLeft} from "../rules/sheet.js";
import {makeDots} from "../ui/dots.js";
import {makeFrame} from "../ui/frame.js";
import {spawnFx} from "../ui/fx.js";
import {el} from "./dom.js";
import {actionButton} from "./controls.js";

const spentOf = feature => state.play.spent[feature.id] || 0;

function usesTracker(feature){
  const max = formulaValue(state.character, feature.tracker.max);
  const row = el("div", "tracker");
  row.append(
    makeDots(max, max - spentOf(feature), count => setSpent(feature.id, max - count), "holy"),
    el("span", "tracker-note", RECHARGE_LABEL[feature.tracker.recharge]));
  return row;
}

function poolTracker(feature){
  const {steps, isHealing, recharge} = feature.tracker;
  const max = formulaValue(state.character, feature.tracker.max);
  const left = max - spentOf(feature);
  const row = el("div", "tracker");
  const bar = el("span", "pool-bar");
  const fill = el("span", "pool-fill");
  fill.style.width = left / max * 100 + "%";
  bar.appendChild(fill);
  row.append(el("b", "pool-count", `${left}/${max}`), bar);
  steps.forEach(step => row.appendChild(actionButton("−" + step, {tone: "gold"}, () => spendPool(feature, step, false))));
  if(isHealing){
    const step = steps[steps.length - 1];
    row.appendChild(actionButton("Heal me " + step, {tone: "verdant"}, () => spendPool(feature, step, true)));
  }
  row.appendChild(el("span", "tracker-note", RECHARGE_LABEL[recharge]));
  return row;
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
