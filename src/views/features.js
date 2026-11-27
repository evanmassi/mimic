import {RECHARGE_LABEL, HP_DRAG_TAP_PX} from "../data/constants.js";
import {state, openPoolTray, closeTray} from "../store/state.js";
import {toggleUse, spendPool, restorePool, toggleActive, spendSlot} from "../store/play.js";
import {formulaValue, slotDice, slotsLeft, hpMax} from "../rules/sheet.js";
import {healed, poolDrag} from "../rules/play.js";
import {signed} from "../rules/format.js";
import {makeToggleDots} from "../ui/dots.js";
import {makeFrame} from "../ui/frame.js";
import {spawnFx} from "../ui/fx.js";
import {el} from "./dom.js";
import {actionButton, amountRow} from "./controls.js";
import {makeScroll, rollUp} from "./scroll.js";
import {playSlotSpent} from "./hud.js";

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

let shownPool = null;

function poolScroll(feature, left, isOpening){
  const scroll = makeScroll(feature.name, isOpening);
  const spend = (amount, isOnSelf) => {
    spawnFx("holy", scroll.tray.getBoundingClientRect(), {tone: "radiant"});
    closeTray();
    spendPool(feature, amount, isOnSelf);
  };
  const after = amount => left - Math.min(amount, left);
  const {isHealing, fixed = []} = feature.tracker;
  const max = hpMax(state.character, state.play);
  const outcomes = isHealing
    ? [{label: "Heal me", tone: "verdant", apply: amount => spend(amount, true), result: amount => "you → " + healed(state.play, Math.min(amount, left), max).hp},
      {label: "Heal ally", tone: "radiant", apply: amount => spend(amount, false), result: amount => "pool → " + after(amount)}]
    : [{label: "Spend", tone: "radiant", apply: amount => spend(amount, false), result: amount => "pool → " + after(amount)}];
  fixed.forEach(({label, cost}) => outcomes.push({label: `${label} · ${cost}`, tone: "ink", cost, isOff: cost > left,
    apply: amount => spend(amount, false), result: amount => "pool → " + after(amount)}));
  scroll.body.appendChild(amountRow(outcomes));
  if(isHealing) scroll.body.appendChild(el("span", "pool-foot", `You're at ${state.play.hp} of ${max}`));
  return scroll;
}

function poolTracker(feature){
  const max = formulaValue(state.character, feature.tracker.max);
  const left = max - poolSpent(feature);
  const isOpen = Boolean(state.tray && state.tray.kind === "pool" && state.tray.id === feature.id);
  const scroll = isOpen ? poolScroll(feature, left, shownPool !== feature.id) : null;
  const vial = el("div", "vial");
  vial.setAttribute("role", "button");
  vial.setAttribute("aria-label", `${feature.name}: ${left} of ${max} left`);
  const fill = el("span", "vial-fill");
  const text = el("b", "vial-text");
  const count = el("span", "vial-count");
  const delta = el("span", "vial-delta");
  text.append(count, delta);
  vial.append(fill, text);
  const paint = change => {
    fill.style.width = (left + change) / max * 100 + "%";
    count.textContent = `${left + change} / ${max}`;
    delta.textContent = change ? signed(change) : "";
    delta.dataset.sign = change > 0 ? "up" : "down";
  };
  paint(0);
  let startX = null, isDragging = false, change = 0;
  vial.addEventListener("pointerdown", event => {
    startX = event.clientX;
    change = 0;
    vial.setPointerCapture(event.pointerId);
    vial.dataset.dragging = "on";
  });
  vial.addEventListener("pointermove", event => {
    if(startX === null) return;
    const dx = event.clientX - startX;
    if(!isDragging && Math.abs(dx) < HP_DRAG_TAP_PX) return;
    isDragging = true;
    change = poolDrag(dx, vial.clientWidth, max, left);
    paint(change);
  });
  vial.addEventListener("pointerup", () => {
    if(startX === null) return;
    const wasDragging = isDragging;
    startX = null;
    isDragging = false;
    vial.dataset.dragging = "off";
    if(!wasDragging) isOpen ? rollUp(scroll.tray) : openPoolTray(feature.id);
    else if(change < 0){
      spawnFx("holy", vial.getBoundingClientRect(), {tone: "radiant"});
      spendPool(feature, -change, false);
    }else if(change > 0) restorePool(feature, change);
    else paint(0);
  });
  vial.addEventListener("pointercancel", () => {
    startX = null;
    isDragging = false;
    vial.dataset.dragging = "off";
    paint(0);
  });
  const pool = el("div", "pool");
  pool.appendChild(vial);
  if(scroll){
    pool.appendChild(scroll.tray);
    setTimeout(() => scroll.tray.style.setProperty("--tray-height", scroll.roll.scrollHeight + "px"));
  }
  if(isOpen) shownPool = feature.id;
  else if(shownPool === feature.id) shownPool = null;
  return pool;
}

let shownActive = null;

function toggleTracker(feature){
  const isOn = state.play.active.includes(feature.id);
  const {token, onLabel, offLabel, onNote, offNote} = feature.tracker;
  const label = isOn ? onLabel : offLabel;
  const note = isOn ? onNote : offNote;
  const flip = () => {
    if(!isOn) spawnFx("withdraw", row.getBoundingClientRect());
    toggleActive(feature.id);
  };
  const row = el("div", "tracker");
  if(!token){
    row.appendChild(actionButton(label, {chosen: isOn}, flip));
    if(note) row.appendChild(el("span", "toggle-note", note));
    return row;
  }
  const wasOn = shownActive === null ? isOn : shownActive.includes(feature.id);
  const toggle = el("button", "toggle-token");
  toggle.type = "button";
  toggle.dataset.token = token;
  toggle.dataset.on = isOn ? "on" : "off";
  toggle.dataset.motion = isOn === wasOn ? "still" : isOn ? "close" : "open";
  toggle.setAttribute("aria-label", label);
  toggle.addEventListener("click", flip);
  const words = el("span", "toggle-words");
  words.appendChild(el("b", "toggle-label", label));
  if(note) words.appendChild(el("span", "toggle-note", note));
  row.append(toggle, words);
  return row;
}

function slotSpendTracker(feature){
  const row = el("div", "tracker");
  Object.keys(state.character.spellcasting.slots).forEach(level => {
    const button = actionButton(`Lv ${level} · ${slotDice(feature.tracker, Number(level))}`, {tone: "radiant"}, () => {
      spawnFx("holy", button.getBoundingClientRect(), {tone: "radiant"});
      playSlotSpent(level, spendSlot(level));
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
    const name = el("h3", "feature-name", feature.name);
    const tracker = feature.tracker ? TRACKERS[feature.tracker.kind](feature) : null;
    if(tracker && feature.tracker.kind === "uses"){
      const head = el("div", "feature-head");
      head.append(name, tracker);
      item.appendChild(head);
    }else if(tracker && feature.tracker.kind === "toggle"){
      const head = el("div", "feature-head");
      head.appendChild(name);
      if(feature.tracker.stamp && state.play.active.includes(feature.id)) head.appendChild(el("span", "toggle-stamp", feature.tracker.stamp));
      item.append(head, tracker);
    }else if(tracker && feature.tracker.kind === "pool"){
      const head = el("div", "feature-head");
      head.append(name, el("span", "tracker-note", RECHARGE_LABEL[feature.tracker.recharge]));
      item.append(head, tracker);
    }else{
      item.appendChild(name);
      if(tracker) item.appendChild(tracker);
    }
    item.appendChild(el("p", "feature-text", feature.text));
    box.appendChild(item);
  });
  main.appendChild(box);
  shownActive = state.play.active;
}
