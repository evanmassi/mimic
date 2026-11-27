import {saveCharacter, savePlay, saveNotes, saveLastBackup} from "./storage.js";
import {state, hydrate, changes} from "./state.js";

export function restoreBackup(backup){
  saveCharacter(backup.character);
  savePlay(backup.play);
  saveNotes(backup.notes);
  hydrate();
  changes.notify();
}

export function markBackupSaved(savedAt){
  state.lastBackup = savedAt;
  saveLastBackup(savedAt);
  changes.notify();
}
