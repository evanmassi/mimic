import {state, changes, persistNotes} from "./state.js";

export function setNoteText(text){
  state.notes = {...state.notes, text};
  persistNotes();
}

export function setDrawing(drawing){
  state.notes = {...state.notes, drawing};
  persistNotes();
}

export function clearDrawing(){
  setDrawing(null);
  changes.notify();
}
