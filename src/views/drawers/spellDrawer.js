import {state} from "../../store/state.js";
import {loadSpellLibrary} from "../../store/spellLibrary.js";
import {removeSpell, pinSpellVersion, setSpellText} from "../../store/character.js";
import {findSpell, spellVersions} from "../../rules/spells.js";
import {levelLabel} from "../../rules/format.js";
import {SPELL_SOURCES} from "../../data/spellSources.js";
import {makeField} from "../../ui/field.js";
import {el} from "../dom.js";
import {actionButton} from "../controls.js";
import {renderSpellDetail} from "../spellDetail.js";
import {openDrawer, closeDrawer} from "./drawer.js";
import {openSpellSearch} from "./spellSearchDrawer.js";

function actions(index){
  const row = el("div", "drawer-actions");
  row.append(
    actionButton("Swap out", {}, () => openSpellSearch(index)),
    actionButton("Remove", {tone: "blood"}, () => {
      removeSpell(index);
      closeDrawer();
    }));
  return row;
}

function versionRow(library, spell, index, body){
  const versions = spellVersions(library, spell.name);
  const row = el("div", "chip-row");
  if(versions.length < 2) return row;
  versions.forEach(version => row.appendChild(actionButton(SPELL_SOURCES[version.source].tag, {chosen: version.id === spell.id}, () => {
    pinSpellVersion(index, version);
    fill(body, library, index);
  })));
  return row;
}

function ownText(entry, index){
  const box = el("div", "spell-own");
  const text = el("textarea");
  text.value = entry.text;
  text.placeholder = "Type the spell's text from your book";
  box.append(
    el("b", "spell-title-name", entry.name),
    el("span", "spell-summary", levelLabel(entry.level)),
    el("p", "search-note", "This spell isn't in the open reference. Its book isn't openly licensed."),
    makeField(text),
    actionButton("Save text", {}, () => setSpellText(index, text.value)));
  return box;
}

function fill(body, library, index){
  body.innerHTML = "";
  const entry = state.character.spellcasting.spells[index];
  const spell = findSpell(library, entry);
  body.appendChild(actions(index));
  if(spell) body.append(versionRow(library, spell, index, body), renderSpellDetail(spell));
  else body.appendChild(ownText(entry, index));
}

export function openSpellDrawer(index){
  const body = openDrawer(state.character.spellcasting.spells[index].name);
  body.appendChild(el("p", "search-note", "Opening the spellbook…"));
  loadSpellLibrary().then(library => fill(body, library, index));
}
