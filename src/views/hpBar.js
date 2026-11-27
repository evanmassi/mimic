import {HP_DRAG_TAP_PX, HP_CRACKS} from "../data/constants.js";
import {state} from "../store/state.js";
import {adjustHp} from "../store/play.js";
import {adjusted, dragAmount, hpWear, deathFate} from "../rules/play.js";
import {hpMax} from "../rules/sheet.js";
import {signed} from "../rules/format.js";
import {spawnFx} from "../ui/fx.js";
import {el} from "./dom.js";
import {openHpDrawer} from "./drawers/hpDrawer.js";

let paintedWear = null;

function crack(index){
  const piece = el("span", "hp-crack");
  piece.dataset.crack = String(index);
  return piece;
}

export function makeHpBar(){
  const bar = el("div", "hp-bar");
  const fill = el("span", "hp-fill");
  const temp = el("span", "hp-temp");
  const cracks = HP_CRACKS.map((_, index) => crack(index));
  const impact = el("span", "hp-impact");
  const text = el("span", "hp-text");
  const delta = el("span", "hp-delta");
  bar.append(fill, temp, ...cracks, impact, text, delta);
  bar.addEventListener("animationend", event => { if(event.target === bar) bar.classList.remove("hit", "shatter"); });
  const max = hpMax(state.character, state.play);

  const paint = (play, change) => {
    const total = Math.max(max, play.hp + play.tempHp);
    fill.style.width = play.hp / total * 100 + "%";
    temp.style.left = play.hp / total * 100 + "%";
    temp.style.width = play.tempHp / total * 100 + "%";
    text.textContent = `${play.hp} / ${max}` + (play.tempHp ? `  +${play.tempHp}` : "");
    delta.textContent = change ? signed(change) : "";
    delta.dataset.sign = change < 0 ? "down" : change > 0 ? "up" : "none";
    const wear = hpWear(play, max);
    bar.style.setProperty("--wear", wear.toFixed(3));
    bar.dataset.fate = deathFate(play);
    cracks.forEach((piece, index) => {
      const {at, along} = HP_CRACKS[index];
      const isOn = wear >= at;
      if(isOn && play.hp > 0 && paintedWear !== null && paintedWear < at){
        setTimeout(() => {
          const box = bar.getBoundingClientRect();
          spawnFx("shatter", {left: box.left + box.width * along, top: box.top, width: 0, height: box.height});
        });
      }
      piece.dataset.on = isOn ? "on" : "off";
    });
    paintedWear = wear;
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
