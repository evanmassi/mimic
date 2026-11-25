import {state} from "../../store/state.js";
import {shortRest, longRest} from "../../store/play.js";
import {spawnFx} from "../../ui/fx.js";
import {el} from "../dom.js";
import {openDrawer, closeDrawer} from "./drawer.js";

function restChoice(name, detail, onRest){
  const row = el("button", "pick");
  row.type = "button";
  row.append(el("b", "pick-name", name), el("span", "pick-effect", detail));
  row.addEventListener("click", () => {
    onRest();
    closeDrawer();
  });
  return row;
}

export function openRestDrawer(){
  const body = openDrawer("Rest");
  const shortNames = state.character.features
    .filter(feature => feature.tracker && feature.tracker.recharge === "short")
    .map(feature => feature.name);
  const shortDetail = (shortNames.length ? shortNames.join(", ") + " come back. " : "") +
    "Spend hit dice on the sheet, then heal on the HP bar.";
  body.append(
    restChoice("Short rest", shortDetail, shortRest),
    restChoice("Long rest", "Full HP, half your hit dice back, every slot and feature back, one level of exhaustion off.", () => {
      spawnFx("moon", {left: 0, top: 0, width: 0, height: 0}, {text: "☾"});
      longRest();
    }));
}
