import {DEATH_SAVE_COUNT, HIT_BUZZ_MS} from "../data/constants.js";
import {EXHAUSTION} from "../data/conditions.js";
import {state, toggleEditing} from "../store/state.js";
import {adjustHp, setDeathSaves, setExhaustion} from "../store/play.js";
import {armorClass, speed, activeConditions} from "../rules/sheet.js";
import {signed} from "../rules/format.js";
import {makeDots} from "../ui/dots.js";
import {spawnFx, buzz} from "../ui/fx.js";
import {el} from "./dom.js";
import {actionButton} from "./controls.js";
import {makeHpBar} from "./hpBar.js";
import {slotDots} from "./spells.js";
import {openConditionDrawer} from "./drawers/conditionDrawer.js";
import {openRestDrawer} from "./drawers/restDrawer.js";

const shown = {hp: null, tempHp: null, ac: null};

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
    if(change < 0){
      bar.classList.add("hit");
      spawnFx("blood", rect);
      spawnFx("number", rect, {tone: "blood", text: signed(change)});
      buzz(HIT_BUZZ_MS);
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

function statusRow(){
  const row = el("div", "hud-status");
  if(state.play.hp === 0) row.appendChild(deathSaves());
  activeConditions(state.character, state.play).forEach(condition => {
    const tag = el("button", "tag", condition.name);
    tag.type = "button";
    tag.addEventListener("click", openConditionDrawer);
    row.appendChild(tag);
  });
  const add = el("button", "tag tag-add", "+ condition");
  add.type = "button";
  add.addEventListener("click", openConditionDrawer);
  const exhaustion = el("span", "hud-exhaustion");
  exhaustion.append(el("span", "hud-mini-label", "exh"), makeDots(EXHAUSTION.length, state.play.exhaustion, setExhaustion, "weary"));
  row.append(add, exhaustion);
  return row;
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
  hud.append(topRow(), hp.row, statusRow());
  if(state.character.spellcasting) hud.appendChild(slotRow());
  celebrate(hp.bar);
}
