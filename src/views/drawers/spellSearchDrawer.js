import {SPELL_RESULT_LIMIT, SPELL_LEVELS, HOMEMADE_SPELL_LEVEL} from "../../data/constants.js";
import {state} from "../../store/state.js";
import {loadSpellLibrary} from "../../store/spellLibrary.js";
import {addSpell, replaceSpell} from "../../store/character.js";
import {searchSpells} from "../../rules/spells.js";
import {makeField} from "../../ui/field.js";
import {el} from "../dom.js";
import {actionButton} from "../controls.js";
import {renderSpellDetail, spellTag, spellSummary} from "../spellDetail.js";
import {openDrawer, closeDrawer} from "./drawer.js";

const filters = {query: "", level: null, isClassOnly: true};

const ownClass = () => state.character.className.toLowerCase();

function choose(spell, replaceIndex){
  if(replaceIndex === null) addSpell(spell);
  else replaceSpell(replaceIndex, spell);
  closeDrawer();
}

function resultRow(spell, onPick){
  const row = el("button", "pick");
  row.type = "button";
  const name = el("span", "pick-line");
  name.append(el("b", "pick-name", spell.name), spellTag(spell));
  row.append(name, el("span", "pick-effect", spellSummary(spell)));
  row.addEventListener("click", onPick);
  return row;
}

function showPick(body, library, spell, replaceIndex){
  body.innerHTML = "";
  const actions = el("div", "drawer-actions");
  const replacing = replaceIndex === null ? null : state.character.spellcasting.spells[replaceIndex];
  actions.append(
    actionButton("Back", {}, () => showSearch(body, library, replaceIndex)),
    actionButton(replacing ? `Swap in for ${replacing.name}` : "Add to my spells", {tone: "verdant"}, () => choose(spell, replaceIndex)));
  body.append(actions, renderSpellDetail(spell));
}

function paintResults(results, library, body, replaceIndex){
  results.innerHTML = "";
  const found = searchSpells(library, {query: filters.query, level: filters.level, className: filters.isClassOnly ? ownClass() : null});
  const shown = found.slice(0, SPELL_RESULT_LIMIT);
  results.appendChild(el("p", "search-note", found.length > shown.length
    ? `${found.length} spells. Showing ${shown.length}; keep typing to narrow it down.`
    : `${found.length} ${found.length === 1 ? "spell" : "spells"}`));
  shown.forEach(spell => results.appendChild(resultRow(spell, () => showPick(body, library, spell, replaceIndex))));
  const typed = filters.query.trim();
  if(typed){
    const level = filters.level === null ? HOMEMADE_SPELL_LEVEL : filters.level;
    results.appendChild(actionButton(`Add “${typed}” as my own spell`, {}, () => choose({id: null, name: typed, level}, replaceIndex)));
  }
}

function showSearch(body, library, replaceIndex){
  body.innerHTML = "";
  const input = el("input");
  input.type = "search";
  input.placeholder = `Search ${library.length} spells`;
  input.value = filters.query;
  const results = el("div", "search-results");
  input.addEventListener("input", () => {
    filters.query = input.value;
    paintResults(results, library, body, replaceIndex);
  });
  const refilter = change => () => {
    Object.assign(filters, change);
    showSearch(body, library, replaceIndex);
  };
  const levels = el("div", "chip-row");
  levels.appendChild(actionButton("Any", {chosen: filters.level === null}, refilter({level: null})));
  SPELL_LEVELS.forEach(level =>
    levels.appendChild(actionButton(level === 0 ? "C" : String(level), {chosen: filters.level === level}, refilter({level}))));
  const classes = el("div", "chip-row");
  classes.append(
    actionButton(state.character.className + " list", {chosen: filters.isClassOnly}, refilter({isClassOnly: true})),
    actionButton("Every class", {chosen: !filters.isClassOnly}, refilter({isClassOnly: false})));
  body.append(makeField(input), levels, classes, results);
  paintResults(results, library, body, replaceIndex);
}

export function openSpellSearch(replaceIndex){
  const replacing = replaceIndex === null ? null : state.character.spellcasting.spells[replaceIndex];
  if(replacing) filters.level = replacing.level;
  const body = openDrawer(replacing ? `Swap out ${replacing.name}` : "Add a spell");
  body.appendChild(el("p", "search-note", "Opening the spellbook…"));
  loadSpellLibrary().then(library => showSearch(body, library, replaceIndex));
}
