import {COINS} from "../data/constants.js";
import {state} from "../store/state.js";
import {setCoin, setField} from "../store/character.js";
import {makeFrame} from "../ui/frame.js";
import {el} from "./dom.js";
import {editableField} from "./controls.js";

function ruledList(field, label){
  const list = editableField("lines", state.character[field], lines => setField(field, lines), label + ", one per line");
  list.classList.add("ruled");
  return list;
}

function coinBox(coin){
  const box = el("label", "coin");
  box.append(editableField("number", state.character.coins[coin], value => setCoin(coin, Math.max(0, value)), coin.toUpperCase()),
    el("span", "stat-label", coin.toUpperCase()));
  return box;
}

export function renderEquipment(main){
  const gear = makeFrame(el("section"), "Equipment");
  const coins = el("div", "coins");
  COINS.forEach(coin => coins.appendChild(coinBox(coin)));
  gear.append(coins, ruledList("equipment", "Equipment"));

  const other = makeFrame(el("section"), "Other proficiencies & languages");
  other.appendChild(ruledList("otherProficiencies", "Other proficiencies"));
  main.append(gear, other);
}
