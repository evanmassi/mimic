import {ROLL_LABEL} from "../data/constants.js";
import {makeButton} from "../ui/button.js";
import {makeField} from "../ui/field.js";
import {el} from "./dom.js";

export function diceMark(roll){
  const mark = el("span", "dice-mark", ROLL_LABEL[roll]);
  mark.dataset.roll = roll;
  return mark;
}

export function actionButton(label, options, onPress){
  const button = makeButton(el("button"), Object.assign({label}, options));
  button.addEventListener("click", onPress);
  return button;
}

export function statBox(className, value, label, onPress){
  const box = el(onPress ? "button" : "div", className);
  if(onPress){
    box.type = "button";
    box.addEventListener("click", onPress);
  }
  box.append(el("b", "stat-value", String(value)), el("span", "stat-label", label));
  return box;
}

export function pill(value, label, onPress){
  const box = el(onPress ? "button" : "div", "pill");
  if(onPress){
    box.type = "button";
    box.addEventListener("click", onPress);
  }
  box.append(el("b", "pill-value", value), el("span", "pill-label", label));
  return box;
}

const READ = {
  number: raw => /^-?\d+$/.test(raw.trim()) ? parseInt(raw, 10) : null,
  text: raw => raw.trim() || null,
  paragraph: raw => raw.trim(),
  lines: raw => raw.split("\n").map(line => line.trim()).filter(Boolean)
};
const SHOW = {number: String, text: String, paragraph: String, lines: list => list.join("\n")};

export function editableField(kind, value, onSave, label){
  const isLong = kind === "paragraph" || kind === "lines";
  const input = el(isLong ? "textarea" : "input");
  if(!isLong){
    input.type = "text";
    input.inputMode = kind === "number" ? "numeric" : "text";
    input.addEventListener("keydown", event => { if(event.key === "Enter") input.blur(); });
  }
  input.value = SHOW[kind](value);
  input.setAttribute("aria-label", label);
  input.addEventListener("input", () => {
    const read = READ[kind](input.value);
    if(read !== null) onSave(read);
  });
  return makeField(input);
}
