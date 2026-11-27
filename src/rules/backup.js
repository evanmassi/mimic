import {APP_VERSION, BACKUP_FORMAT} from "../data/constants.js";
import {newPlay} from "./play.js";

const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);

export const makeBackup = (character, play, notes, savedAt) =>
  ({app: "mimic", format: BACKUP_FORMAT, appVersion: APP_VERSION, savedAt, character, play, notes});

export const backupFileName = (character, savedAt) =>
  `${character.name.replace(/[\\/:*?"<>|]/g, "")} - Mimic backup ${savedAt.slice(0, 10)}.json`;

export function readBackup(text){
  let data;
  try{ data = JSON.parse(text); }catch(e){ return null; }
  if(!isObject(data) || data.app !== "mimic" || !(data.format >= 1 && data.format <= BACKUP_FORMAT)) return null;
  const {character} = data;
  if(!isObject(character) || typeof character.name !== "string" || typeof character.level !== "number" || !isObject(character.scores)) return null;
  return {
    savedAt: typeof data.savedAt === "string" ? data.savedAt : null,
    character,
    play: isObject(data.play) ? data.play : newPlay(character),
    notes: isObject(data.notes) ? data.notes : {text: "", drawing: null}
  };
}
