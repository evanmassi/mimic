import {ABILITIES, SKILLS} from "../data/abilities.js";
import {CONDITIONS, EXHAUSTION_CHECKS_DISADVANTAGED, EXHAUSTION_SPEED_HALVED, EXHAUSTION_ROLLS_DISADVANTAGED, EXHAUSTION_HP_HALVED,
  EXHAUSTION_SPEED_ZERO} from "../data/conditions.js";

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

const toggledEffects = (character, play) => character.features
  .filter(feature => feature.tracker && feature.tracker.kind === "toggle" && play.active.includes(feature.id))
  .map(feature => feature.tracker.effects);

const activeEffects = (character, play) =>
  [...character.features.filter(feature => feature.effects).map(feature => feature.effects), ...toggledEffects(character, play)];

export const armorClass = (character, play) =>
  activeEffects(character, play).reduce((ac, effects) => ac + (effects.acBonus || 0), character.armorClass);

const effectConditions = (character, play) => activeEffects(character, play).flatMap(effects => effects.conditions || []);
const zeroHpConditions = play => play.hp === 0 ? CONDITIONS.filter(condition => condition.isAtZeroHp).map(condition => condition.key) : [];

export function activeConditions(character, play){
  const keys = new Set([...play.conditions, ...effectConditions(character, play), ...zeroHpConditions(play)]);
  return CONDITIONS.filter(condition => keys.has(condition.key));
}

export function conditionCause(character, play, key){
  if(play.conditions.includes(key)) return null;
  if(zeroHpConditions(play).includes(key)) return "zeroHp";
  return effectConditions(character, play).includes(key) ? "feature" : null;
}

export function saveSeals(character, play){
  const isConscious = !activeConditions(character, play).some(condition => condition.key === "unconscious");
  return activeEffects(character, play).filter(effects => effects.saveBonus).map(({saveBonus, whileConscious}) => {
    const amount = formulaValue(character, saveBonus.amount);
    return {label: saveBonus.label, amount: "min" in saveBonus ? Math.max(saveBonus.min, amount) : amount,
      isLit: !whileConscious || isConscious};
  });
}

const ROLL_PICKS = {
  attack: rolls => rolls.attack,
  check: rolls => rolls.check,
  foes: rolls => rolls.foes,
  save: (rolls, ability) => rolls.saves && rolls.saves[ability]
};

const exhaustionRolls = level => [
  level >= EXHAUSTION_CHECKS_DISADVANTAGED ? {check: "dis"} : null,
  level >= EXHAUSTION_ROLLS_DISADVANTAGED ? {attack: "dis", saves: Object.fromEntries(ABILITIES.map(({key}) => [key, "dis"]))} : null
].filter(Boolean);

const rollSources = (character, play) => [...activeConditions(character, play), ...activeEffects(character, play)]
  .map(source => source.rolls).filter(Boolean).concat(exhaustionRolls(play.exhaustion));

export function rollMark(character, play, kind, ability){
  if(kind === "attack" && activeConditions(character, play).some(condition => condition.isIncapacitated)) return null;
  const marks = rollSources(character, play).map(rolls => ROLL_PICKS[kind](rolls, ability)).filter(Boolean);
  if(marks.includes("fail")) return "fail";
  const isAdvantaged = marks.some(mark => mark === "adv" || mark === "near");
  const isDisadvantaged = marks.includes("dis");
  if(isAdvantaged && isDisadvantaged) return "even";
  if(isAdvantaged) return marks.includes("adv") ? "adv" : "near";
  return isDisadvantaged ? "dis" : null;
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
