import {NEW_ATTACK, ATTACK_ABILITIES} from "../data/constants.js";
import {state, changes, persistCharacter, persistPlay} from "./state.js";
import {toggled} from "../rules/lists.js";
import {hpMax} from "../rules/sheet.js";
import {spellEntry} from "../rules/spells.js";

function save(next){
  state.character = next;
  persistCharacter();
  const slots = next.spellcasting ? next.spellcasting.slots : {};
  state.play = {...state.play,
    hp: Math.min(state.play.hp, hpMax(next, state.play)),
    hitDiceSpent: Math.min(state.play.hitDiceSpent, next.level),
    slotsSpent: Object.fromEntries(Object.entries(state.play.slotsSpent).map(([level, spent]) => [level, spent.filter(index => index < (slots[level] || 0))]))};
  persistPlay();
}

function commit(next){
  save(next);
  changes.notify();
}

const character = () => state.character;
const spellcasting = edit => ({...character(), spellcasting: {...character().spellcasting, ...edit(character().spellcasting)}});
const editSpells = edit => commit(spellcasting(casting => ({spells: edit(casting.spells)})));
const editSpellAt = (index, edit) => editSpells(spells => spells.map((entry, at) => at === index ? edit(entry) : entry));
const editAttacks = edit => ({...character(), attacks: edit(character().attacks)});

export const setField = (field, value) => save({...character(), [field]: value});
export const setScore = (key, value) => save({...character(), scores: {...character().scores, [key]: value}});
export const setCoin = (coin, value) => save({...character(), coins: {...character().coins, [coin]: value}});
export const setPersonality = (key, value) => save({...character(), personality: {...character().personality, [key]: value}});
export const setAttack = (index, field, value) =>
  save(editAttacks(attacks => attacks.map((attack, at) => at === index ? {...attack, [field]: value} : attack)));

export const setMaxHp = value => commit({...character(), maxHp: value});

export function setSlotTotal(level, total){
  save(spellcasting(casting => {
    const slots = {...casting.slots, [level]: total};
    if(!total) delete slots[level];
    return {slots};
  }));
}

export const toggleSaveProficiency = key =>
  commit({...character(), saveProficiencies: toggled(character().saveProficiencies, key)});
export const toggleSkillProficiency = id =>
  commit({...character(), skillProficiencies: toggled(character().skillProficiencies, id)});

const nextAbility = ability => ATTACK_ABILITIES[(ATTACK_ABILITIES.indexOf(ability) + 1) % ATTACK_ABILITIES.length];
export const cycleAttackAbility = index => commit(editAttacks(attacks => attacks.map((attack, at) =>
  at === index ? {...attack, ability: nextAbility(attack.ability)} : attack)));
export const addAttack = () => commit(editAttacks(attacks => attacks.concat({...NEW_ATTACK})));
export const removeAttack = index => commit(editAttacks(attacks => attacks.filter((attack, at) => at !== index)));

export const addSpell = spell => editSpells(spells => spells.concat(spellEntry(spell)));
export const removeSpell = index => editSpells(spells => spells.filter((entry, at) => at !== index));
export const replaceSpell = (index, spell) => editSpellAt(index, () => spellEntry(spell));
export const pinSpellVersion = (index, spell) => editSpellAt(index, entry => ({...entry, id: spell.id}));
export const setSpellText = (index, text) => editSpellAt(index, entry => ({...entry, text}));
