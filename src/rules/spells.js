const flat = text => text.toLowerCase().replace(/['’]/g, "");

export function searchSpells(library, {query, level, className}){
  const words = flat(query).split(/\s+/).filter(Boolean);
  const fits = library.filter(spell =>
    (level === null || spell.level === level) && (className === null || spell.classes.includes(className)));
  if(!words.length) return fits;
  const hasWords = text => words.every(word => flat(text).includes(word));
  const typed = words.join(" ");
  const closeness = spell => flat(spell.name) === typed ? 0 : flat(spell.name).startsWith(typed) ? 1 : 2;
  const byName = fits.filter(spell => hasWords(spell.name)).sort((a, b) => closeness(a) - closeness(b));
  const named = new Set(byName);
  return byName.concat(fits.filter(spell => !named.has(spell) && hasWords(spell.text)));
}

export const spellVersions = (library, name) => library.filter(spell => flat(spell.name) === flat(name));

export const findSpell = (library, entry) =>
  (entry.id && library.find(spell => spell.id === entry.id)) || spellVersions(library, entry.name)[0] || null;

export const spellEntry = ({id, name, level}) => ({id, name, level, isAlwaysPrepared: false, text: ""});

export function spellLevels(casting){
  const levels = Object.keys(casting.slots).map(Number).concat(casting.spells.map(spell => spell.level));
  return [...new Set(levels)].sort((a, b) => a - b);
}
