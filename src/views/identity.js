import {state} from "../store/state.js";
import {setField} from "../store/character.js";
import {el} from "./dom.js";
import {editableField} from "./controls.js";

const FIELDS = [
  {field: "className", label: "Class", kind: "text"},
  {field: "level", label: "Level", kind: "number"},
  {field: "subclass", label: "Subclass", kind: "text"},
  {field: "race", label: "Race", kind: "text"},
  {field: "background", label: "Background", kind: "text"},
  {field: "alignment", label: "Alignment", kind: "text"},
  {field: "playerName", label: "Player", kind: "text"},
  {field: "hitDie", label: "Hit die", kind: "number", prefix: "d"}
];

function fieldBox({field, label, kind, prefix = ""}){
  const box = el("div", "banner-field");
  const value = state.character[field];
  const fullLabel = state.isEditing && prefix ? `${label} (${prefix}…)` : label;
  box.append(state.isEditing ? editableField(kind, value, next => setField(field, next), fullLabel) : el("b", "stat-value", prefix + value),
    el("span", "stat-label", fullLabel));
  return box;
}

export function renderIdentity(main){
  const banner = el("section", "banner");
  if(state.isEditing) banner.appendChild(el("p", "edit-hint", "Editing your sheet. Everything recalculates when you tap Done."));
  banner.append(
    state.isEditing ? editableField("text", state.character.name, name => setField("name", name), "Character name") : el("b", "banner-name", state.character.name),
    el("span", "banner-caption", "Character name"));
  const fields = el("div", "banner-fields");
  FIELDS.forEach(field => fields.appendChild(fieldBox(field)));
  banner.appendChild(fields);
  main.appendChild(banner);
}
