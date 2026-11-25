import {MAX_SPELL_LEVEL} from "../data/constants.js";
import {state} from "../store/state.js";
import {toggleSlot} from "../store/play.js";
import {setSlotTotal} from "../store/character.js";
import {spellSaveDc, spellAttack} from "../rules/sheet.js";
import {spellLevels} from "../rules/spells.js";
import {signed} from "../rules/format.js";
import {makeToggleDots} from "../ui/dots.js";
import {makeFrame} from "../ui/frame.js";
import {el} from "./dom.js";
import {statBox, actionButton, editableField} from "./controls.js";
import {openSpellDrawer} from "./drawers/spellDrawer.js";
import {openSpellSearch} from "./drawers/spellSearchDrawer.js";

export function slotDots(level){
  const spent = state.play.slotsSpent[level] || [];
  const ready = Array.from({length: state.character.spellcasting.slots[level]}, (_, index) => !spent.includes(index));
  return makeToggleDots(ready, index => toggleSlot(level, index), "mana");
}

function spellButton(spell, index){
  const button = el("button", spell.isAlwaysPrepared ? "spell spell-always" : "spell", spell.name);
  button.type = "button";
  button.addEventListener("click", () => openSpellDrawer(index));
  return button;
}

function slotTotals(casting){
  const levels = Object.keys(casting.slots).map(Number);
  const next = Math.min(MAX_SPELL_LEVEL, Math.max(0, ...levels) + 1);
  const row = el("div", "slot-totals");
  [...new Set(levels.concat(next))].forEach(level => {
    const box = el("label", "slot-total");
    box.append(el("span", "spell-hex", String(level)),
      editableField("number", casting.slots[level] || 0, total => setSlotTotal(level, Math.max(0, total)), `Level ${level} slots`));
    row.appendChild(box);
  });
  return row;
}

export function renderSpells(main){
  const character = state.character;
  const casting = character.spellcasting;
  if(!casting) return;
  const box = makeFrame(el("section"), "Spells · tap a spell to read or swap it");
  const head = el("div", "spell-head");
  head.append(
    statBox("spell-stat", casting.ability.toUpperCase(), "Ability"),
    statBox("spell-stat", spellSaveDc(character), "Save DC"),
    statBox("spell-stat", signed(spellAttack(character)), "Attack"));
  box.appendChild(head);
  if(state.isEditing) box.append(el("span", "stat-label", "Slots per level"), slotTotals(casting));
  spellLevels(casting).forEach(level => {
    const row = el("div", "spell-level");
    row.appendChild(el("span", "spell-hex", level === 0 ? "C" : String(level)));
    if(casting.slots[level]) row.appendChild(slotDots(level));
    const names = el("div", "spell-names");
    casting.spells.forEach((spell, index) => { if(spell.level === level) names.appendChild(spellButton(spell, index)); });
    box.append(row, names);
  });
  const add = actionButton("+ Add a spell", {}, () => openSpellSearch(null));
  add.classList.add("spells-add");
  box.appendChild(add);
  main.appendChild(box);
}
