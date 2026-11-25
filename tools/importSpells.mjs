import fs from "node:fs";
import {fileURLToPath} from "node:url";
import {SPELL_SOURCES} from "../src/data/spellSources.js";

const API = "https://api.open5e.com";
const root = fileURLToPath(new URL("../", import.meta.url));
const V1_TO_V2 = {"wotc-srd": "srd-2014", "dmag": "deepm", "dmag-e": "deepmx", "a5e": "a5e-ag", "warlock": "wz", "o5e": "open5e", "toh": "toh", "kp": "kp"};
const SOURCE_PREFERENCE = ["srd-2014", "srd-2024", "a5e-ag", "deepm", "deepmx", "toh", "wz", "kp", "open5e", "spells-that-dont-suck"];
const CLASS_TYPOS = {sorceror: "sorcerer"};
const CASTING_UNITS = {action: "1 action", "bonus-action": "1 bonus action", reaction: "1 reaction", round: "1 round", turn: "1 turn"};

async function getAll(path){
  const rows = [];
  for(let url = `${API}${path}${path.includes("?") ? "&" : "?"}limit=500&format=json`; url;){
    const page = await (await fetch(url)).json();
    rows.push(...page.results);
    url = page.next;
  }
  return rows;
}

const castingTime = (raw, condition) => {
  const base = CASTING_UNITS[raw] || raw.replace(/^(\d+)([a-z]+)$/, "$1 $2");
  return condition ? `${base}, ${condition}` : base;
};

const classNames = list => [...new Set(list
  .map(name => name.replace(/\(.*?\)/g, "").trim().toLowerCase())
  .filter(Boolean)
  .map(name => CLASS_TYPOS[name] || name))].sort();

function spellRecord(spell, v1Classes){
  const source = spell.document.key;
  return {
    id: spell.key,
    name: spell.name,
    level: spell.level,
    school: spell.school.name,
    castingTime: castingTime(spell.casting_time, spell.reaction_condition),
    isRitual: spell.ritual,
    range: spell.range_text || "",
    components: [spell.verbal && "V", spell.somatic && "S", spell.material && "M"].filter(Boolean).join(", "),
    material: spell.material_specified || "",
    duration: spell.duration,
    isConcentration: spell.concentration,
    classes: classNames(spell.classes.map(one => one.name).concat(v1Classes.get(`${source}|${spell.name}`) || [])),
    source,
    text: (spell.desc || "").trim(),
    higherLevel: (spell.higher_level || "").trim()
  };
}

const [v2Spells, v1Spells, v1Documents, licenses] = await Promise.all([
  getAll("/v2/spells/"), getAll("/v1/spells/"), getAll("/v1/documents/"), getAll("/v2/licenses/")
]);

const unknown = [...new Set(v2Spells.map(spell => spell.document.key))].filter(key => !SPELL_SOURCES[key]);
if(unknown.length) throw new Error("Add these sources to src/data/spellSources.js: " + unknown.join(", "));

const v1Classes = new Map(v1Spells.map(spell => [`${V1_TO_V2[spell.document__slug]}|${spell.name}`,
  (spell.spell_lists || []).concat((spell.dnd_class || "").split(","))]));

const rank = source => SOURCE_PREFERENCE.indexOf(source);
const spells = v2Spells.map(spell => spellRecord(spell, v1Classes))
  .sort((a, b) => a.name.localeCompare(b.name) || rank(a.source) - rank(b.source));

fs.writeFileSync(root + "src/data/spells.js",
  "export const SPELLS = [\n" + spells.map(spell => "  " + JSON.stringify(spell)).join(",\n") + "\n];\n");

const copyrightOf = Object.fromEntries(v1Documents.map(doc => [V1_TO_V2[doc.slug], doc.copyright]));
copyrightOf["srd-2024"] = "This work includes material from the System Reference Document 5.2 (\"SRD 5.2\") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.";
copyrightOf["spells-that-dont-suck"] = "Spells That Don't Suck by Somanyrobots, licensed under the Creative Commons Attribution 4.0 International License.";
const ogl = licenses.find(license => license.key === "ogl-10a").desc.trim();
const counts = spells.reduce((tally, spell) => ({...tally, [spell.source]: (tally[spell.source] || 0) + 1}), {});

const notices = SOURCE_PREFERENCE.filter(key => counts[key]).map(key => {
  const source = SPELL_SOURCES[key];
  return `### ${source.name} (${source.publisher})\n\nTagged **${source.tag}** in the app. ${counts[key]} spells.\n\n${copyrightOf[key] || source.publisher}\n`;
}).join("\n");

fs.writeFileSync(root + "docs/spell-licenses.md", `# Spell sources and licenses

Mimic's spell reference is Open Game Content and Creative Commons material, gathered by
[Open5e](https://open5e.com) and imported with \`node tools/importSpells.mjs\`. Only openly licensed text is included.
Spells from books that aren't openly licensed are not in the app; type those in yourself.

Mimic is not affiliated with, endorsed by, or sponsored by Wizards of the Coast or any publisher below.

## Sources

${notices}
## Open Game License Version 1.0a

${ogl}

### Section 15: Copyright Notice

Open Game License v 1.0a Copyright 2000, Wizards of the Coast, Inc.

${SOURCE_PREFERENCE.filter(key => counts[key] && copyrightOf[key]).map(key => copyrightOf[key]).join("\n\n")}
`);

console.log(`${spells.length} spells written`, counts);
