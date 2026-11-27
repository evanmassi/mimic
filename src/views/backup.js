import {state, toggleBackupOpen} from "../store/state.js";
import {markBackupSaved} from "../store/backup.js";
import {makeBackup, backupFileName, readBackup} from "../rules/backup.js";
import {shortDate} from "../rules/format.js";
import {el} from "./dom.js";
import {actionButton} from "./controls.js";
import {openBackupDrawer} from "./drawers/backupDrawer.js";

function saveBackup(){
  const savedAt = new Date().toISOString();
  const {character, play, notes} = state;
  const file = new File([JSON.stringify(makeBackup(character, play, notes, savedAt), null, 2)], backupFileName(character, savedAt),
    {type: "application/json"});
  if(navigator.canShare && navigator.canShare({files: [file]})){
    navigator.share({files: [file], title: "Mimic backup"}).then(() => markBackupSaved(savedAt), () => {});
    return;
  }
  const link = el("a");
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href));
  markBackupSaved(savedAt);
}

function loadBackup(){
  const picker = el("input");
  picker.type = "file";
  picker.accept = ".json,application/json";
  picker.addEventListener("change", () => {
    const file = picker.files[0];
    if(file) file.text().then(text => openBackupDrawer(readBackup(text)));
  });
  picker.click();
}

export function renderBackup(main){
  const box = el("section", "backup");
  box.dataset.open = state.isBackupOpen ? "on" : "off";
  const toggle = el("button", "backup-toggle");
  toggle.type = "button";
  toggle.append(el("span", "backup-title", "Backup"),
    el("span", "backup-when", state.lastBackup ? "Last saved " + shortDate(state.lastBackup) : "Never saved"));
  toggle.addEventListener("click", toggleBackupOpen);
  box.appendChild(toggle);
  if(state.isBackupOpen){
    const actions = el("div", "backup-actions");
    actions.append(actionButton("Save a backup", {}, saveBackup), actionButton("Load a backup", {}, loadBackup));
    box.append(el("p", "backup-text", "Your sheet is stored only on this device."), actions);
  }
  main.appendChild(box);
}
