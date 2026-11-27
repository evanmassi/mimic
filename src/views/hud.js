import {DEATH_SAVE_COUNT, HIT_BUZZ_MS, FALL_BUZZ_MS} from "../data/constants.js";
import {EXHAUSTION} from "../data/conditions.js";
import {state, toggleEditing, openConditionTray, openHpTray} from "../store/state.js";
import {setDeathSaves, undo} from "../store/play.js";
import {armorClass, speed, activeConditions} from "../rules/sheet.js";
import {signed} from "../rules/format.js";
import {makeDots, playDot} from "../ui/dots.js";
import {spawnFx, buzz} from "../ui/fx.js";
import {el} from "./dom.js";
import {actionButton} from "./controls.js";
import {makeHpBar} from "./hpBar.js";
import {slotDots} from "./spells.js";
import {openRestDrawer} from "./drawers/restDrawer.js";
import {conditionTag, makeConditionTray} from "./conditionTray.js";
import {makeHpTray} from "./hpTray.js";
import {rollUp} from "./scroll.js";
import {makeNotice} from "./notice.js";

const shown = {hp: null, tempHp: null, ac: null, conditions: null, trayKind: null};
const TRAYS = {conditions: makeConditionTray, hp: makeHpTray};
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

function hpRow(onTap){
  const row = el("div", "hud-hp");
  const bar = makeHpBar(onTap);
  row.appendChild(bar);
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

function exhaustionChip(level){
  const chip = el("button", "tag tag-exh", "Exh");
  chip.type = "button";
  chip.setAttribute("aria-label", `Exhaustion ${level}`);
  const pips = el("span", "exh-pips");
  EXHAUSTION.forEach((_, index) => {
    const pip = el("span", "exh-pip");
    pip.dataset.on = index < level ? "on" : "off";
    pips.appendChild(pip);
  });
  chip.appendChild(pips);
  chip.addEventListener("click", () => openConditionTray("exhaustion"));
  return chip;
}

function statusRow(tray){
  const row = el("div", "hud-status");
  const add = el("button", "tag tag-add", tray ? "−" : "+");
  add.type = "button";
  add.dataset.open = tray ? "on" : "off";
  add.setAttribute("aria-label", tray ? "Roll up conditions" : "Add a condition");
  add.addEventListener("click", () => tray ? rollUp(tray) : openConditionTray(null));
  row.appendChild(add);
  const tags = activeConditions(state.character, state.play).map(condition => {
    const tag = conditionTag(condition, () => openConditionTray(condition.key));
    row.appendChild(tag);
    return {condition, tag};
  });
  if(state.play.exhaustion) row.appendChild(exhaustionChip(state.play.exhaustion));
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

function lowRow(){
  if(state.play.hp === 0) return deathSaves();
  return state.character.spellcasting ? slotRow() : null;
}

export const playSlotSpent = (level, index) => playDot("mana", slotOrbs[level].children[index], false);

export function renderHud(hud){
  hud.innerHTML = "";
  const kind = state.tray ? state.tray.kind : null;
  const made = kind ? TRAYS[kind](kind !== shown.trayKind) : null;
  const hp = hpRow(() => kind === "hp" ? rollUp(made.tray) : openHpTray());
  const status = statusRow(kind === "conditions" ? made.tray : null);
  const notice = makeNotice();
  const low = lowRow();
  hud.append(topRow(), hp.row);
  if(kind === "hp") hud.appendChild(made.tray);
  if(notice) hud.appendChild(notice);
  if(low) hud.appendChild(low);
  hud.appendChild(status.row);
  if(kind === "conditions") hud.appendChild(made.tray);
  if(made) made.tray.style.setProperty("--tray-height", made.roll.scrollHeight + "px");
  celebrate(hp.bar);
  announce(status.tags);
  shown.trayKind = kind;
}
