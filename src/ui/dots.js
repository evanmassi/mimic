import {spawnFx, buzz} from "./fx.js";

const TAP_MS = 8;

const FEELS = {
  plain: {tone: "ink", fill: "seal", empty: "puff", buzzFill: TAP_MS, buzzEmpty: TAP_MS},
  mana: {tone: "mana", fill: "charge", empty: "mana", buzzFill: [8, 30, 8], buzzEmpty: [45, 25, 20]},
  holy: {tone: "radiant", fill: "seal", empty: "holy", buzzFill: TAP_MS, buzzEmpty: [15, 50, 15]},
  life: {tone: "verdant", fill: "heartbeat", complete: "stable", empty: "puff",
    buzzFill: [25, 90, 35], buzzComplete: [25, 90, 35, 250, 25, 90, 35], buzzEmpty: TAP_MS},
  death: {tone: "blood", fill: "skull", complete: "doom", empty: "puff",
    buzzFill: [140, 70, 260], buzzComplete: [400, 100, 600], buzzEmpty: TAP_MS},
  weary: {tone: "ink", fill: "weary", empty: "puff", buzzFill: [80, 60, 80], buzzEmpty: TAP_MS, isLevel: true}
};

function dotRow(feelName){
  const row = document.createElement("span");
  row.className = "dots";
  row.dataset.feel = feelName;
  return row;
}

function dot(index, count, isOn, onTap){
  const button = document.createElement("button");
  button.type = "button";
  button.className = "dot";
  button.dataset.on = isOn ? "on" : "off";
  button.style.setProperty("--i", String(index));
  button.setAttribute("aria-label", `${index + 1} of ${count}`);
  button.disabled = onTap === null;
  if(onTap) button.addEventListener("click", event => {
    event.stopPropagation();
    onTap();
  });
  return button;
}

function react(feel, target, isFilling, isComplete){
  spawnFx(isComplete ? feel.complete : isFilling ? feel.fill : feel.empty, target.getBoundingClientRect(), {tone: feel.tone});
  buzz(isComplete ? feel.buzzComplete : isFilling ? feel.buzzFill : feel.buzzEmpty);
}

export const playDot = (feelName, target, isFilling) => react(FEELS[feelName], target, isFilling, false);

export function makeDots(count, filled, onSet, feelName = "plain"){
  const feel = FEELS[feelName];
  const row = dotRow(feelName);
  for(let i = 0; i < count; i++) row.appendChild(dot(i, count, i < filled, onSet && (() => {
    const isFilling = i >= filled;
    const next = feel.isLevel ? (isFilling ? i + 1 : i) : filled + (isFilling ? 1 : -1);
    const changing = feel.isLevel ? row.children[i] : row.children[isFilling ? filled : filled - 1];
    react(feel, changing, isFilling, isFilling && next === count && Boolean(feel.complete));
    onSet(next);
  })));
  return row;
}

export function makeToggleDots(states, onToggle, feelName = "plain"){
  const feel = FEELS[feelName];
  const row = dotRow(feelName);
  const lit = states.filter(Boolean).length;
  states.forEach((isOn, i) => row.appendChild(dot(i, states.length, isOn, () => {
    react(feel, row.children[i], !isOn, !isOn && lit + 1 === states.length && Boolean(feel.complete));
    onToggle(i);
  })));
  return row;
}
