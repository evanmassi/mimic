import {DEATH_SAVE_COUNT, HIT_BUZZ_MS, FALL_BUZZ_MS} from "../data/constants.js";
import {EXHAUSTION} from "../data/conditions.js";
import {state, toggleEditing, openConditionTray} from "../store/state.js";
import {adjustHp, setDeathSaves, setExhaustion, undo} from "../store/play.js";
import {armorClass, speed, activeConditions} from "../rules/sheet.js";
import {signed} from "../rules/format.js";
import {makeDots, playDot} from "../ui/dots.js";
import {spawnFx, buzz} from "../ui/fx.js";
import {el} from "./dom.js";
import {actionButton} from "./controls.js";
import {makeHpBar} from "./hpBar.js";
import {slotDots} from "./spells.js";
import {openRestDrawer} from "./drawers/restDrawer.js";
import {conditionTag, rollUp, makeConditionTray} from "./conditionTray.js";
import {makeNotice} from "./notice.js";

const shown = {hp: null, tempHp: null, ac: null, conditions: null, isTrayOpen: false};
const slotOrbs = {};

function badge(className, value, label, isChanged){
  const box = el("div", className);
  box.dataset.changed = isChanged ? "on" : "off";
  box.append(el("b", "badge-value", String(value)), el("span", "badge-label", label));
  return box;
}

function tools(){
  const canUndo = state.history.length > 0;
  const undoButton = actionButton("Undo", {icon: "undo", tone: canUndo ? "blood" : "ink"}, undo);
  undoButton.disabled = !canUndo;
  const holder = el("div", "hud-tools");
  holder.append(undoButton,
    actionButton(state.isEditing ? "Done editing" : "Edit", {icon: "quill", chosen: state.isEditing}, toggleEditing),
    actionButton("Rest", {icon: "moon"}, openRestDrawer));
  return holder;
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
    tools());
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
    slotOrbs[level] = slotDots(level);
    group.append(el("span", "hud-mini-label", "lv " + level), slotOrbs[level]);
    row.appendChild(group);
  });
  return row;
}

export const playSlotSpent = (level, index) => playDot("mana", slotOrbs[level].children[index], false);

export function renderHud(hud){
  hud.innerHTML = "";
  const hp = hpRow();
  const {tray, roll} = state.conditionTray ? makeConditionTray(!shown.isTrayOpen) : {tray: null, roll: null};
  const status = statusRow(tray);
  const notice = makeNotice();
  hud.append(topRow(), hp.row);
  if(notice) hud.appendChild(notice);
  hud.appendChild(status.row);
  if(tray){
    hud.appendChild(tray);
    tray.style.setProperty("--tray-height", roll.scrollHeight + "px");
  }
  if(state.character.spellcasting) hud.appendChild(slotRow());
  celebrate(hp.bar);
  announce(status.tags);
  shown.isTrayOpen = Boolean(tray);
}
