import {ROLL_LABEL} from "../data/constants.js";
import {makeButton} from "../ui/button.js";
import {makeField} from "../ui/field.js";
import {el} from "./dom.js";

export function diceMark(roll){
  const mark = el("span", "dice-mark", ROLL_LABEL[roll]);
  mark.dataset.roll = roll;
  return mark;
}

export function numberBox(placeholder, value){
  const input = el("input");
  input.type = "text";
  input.inputMode = "numeric";
  input.pattern = "[0-9]*";
  input.placeholder = placeholder;
  input.value = value;
  input.addEventListener("input", () => { input.value = input.value.replace(/\D/g, ""); });
  return input;
}

export const readAmount = input => {
  const value = parseInt(input.value, 10);
  return value > 0 ? value : null;
};

export function amountRow(outcomes){
  const input = numberBox("Amount", "");
  const shown = outcomes.map(outcome => {
    const result = el("span", "outcome-result", outcome.cost ? outcome.result(outcome.cost) : "");
    const button = actionButton("", {tone: outcome.tone}, () => {
      const amount = outcome.cost || readAmount(input);
      if(amount !== null) outcome.apply(amount);
    });
    button.classList.add("outcome");
    button.disabled = Boolean(outcome.isOff);
    button.append(el("span", "outcome-word", outcome.label), result);
    return {button, result, outcome};
  });
  input.addEventListener("input", () => {
    const amount = readAmount(input);
    shown.filter(({outcome}) => !outcome.cost).forEach(({result, outcome}) => { result.textContent = amount === null ? "" : outcome.result(amount); });
  });
  const row = el("div", "amount-row");
  row.append(makeField(input), ...shown.map(({button}) => button));
  return row;
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

const grow = box => {
  box.style.height = "auto";
  box.style.height = box.scrollHeight + "px";
};

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
    if(isLong) grow(input);
    const read = READ[kind](input.value);
    if(read !== null) onSave(read);
  });
  if(isLong) setTimeout(() => grow(input));
  return makeField(input);
}
