import {APP_VERSION} from "../data/constants.js";
import {state} from "../store/state.js";
import {byId, el} from "./dom.js";
import {renderHud} from "./hud.js";
import {renderIdentity} from "./identity.js";
import {renderAbilities} from "./abilities.js";
import {renderCombat} from "./combat.js";
import {renderProficiencies} from "./proficiencies.js";
import {renderAttacks} from "./attacks.js";
import {renderSpells} from "./spells.js";
import {renderFeatures} from "./features.js";
import {renderEquipment} from "./equipment.js";
import {renderPersonality} from "./personality.js";
import {renderNotes} from "./notes.js";
import {renderBackup} from "./backup.js";

const SECTIONS = [[renderIdentity, "Stats"], [renderAbilities, null], [renderCombat, null], [renderProficiencies, "Skills"],
  [renderAttacks, "Attacks"], [renderSpells, "Spells"], [renderFeatures, "Features"], [renderEquipment, "Gear"],
  [renderPersonality, "Notes"], [renderNotes, null], [renderBackup, null]];

export function render(){
  const main = byId("main");
  main.innerHTML = "";
  main.dataset.editing = state.isEditing ? "on" : "off";
  SECTIONS.forEach(([section, chapter]) => {
    const before = main.children.length;
    section(main);
    const first = main.children[before];
    if(chapter && first) first.dataset.chapter = chapter;
  });
  main.appendChild(el("p", "app-version", "Mimic v" + APP_VERSION));
  renderHud(byId("hud"));
}
