import {loadCharacter, saveCharacter, loadPlay, savePlay, loadNotes, saveNotes} from "./storage.js";
import {SAMPLE_CHARACTER, SAMPLE_NOTES} from "../data/sampleCharacter.js";
import {newPlay} from "../rules/play.js";

export const state = {character: null, play: null, notes: null, isEditing: false, openAttack: null, tray: null,
  history: [], notice: null};

function channel(){
  const listeners = new Set();
  return {
    subscribe: fn => { listeners.add(fn); },
    notify: detail => listeners.forEach(fn => fn(detail))
  };
}

export const changes = channel();

export function hydrate(){
  state.character = loadCharacter() || structuredClone(SAMPLE_CHARACTER);
  state.play = loadPlay(state.character) || newPlay(state.character);
  state.notes = loadNotes() || structuredClone(SAMPLE_NOTES);
  state.history = [];
  state.notice = null;
}

export function toggleEditing(){
  state.isEditing = !state.isEditing;
  changes.notify();
}

export function setOpenAttack(index){
  state.openAttack = index;
  changes.notify();
}

export function openConditionTray(rule){
  state.tray = {kind: "conditions", rule};
  changes.notify();
}

export function openHpTray(){
  state.tray = {kind: "hp"};
  changes.notify();
}

export function closeTray(){
  state.tray = null;
  changes.notify();
}

export function persistCharacter(){ saveCharacter(state.character); }
export function persistPlay(){ savePlay(state.play); }
export function persistNotes(){ saveNotes(state.notes); }
