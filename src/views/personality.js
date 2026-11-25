import {state} from "../store/state.js";
import {setPersonality} from "../store/character.js";
import {makeFrame} from "../ui/frame.js";
import {el} from "./dom.js";
import {editableField} from "./controls.js";

const TRAITS = [["traits", "Personality traits"], ["ideals", "Ideals"], ["bonds", "Bonds"], ["flaws", "Flaws"]];

export function renderPersonality(main){
  const box = makeFrame(el("section"), "Personality");
  TRAITS.forEach(([key, label]) => {
    const text = state.character.personality[key];
    box.append(el("h3", "trait-name", label), state.isEditing
      ? editableField("paragraph", text, value => setPersonality(key, value), label)
      : el("p", "trait-text", text));
  });
  main.appendChild(box);
}
