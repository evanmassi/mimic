import {DRAW_LINE_WIDTH} from "../data/constants.js";
import {state} from "../store/state.js";
import {setNoteText, setDrawing, clearDrawing} from "../store/notes.js";
import {makeField} from "../ui/field.js";
import {makeFrame} from "../ui/frame.js";
import {el} from "./dom.js";
import {actionButton} from "./controls.js";

function mountPad(pad){
  const {width, height} = pad.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  pad.width = width * ratio;
  pad.height = height * ratio;
  const ink = pad.getContext("2d");
  ink.scale(ratio, ratio);
  ink.lineCap = "round";
  ink.lineJoin = "round";
  ink.lineWidth = DRAW_LINE_WIDTH;
  ink.strokeStyle = getComputedStyle(pad).color;
  if(state.notes.drawing){
    const saved = new Image();
    saved.onload = () => ink.drawImage(saved, 0, 0, width, height);
    saved.src = state.notes.drawing;
  }
  let isDrawing = false;
  pad.addEventListener("pointerdown", event => {
    isDrawing = true;
    pad.setPointerCapture(event.pointerId);
    ink.beginPath();
    ink.moveTo(event.offsetX, event.offsetY);
  });
  pad.addEventListener("pointermove", event => {
    if(!isDrawing) return;
    ink.lineTo(event.offsetX, event.offsetY);
    ink.stroke();
  });
  pad.addEventListener("pointerup", () => {
    if(!isDrawing) return;
    isDrawing = false;
    setDrawing(pad.toDataURL());
  });
}

export function renderNotes(main){
  const box = makeFrame(el("section", "notes"), "Notes");
  const text = el("textarea", "notes-text");
  text.value = state.notes.text;
  text.placeholder = "Initiative order, names, what the innkeeper said…";
  text.addEventListener("input", () => setNoteText(text.value));
  const pad = el("canvas", "notes-pad");
  box.append(makeField(text), pad, actionButton("Clear drawing", {}, clearDrawing));
  main.appendChild(box);
  mountPad(pad);
}
