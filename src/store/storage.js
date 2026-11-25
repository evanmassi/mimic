import {CHARACTER_KEY, PLAY_KEY, NOTES_KEY} from "../data/constants.js";

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

export function loadPlay(){
  const play = readJson(PLAY_KEY);
  if(!play) return null;
  return {...play, slotsSpent: Object.fromEntries(Object.entries(play.slotsSpent).map(([level, spent]) => [level, countToIndexes(spent)]))};
}
export const savePlay = play => writeJson(PLAY_KEY, play);

export const loadNotes = () => readJson(NOTES_KEY);
export const saveNotes = notes => writeJson(NOTES_KEY, notes);
