import {CHARACTER_KEY, PLAY_KEY, NOTES_KEY} from "../data/constants.js";
import {formulaValue} from "../rules/sheet.js";

function readJson(key){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

function writeJson(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){}
}

export const loadCharacter = () => readJson(CHARACTER_KEY);
export const saveCharacter = character => writeJson(CHARACTER_KEY, character);

const countToIndexes = spent => Array.isArray(spent) ? spent : Array.from({length: spent}, (_, index) => index);

function usesToIndexes(character, id, spent){
  const feature = character.features.find(one => one.id === id);
  if(Array.isArray(spent) || !feature || !feature.tracker || feature.tracker.kind !== "uses") return spent;
  const max = formulaValue(character, feature.tracker.max);
  return Array.from({length: spent}, (_, at) => max - 1 - at);
}

export function loadPlay(character){
  const play = readJson(PLAY_KEY);
  if(!play) return null;
  return {...play,
    slotsSpent: Object.fromEntries(Object.entries(play.slotsSpent).map(([level, spent]) => [level, countToIndexes(spent)])),
    spent: Object.fromEntries(Object.entries(play.spent).map(([id, spent]) => [id, usesToIndexes(character, id, spent)]))};
}
export const savePlay = play => writeJson(PLAY_KEY, play);

export const loadNotes = () => readJson(NOTES_KEY);
export const saveNotes = notes => writeJson(NOTES_KEY, notes);
