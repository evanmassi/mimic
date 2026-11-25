import {HP_DRAG_TAP_PX} from "../data/constants.js";
import {state} from "../store/state.js";
import {adjustHp} from "../store/play.js";
import {adjusted, dragAmount} from "../rules/play.js";
import {hpMax} from "../rules/sheet.js";
import {signed} from "../rules/format.js";
import {el} from "./dom.js";
import {openHpDrawer} from "./drawers/hpDrawer.js";

export function makeHpBar(){
  const bar = el("div", "hp-bar");
  const fill = el("span", "hp-fill");
  const temp = el("span", "hp-temp");
  const text = el("span", "hp-text");
  const delta = el("span", "hp-delta");
  bar.append(fill, temp, text, delta);
  const max = hpMax(state.character, state.play);

  const paint = (play, change) => {
    const total = Math.max(max, play.hp + play.tempHp);
    fill.style.width = play.hp / total * 100 + "%";
    temp.style.left = play.hp / total * 100 + "%";
    temp.style.width = play.tempHp / total * 100 + "%";
    text.textContent = `${play.hp} / ${max}` + (play.tempHp ? `  +${play.tempHp}` : "");
    delta.textContent = change ? signed(change) : "";
    delta.dataset.sign = change < 0 ? "down" : change > 0 ? "up" : "none";
  };

  let startX = null, isDragging = false, change = 0;
  const reset = () => {
    startX = null;
    isDragging = false;
    bar.dataset.dragging = "off";
  };
  bar.addEventListener("pointerdown", event => {
    startX = event.clientX;
    change = 0;
    bar.setPointerCapture(event.pointerId);
    bar.dataset.dragging = "on";
  });
  bar.addEventListener("pointermove", event => {
    if(startX === null) return;
    const dx = event.clientX - startX;
    if(!isDragging && Math.abs(dx) < HP_DRAG_TAP_PX) return;
    isDragging = true;
    change = dragAmount(dx, bar.clientWidth, state.play, max);
    paint(adjusted(state.play, change, max), change);
  });
  bar.addEventListener("pointerup", () => {
    if(startX === null) return;
    const wasDragging = isDragging;
    reset();
    if(!wasDragging) openHpDrawer();
    else if(change) adjustHp(change);
    else paint(state.play, 0);
  });
  bar.addEventListener("pointercancel", () => {
    reset();
    paint(state.play, 0);
  });

  paint(state.play, 0);
  return bar;
}
