import {SKILLS} from "../data/abilities.js";
import {CONDITIONS, EXHAUSTION_SPEED_HALVED, EXHAUSTION_HP_HALVED, EXHAUSTION_SPEED_ZERO} from "../data/conditions.js";

export const modifier = score => Math.floor((score - 10) / 2);
export const proficiencyBonus = level => Math.ceil(level / 4) + 1;

const abilityMod = (character, key) => modifier(character.scores[key]);
const proficient = (character, isProficient) => isProficient ? proficiencyBonus(character.level) : 0;

export const saveBonus = (character, key) =>
  abilityMod(character, key) + proficient(character, character.saveProficiencies.includes(key));

export const skillAbility = (character, skill) => character.skillAbilities[skill.id] || skill.ability;

export const skillBonus = (character, skill) =>
  abilityMod(character, skillAbility(character, skill)) + proficient(character, character.skillProficiencies.includes(skill.id));

export const passivePerception = character => 10 + skillBonus(character, SKILLS.find(skill => skill.id === "perception"));
export const initiative = character => abilityMod(character, "dex");

export const spellAttack = character =>
  proficiencyBonus(character.level) + abilityMod(character, character.spellcasting.ability);
export const spellSaveDc = character => 8 + spellAttack(character);

export const attackBonus = (character, attack) =>
  abilityMod(character, attack.ability) + proficiencyBonus(character.level) + attack.magicBonus;
export const damageBonus = (character, attack) =>
  abilityMod(character, attack.ability) + attack.magicBonus + attack.damageBonus;

export const formulaValue = (character, formula) =>
  (formula.base || 0) + (formula.ability ? abilityMod(character, formula.ability) : 0) + (formula.perLevel || 0) * character.level;

export const slotDice = (tracker, slotLevel) =>
  Math.min(tracker.maxDice, tracker.baseDice + slotLevel - 1) + tracker.die;

const activeEffects = (character, play) => character.features
  .filter(feature => feature.tracker && feature.tracker.kind === "toggle" && play.active.includes(feature.id))
  .map(feature => feature.tracker.effects);

export const armorClass = (character, play) =>
  activeEffects(character, play).reduce((ac, effects) => ac + (effects.acBonus || 0), character.armorClass);

export function activeConditions(character, play){
  const keys = new Set(play.conditions.concat(activeEffects(character, play).flatMap(effects => effects.conditions || [])));
  return CONDITIONS.filter(condition => keys.has(condition.key));
}

export function speed(character, play){
  if(play.exhaustion >= EXHAUSTION_SPEED_ZERO) return 0;
  if(activeConditions(character, play).some(condition => condition.isSpeedZero)) return 0;
  const overrides = activeEffects(character, play).filter(effects => "speedOverride" in effects).map(effects => effects.speedOverride);
  const base = overrides.length ? Math.min(...overrides) : character.speed;
  return play.exhaustion >= EXHAUSTION_SPEED_HALVED ? Math.floor(base / 2) : base;
}

export const hpMax = (character, play) =>
  play.exhaustion >= EXHAUSTION_HP_HALVED ? Math.floor(character.maxHp / 2) : character.maxHp;

export const slotsLeft = (character, play, level) =>
  character.spellcasting.slots[level] - (play.slotsSpent[level] || []).length;
