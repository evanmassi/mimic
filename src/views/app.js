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

const SECTIONS = [renderIdentity, renderAbilities, renderCombat, renderProficiencies, renderAttacks,
  renderSpells, renderFeatures, renderEquipment, renderPersonality, renderNotes];

export function render(){
  renderHud(byId("hud"));
  const main = byId("main");
  main.innerHTML = "";
  main.dataset.editing = state.isEditing ? "on" : "off";
  SECTIONS.forEach(section => section(main));
  main.appendChild(el("p", "app-version", "Mimic v" + APP_VERSION));
}
