import {NOTICE_MS} from "../data/constants.js";
import {state} from "../store/state.js";
import {undo, dismissNotice, loseConcentration} from "../store/play.js";
import {concentrationDc} from "../rules/play.js";
import {saveBonus} from "../rules/sheet.js";
import {signed} from "../rules/format.js";
import {el} from "./dom.js";
import {actionButton} from "./controls.js";

let shownId = null;

function undoButton(isCompact){
  const button = actionButton(isCompact ? "" : "Undo", {}, undo);
  button.classList.add("notice-undo");
  button.dataset.size = isCompact ? "compact" : "full";
  button.setAttribute("aria-label", "Undo");
  return button;
}

function changeParts(){
  const {note} = state.history[state.history.length - 1];
  const text = el("span", "notice-text");
  if(note.value){
    const value = el("b", "notice-value", note.value);
    value.dataset.tone = note.tone || "none";
    text.appendChild(value);
  }
  text.appendChild(el("span", "notice-label", note.text));
  return [text, undoButton(false)];
}

function concentrationParts(notice){
  const stamp = el("span", "notice-stamp");
  stamp.append(el("span", "notice-stamp-label", "DC"), el("span", "notice-stamp-value", String(concentrationDc(notice.damage))));
  const sub = el("span", "notice-sub");
  sub.append(el("span", "notice-label", "CON save"), el("b", "notice-bonus", signed(saveBonus(state.character, "con"))));
  const main = el("span", "notice-main");
  main.append(el("span", "notice-title", "Concentration"), sub);
  const actions = el("span", "notice-actions");
  actions.append(actionButton("Held", {tone: "mana"}, () => dismissNotice(notice.id)), actionButton("Lost", {}, loseConcentration), undoButton(true));
  return [stamp, main, actions];
}

export function makeNotice(){
  const notice = state.notice;
  if(!notice || (notice.kind === "change" && !state.history.length)) return null;
  const box = el("div", "notice");
  box.dataset.kind = notice.kind;
  box.dataset.motion = notice.id === shownId ? "still" : "in";
  shownId = notice.id;
  box.append(...(notice.kind === "concentration" ? concentrationParts(notice) : changeParts()));
  if(notice.kind === "change") setTimeout(() => dismissNotice(notice.id), NOTICE_MS);
  return box;
}
