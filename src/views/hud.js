import {DEATH_SAVE_COUNT, HIT_BUZZ_MS, FALL_BUZZ_MS, TRAY_CLOSE_MS} from "../data/constants.js";
import {CONDITIONS, EXHAUSTION} from "../data/conditions.js";
import {state, toggleEditing, openConditionTray, closeConditionTray} from "../store/state.js";
import {adjustHp, setDeathSaves, setExhaustion, toggleCondition} from "../store/play.js";
import {armorClass, speed, activeConditions, conditionCause} from "../rules/sheet.js";
import {signed} from "../rules/format.js";
import {makeDots} from "../ui/dots.js";
import {spawnFx, buzz} from "../ui/fx.js";
import {el} from "./dom.js";
import {actionButton} from "./controls.js";
import {makeHpBar} from "./hpBar.js";
import {slotDots} from "./spells.js";
import {openRestDrawer} from "./drawers/restDrawer.js";

const CAUSE_NOTES = {feature: "From an active feature. ", zeroHp: "From dropping to 0 HP. "};
const shown = {hp: null, tempHp: null, ac: null, conditions: null, isTrayOpen: false};

function badge(className, value, label, isChanged){
  const box = el("div", className);
  box.dataset.changed = isChanged ? "on" : "off";
  box.append(el("b", "badge-value", String(value)), el("span", "badge-label", label));
  return box;
}

function topRow(){
  const {character, play} = state;
  const row = el("div", "hud-top");
  const ac = armorClass(character, play);
  const moves = speed(character, play);
  const acBadge = badge("hud-ac", ac, "AC", ac !== character.armorClass);
  if(shown.ac !== null && ac !== shown.ac) acBadge.classList.add("slam");
  shown.ac = ac;
  row.append(
    el("div", "hud-name", character.name),
    acBadge,
    badge("hud-speed", moves, "speed", moves !== character.speed),
    actionButton(state.isEditing ? "Done" : "Edit", {tone: "arcane", chosen: state.isEditing}, toggleEditing),
    actionButton("Rest", {}, openRestDrawer));
  return row;
}

function celebrate(bar){
  const {hp, tempHp} = state.play;
  if(shown.hp !== null){
    const change = hp + tempHp - shown.hp - shown.tempHp;
    const rect = bar.getBoundingClientRect();
    const isFalling = hp === 0 && shown.hp > 0;
    if(change < 0){
      bar.classList.add(isFalling ? "shatter" : "hit");
      spawnFx(isFalling ? "fall" : "blood", rect);
      spawnFx("number", rect, {tone: "blood", text: signed(change)});
      buzz(isFalling ? FALL_BUZZ_MS : HIT_BUZZ_MS);
    }
    if(hp > shown.hp){
      bar.classList.add("healed");
      spawnFx("sparkle", rect);
      spawnFx("number", rect, {tone: "verdant", text: signed(hp - shown.hp)});
    }
    if(tempHp > shown.tempHp) spawnFx("shimmer", rect);
  }
  shown.hp = hp;
  shown.tempHp = tempHp;
}

function hpRow(){
  const row = el("div", "hud-hp");
  const bar = makeHpBar();
  row.append(actionButton("−", {}, () => adjustHp(-1)), bar, actionButton("+", {}, () => adjustHp(1)));
  return {row, bar};
}

function deathSaves(){
  const {successes, failures} = state.play.deathSaves;
  const group = el("div", "hud-death");
  group.append(
    el("span", "hud-mini-label", "saves"),
    makeDots(DEATH_SAVE_COUNT, successes, count => setDeathSaves("successes", count), "life"),
    el("span", "hud-mini-label", "fails"),
    makeDots(DEATH_SAVE_COUNT, failures, count => setDeathSaves("failures", count), "death"));
  return group;
}

function conditionTag(condition, onPress){
  const tag = el("button", "tag", condition.name);
  tag.type = "button";
  tag.dataset.condition = condition.key;
  tag.addEventListener("click", onPress);
  return tag;
}

function setExhaustionFromHud(level){
  if(state.conditionTray) openConditionTray("exhaustion");
  setExhaustion(level);
}

function statusRow(tray){
  const row = el("div", "hud-status");
  if(state.play.hp === 0) row.appendChild(deathSaves());
  const tags = activeConditions(state.character, state.play).map(condition => {
    const tag = conditionTag(condition, () => openConditionTray(condition.key));
    row.appendChild(tag);
    return {condition, tag};
  });
  const add = el("button", "tag tag-add", tray ? "− condition" : "+ condition");
  add.type = "button";
  add.dataset.open = tray ? "on" : "off";
  add.addEventListener("click", () => tray ? rollUp(tray) : openConditionTray(null));
  const exhaustion = el("span", "hud-exhaustion");
  exhaustion.append(el("span", "hud-mini-label", "exh"), makeDots(EXHAUSTION.length, state.play.exhaustion, setExhaustionFromHud, "weary"));
  row.append(add, exhaustion);
  return {row, tags};
}

function rollUp(tray){
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

function conditionTray(){
  const active = activeConditions(state.character, state.play).map(({key}) => key);
  const causes = Object.fromEntries(active.map(key => [key, conditionCause(state.character, state.play, key)]));
  const tray = el("div", "tray");
  tray.dataset.motion = shown.isTrayOpen ? "still" : "open";
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

function announce(tags){
  if(shown.conditions !== null){
    tags.filter(({condition}) => !shown.conditions.includes(condition.key))
      .forEach(({condition, tag}) => spawnFx(condition.fx, tag.getBoundingClientRect()));
  }
  shown.conditions = tags.map(({condition}) => condition.key);
}

function slotRow(){
  const row = el("div", "hud-slots");
  Object.keys(state.character.spellcasting.slots).forEach(level => {
    const group = el("span", "hud-slot");
    group.append(el("span", "hud-mini-label", "lv " + level), slotDots(level));
    row.appendChild(group);
  });
  return row;
}

export function renderHud(hud){
  hud.innerHTML = "";
  const hp = hpRow();
  const {tray, roll} = state.conditionTray ? conditionTray() : {tray: null, roll: null};
  const status = statusRow(tray);
  hud.append(topRow(), hp.row, status.row);
  if(tray){
    hud.appendChild(tray);
    tray.style.setProperty("--tray-height", roll.scrollHeight + "px");
  }
  if(state.character.spellcasting) hud.appendChild(slotRow());
  celebrate(hp.bar);
  announce(status.tags);
  shown.isTrayOpen = Boolean(tray);
}
