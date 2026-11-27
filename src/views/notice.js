import {state} from "../store/state.js";
import {dismissNotice, loseConcentration} from "../store/play.js";
import {concentrationDc} from "../rules/play.js";
import {saveBonus} from "../rules/sheet.js";
import {signed} from "../rules/format.js";
import {el} from "./dom.js";
import {actionButton} from "./controls.js";

let shownId = null;

export function makeNotice(){
  const notice = state.notice;
  if(!notice) return null;
  const stamp = el("span", "notice-stamp");
  stamp.append(el("span", "notice-stamp-label", "DC"), el("span", "notice-stamp-value", String(concentrationDc(notice.damage))));
  const sub = el("span", "notice-sub");
  sub.append(el("span", "notice-label", "CON save"), el("b", "notice-bonus", signed(saveBonus(state.character, "con"))));
  const main = el("span", "notice-main");
  main.append(el("span", "notice-title", "Concentration"), sub);
  const actions = el("span", "notice-actions");
  actions.append(actionButton("Held", {tone: "mana"}, () => dismissNotice(notice.id)), actionButton("Lost", {}, loseConcentration));
  const box = el("div", "notice");
  box.dataset.motion = notice.id === shownId ? "still" : "in";
  shownId = notice.id;
  box.append(stamp, main, actions);
  return box;
}
