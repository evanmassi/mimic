import {state} from "../../store/state.js";
import {restoreBackup} from "../../store/backup.js";
import {shortDate} from "../../rules/format.js";
import {el} from "../dom.js";
import {actionButton} from "../controls.js";
import {openDrawer, closeDrawer} from "./drawer.js";

function personCard(character, note){
  const card = el("div", "backup-card");
  card.append(el("b", "backup-name", character.name), el("span", "backup-meta", `${character.className} ${character.level} · ${note}`));
  return card;
}

export function openBackupDrawer(backup){
  const body = openDrawer("Load a backup");
  if(!backup){
    body.appendChild(el("p", "backup-warn", "This file isn't a Mimic backup, so nothing was changed."));
    return;
  }
  const swap = el("div", "backup-swap");
  swap.append(personCard(state.character, "on this phone now"), el("span", "backup-arrow", "→"),
    personCard(backup.character, backup.savedAt ? "backup from " + shortDate(backup.savedAt) : "backup"));
  const actions = el("div", "drawer-actions");
  actions.appendChild(actionButton("Replace with the backup", {tone: "blood"}, () => {
    restoreBackup(backup);
    closeDrawer();
  }));
  body.append(swap, el("p", "backup-warn", "This replaces the sheet, the session (HP, slots, conditions) and your notes on this phone. It can't be undone, so save a backup of the current one first if you might want it."), actions);
}
