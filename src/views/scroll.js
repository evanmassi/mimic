import {TRAY_CLOSE_MS} from "../data/constants.js";
import {closeTray} from "../store/state.js";
import {el} from "./dom.js";
import {actionButton} from "./controls.js";

export function rollUp(scroll){
  if(scroll.dataset.motion === "close") return;
  scroll.dataset.motion = "close";
  setTimeout(closeTray, TRAY_CLOSE_MS);
}

export function makeScroll(title, isOpening){
  const scroll = el("div", "tray");
  scroll.dataset.motion = isOpening ? "open" : "still";
  scroll.style.setProperty("--tray-close", TRAY_CLOSE_MS + "ms");
  const head = el("div", "tray-head");
  head.append(el("span", "tray-title", title), actionButton("Close", {icon: "close"}, () => rollUp(scroll)));
  const body = el("div", "tray-body");
  body.appendChild(head);
  const roll = el("div", "tray-roll");
  roll.appendChild(body);
  scroll.append(el("div", "tray-lip"), roll, el("div", "tray-rod"));
  return {tray: scroll, roll, body};
}
