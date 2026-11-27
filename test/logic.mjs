import {installDom, installStorage} from "./dom.mjs";
import {section, check, equal, report} from "./checks.mjs";

installDom();
installStorage();

const {SKILLS} = await import("../src/data/abilities.js");
const {SAMPLE_CHARACTER} = await import("../src/data/sampleCharacter.js");
const {CHARACTER_KEY, PLAY_KEY} = await import("../src/data/constants.js");
const sheet = await import("../src/rules/sheet.js");
const play = await import("../src/rules/play.js");
const {signed} = await import("../src/rules/format.js");
const {state, hydrate} = await import("../src/store/state.js");
const playStore = await import("../src/store/play.js");
const characterStore = await import("../src/store/character.js");
const spellRules = await import("../src/rules/spells.js");
const {textBlocks} = await import("../src/rules/markdown.js");
const {levelLabel} = await import("../src/rules/format.js");
const {SPELL_SOURCES} = await import("../src/data/spellSources.js");
const backupRules = await import("../src/rules/backup.js");
const backupStore = await import("../src/store/backup.js");
const {loadSpellLibrary} = await import("../src/store/spellLibrary.js");

const nawe = () => structuredClone(SAMPLE_CHARACTER);
const skill = id => SKILLS.find(one => one.id === id);
const fresh = () => {
  localStorage.clear();
  hydrate();
};

section("Ability math");
{
  equal("modifiers", [1, 8, 10, 11, 12, 16, 20, 30].map(sheet.modifier), [-5, -1, 0, 0, 1, 3, 5, 10]);
  equal("proficiency bonus by level", [1, 4, 5, 8, 9, 12, 13, 16, 17, 20].map(sheet.proficiencyBonus), [2, 2, 3, 3, 4, 4, 5, 5, 6, 6]);
  equal("signed uses a real minus", [signed(3), signed(0), signed(-1)], ["+3", "+0", "−1"]);
}

section("Nawe's numbers match the paper sheet");
{
  const c = nawe();
  equal("saving throws", ["str", "dex", "con", "int", "wis", "cha"].map(key => sheet.saveBonus(c, key)), [5, 0, 4, -1, 5, 7]);
  equal("proficient skills", ["athletics", "insight", "intimidation", "perception", "survival"].map(id => sheet.skillBonus(c, skill(id))), [9, 5, 7, 5, 5]);
  equal("unproficient skills", ["acrobatics", "arcana", "deception", "stealth"].map(id => sheet.skillBonus(c, skill(id))), [0, -1, 3, 0]);
  equal("religion uses wisdom by house rule", [sheet.skillAbility(c, skill("religion")), sheet.skillBonus(c, skill("religion"))], ["wis", 1]);
  equal("passive perception", sheet.passivePerception(c), 15);
  equal("initiative", sheet.initiative(c), 0);
  equal("spell save DC and attack", [sheet.spellSaveDc(c), sheet.spellAttack(c)], [15, 7]);
  equal("trident +1", [sheet.attackBonus(c, c.attacks[0]), sheet.damageBonus(c, c.attacks[0])], [10, 8]);
  equal("mace", [sheet.attackBonus(c, c.attacks[1]), sheet.damageBonus(c, c.attacks[1])], [9, 7]);
  const feature = id => c.features.find(one => one.id === id).tracker;
  equal("divine sense uses = 1 + CHA", sheet.formulaValue(c, feature("divineSense").max), 4);
  equal("lay on hands pool = 5 x level", sheet.formulaValue(c, feature("layOnHands").max), 50);
  equal("smite dice by slot level", [1, 2, 3, 4, 5].map(level => sheet.slotDice(feature("divineSmite"), level)), ["2d8", "3d8", "4d8", "5d8", "5d8"]);
}

section("Derived values follow the scores");
{
  const c = nawe();
  c.scores.cha = 18;
  equal("raising CHA raises CHA save, spell DC and divine sense", [sheet.saveBonus(c, "cha"), sheet.spellSaveDc(c),
    sheet.formulaValue(c, c.features.find(one => one.id === "divineSense").tracker.max)], [8, 16, 5]);
  c.level = 13;
  equal("leveling to 13 raises proficiency everywhere", [sheet.proficiencyBonus(c.level), sheet.skillBonus(c, skill("athletics"))], [5, 10]);
}

section("Toggles, conditions and exhaustion");
{
  const c = nawe();
  const p = play.newPlay(c);
  equal("plain AC and speed", [sheet.armorClass(c, p), sheet.speed(c, p)], [19, 30]);
  const shelled = {...p, active: ["shellDefense"]};
  equal("shell defense: AC 23, speed 0", [sheet.armorClass(c, shelled), sheet.speed(c, shelled)], [23, 0]);
  equal("shell defense makes you prone", sheet.activeConditions(c, shelled).map(one => one.key), ["prone"]);
  equal("grappled sets speed 0", sheet.speed(c, {...p, conditions: ["grappled"]}), 0);
  equal("poisoned leaves speed alone", sheet.speed(c, {...p, conditions: ["poisoned"]}), 30);
  equal("conditions list in rulebook order", sheet.activeConditions(c, {...p, conditions: ["prone", "blinded"]}).map(one => one.key), ["blinded", "prone"]);
  equal("exhaustion 1 changes nothing here", [sheet.speed(c, {...p, exhaustion: 1}), sheet.hpMax(c, {...p, exhaustion: 1})], [30, 106]);
  equal("exhaustion 2 halves speed", sheet.speed(c, {...p, exhaustion: 2}), 15);
  equal("exhaustion 4 halves max HP", sheet.hpMax(c, {...p, exhaustion: 4}), 53);
  equal("exhaustion 5 sets speed 0", sheet.speed(c, {...p, exhaustion: 5}), 0);
}

section("Seals on the saves");
{
  const c = nawe();
  const p = play.newPlay(c);
  equal("aura of protection adds CHA, apart from the save numbers", [sheet.saveSeals(c, p), sheet.saveBonus(c, "con")], [[{label: "Aura", amount: 3, isLit: true}], 4]);
  equal("the aura goes out at 0 HP", sheet.saveSeals(c, {...p, hp: 0})[0].isLit, false);
  equal("and while unconscious for any other reason", sheet.saveSeals(c, {...p, conditions: ["unconscious"]})[0].isLit, false);
  c.scores.cha = 8;
  equal("the aura is never below +1", sheet.saveSeals(c, p)[0].amount, 1);
  c.features.push({id: "ring", name: "Ring of Protection", text: "", tracker: null, effects: {saveBonus: {label: "Ring", amount: {base: 1}}}});
  equal("a flat bonus stays lit at 0 HP", sheet.saveSeals(c, {...p, hp: 0}).map(seal => [seal.label, seal.amount, seal.isLit]), [["Aura", 1, false], ["Ring", 1, true]]);
  c.features = c.features.filter(feature => !feature.effects);
  equal("no save bonus, no seals", sheet.saveSeals(c, p), []);
}

section("Attacks per action");
{
  const c = nawe();
  const p = play.newPlay(c);
  equal("Extra Attack makes it two", sheet.attacksPerAction(c, p), 2);
  equal("without it, one", sheet.attacksPerAction({...c, features: c.features.filter(feature => feature.id !== "extraAttack")}, p), 1);
}

section("Conditions mark your rolls");
{
  const c = nawe();
  const p = play.newPlay(c);
  const marks = q => [sheet.rollMark(c, q, "attack"), sheet.rollMark(c, q, "check"), sheet.rollMark(c, q, "foes")];
  const saves = q => ["str", "dex", "con", "int", "wis", "cha"].map(key => sheet.rollMark(c, q, "save", key));
  equal("nothing marked by default", [marks(p), saves(p)], [[null, null, null], [null, null, null, null, null, null]]);
  equal("poisoned: disadvantage on attacks and checks", marks({...p, conditions: ["poisoned"]}), ["dis", "dis", null]);
  equal("invisible and poisoned cancel on attacks", marks({...p, conditions: ["invisible", "poisoned"]}), ["even", "dis", "dis"]);
  equal("prone foes have advantage only up close", marks({...p, conditions: ["prone"]}), ["dis", null, "near"]);
  equal("restrained: DEX saves only", saves({...p, conditions: ["restrained"]}), [null, "dis", null, null, null, null]);
  const down = {...p, hp: 0};
  equal("at 0 HP STR and DEX saves fail and attacks get no mark", [saves(down).slice(0, 3), marks(down)], [["fail", "fail", null], [null, null, "adv"]]);
  const shelled = {...p, active: ["shellDefense"]};
  equal("shell defense: STR and CON advantage, DEX disadvantage", saves(shelled), ["adv", "dis", "adv", null, null, null]);
  equal("exhaustion 1 marks checks", marks({...p, exhaustion: 1}), [null, "dis", null]);
  equal("exhaustion 3 marks attacks and every save", [marks({...p, exhaustion: 3}), saves({...p, exhaustion: 3})], [["dis", "dis", null], ["dis", "dis", "dis", "dis", "dis", "dis"]]);
  equal("exhaustion against shell defense evens STR and CON", saves({...shelled, exhaustion: 3}), ["even", "dis", "even", "dis", "dis", "dis"]);
  equal("a failed save beats advantage", sheet.rollMark(c, {...shelled, conditions: ["stunned"]}, "save", "str"), "fail");
}

section("Backups");
{
  fresh();
  playStore.takeDamage(30);
  const savedAt = "2026-11-20T18:00:00.000Z";
  const file = JSON.stringify(backupRules.makeBackup(state.character, state.play, state.notes, savedAt));
  const read = backupRules.readBackup(file);
  equal("a backup reads back the sheet, session and notes", [read.character.name, read.play.hp, read.notes.text, read.savedAt], ["Nawe Ironshell", 76, state.notes.text, savedAt]);
  equal("the file is named for the character and day", backupRules.backupFileName(state.character, savedAt), "Nawe Ironshell - Mimic backup 2026-11-20.json");
  equal("anything else is turned away", ["not json", "{}", JSON.stringify({app: "mimic", format: 99, character: read.character}), JSON.stringify({app: "other", format: 1, character: read.character}),
    JSON.stringify({app: "mimic", format: 1, character: {name: "No scores", level: 1}})].map(backupRules.readBackup), [null, null, null, null, null]);
  equal("a backup without a session starts a fresh one", backupRules.readBackup(JSON.stringify({app: "mimic", format: 1, character: read.character})).play.hp, 106);
  fresh();
  playStore.takeDamage(5);
  backupStore.restoreBackup({...read, character: {...read.character, level: 11}});
  equal("restoring replaces everything and clears undo", [state.character.level, state.play.hp, state.history.length], [11, 76, 0]);
  equal("and it sticks after a reload", [JSON.parse(localStorage.getItem(CHARACTER_KEY)).level, JSON.parse(localStorage.getItem(PLAY_KEY)).hp], [11, 76]);
  backupStore.markBackupSaved(savedAt);
  hydrate();
  equal("the last backup time is remembered", state.lastBackup, savedAt);
}

section("Hit points");
{
  const c = nawe();
  const p = {...play.newPlay(c), hp: 50, tempHp: 8};
  equal("damage eats temp HP first", [play.damaged(p, 5).tempHp, play.damaged(p, 5).hp], [3, 50]);
  equal("damage spills past temp HP", [play.damaged(p, 12).tempHp, play.damaged(p, 12).hp], [0, 46]);
  equal("HP stops at 0", play.damaged(p, 500).hp, 0);
  equal("healing stops at max", play.healed(p, 500, 106).hp, 106);
  const down = {...p, hp: 0, deathSaves: {successes: 2, failures: 1}};
  equal("healing from 0 clears death saves", play.healed(down, 5, 106).deathSaves, {successes: 0, failures: 0});
  equal("temp HP doesn't stack, the bigger one wins", [play.withTempHp(p, 5).tempHp, play.withTempHp(p, 12).tempHp], [8, 12]);
  equal("adjusted picks damage or heal by sign", [play.adjusted(p, -10, 106).tempHp, play.adjusted(p, 10, 106).hp], [0, 60]);
}

section("Dragging the HP bar");
{
  const p = {hp: 50, tempHp: 0};
  equal("a full swipe right is 60% of max", play.dragAmount(300, 300, p, 100), 50);
  equal("half a swipe left", play.dragAmount(-150, 300, p, 100), -30);
  equal("can't heal past max", play.dragAmount(300, 300, {hp: 90, tempHp: 0}, 100), 10);
  equal("can't drag below 0, counting temp HP", play.dragAmount(-1000, 300, {hp: 10, tempHp: 5}, 100), -15);
  equal("no width means no change", play.dragAmount(100, 0, p, 100), 0);
  const nawe0 = nawe();
  const zero = {...play.newPlay(nawe0), hp: 0};
  equal("0 HP means unconscious, from 0 HP", [sheet.activeConditions(nawe0, zero).map(c => c.key), sheet.conditionCause(nawe0, zero, "unconscious")], [["unconscious"], "zeroHp"]);
  equal("healed, it's gone", sheet.activeConditions(nawe0, {...zero, hp: 1}).map(c => c.key), []);
  equal("wear is the share of HP lost", [play.hpWear({hp: 100}, 100), play.hpWear({hp: 25}, 100), play.hpWear({hp: 0}, 100)], [0, 0.75, 1]);
  const down = saves => ({hp: 0, deathSaves: saves});
  equal("fate follows the death saves", [play.deathFate({hp: 5, deathSaves: {successes: 0, failures: 3}}),
    play.deathFate(down({successes: 1, failures: 2})), play.deathFate(down({successes: 3, failures: 1})), play.deathFate(down({successes: 2, failures: 3}))],
    ["alive", "dying", "stable", "dead"]);
}

section("Rests");
{
  const c = nawe();
  const tired = {...play.newPlay(c), hp: 20, tempHp: 4, hitDiceSpent: 8, exhaustion: 2, slotsSpent: {1: [0, 1, 3], 3: [1, 0]},
    spent: {channelDivinity: [0], divineSense: [0, 2, 3], layOnHands: 40}, active: ["shellDefense"], deathSaves: {successes: 1, failures: 2}};
  const short = play.afterShortRest(c, tired);
  equal("short rest brings back channel divinity only", short.spent, {divineSense: [0, 2, 3], layOnHands: 40});
  equal("short rest leaves HP and slots", [short.hp, short.slotsSpent], [20, {1: [0, 1, 3], 3: [1, 0]}]);
  const long = play.afterLongRest(c, tired);
  equal("long rest: full HP, no temp", [long.hp, long.tempHp], [106, 0]);
  equal("long rest: half the hit dice back", long.hitDiceSpent, 3);
  equal("long rest: slots and features back, toggles off", [long.slotsSpent, long.spent, long.active], [{}, {}, []]);
  equal("long rest: one level of exhaustion off", long.exhaustion, 1);
  const drained = play.afterLongRest(c, {...tired, exhaustion: 5});
  equal("long rest at exhaustion 5 heals to the halved max", [drained.exhaustion, drained.hp], [4, 53]);
}

section("Storage");
{
  fresh();
  equal("first run seeds the sample character", state.character.name, "Nawe Ironshell");
  equal("first run starts at full HP", state.play.hp, 106);
  playStore.takeDamage(30);
  characterStore.setScore("str", 18);
  hydrate();
  equal("play state survives a reload", state.play.hp, 76);
  equal("character edits survive a reload", state.character.scores.str, 18);
  check("character and play live under their own keys", localStorage.getItem(CHARACTER_KEY) && localStorage.getItem(PLAY_KEY));
}

section("Older saves");
{
  localStorage.clear();
  localStorage.setItem(PLAY_KEY, JSON.stringify({...play.newPlay(nawe()), slotsSpent: {1: 2, 3: 0}}));
  hydrate();
  equal("slot counts from older saves load as orbs", state.play.slotsSpent, {1: [0, 1], 3: []});
  localStorage.setItem(PLAY_KEY, JSON.stringify({...play.newPlay(nawe()), spent: {divineSense: 2, channelDivinity: 0, layOnHands: 15}}));
  hydrate();
  equal("use counts from older saves load as the rightmost orbs, pools stay amounts", state.play.spent,
    {divineSense: [3, 2], channelDivinity: [], layOnHands: 15});
}

section("Undo and concentration");
{
  const c = nawe();
  const base = play.newPlay(c);
  equal("the concentration DC is half the damage, at least 10", [play.concentrationDc(5), play.concentrationDc(24), play.concentrationDc(31)], [10, 12, 15]);
  fresh();
  playStore.takeDamage(10);
  playStore.takeDamage(5);
  playStore.undo();
  equal("undo steps back one action", state.play.hp, 96);
  playStore.toggleCondition("poisoned");
  playStore.toggleActive("shellDefense");
  playStore.toggleInspiration();
  equal("one-tap toggles leave no undo of their own", state.history.length, 1);
  playStore.undo();
  equal("undoing earlier damage keeps them as set", [state.play.hp, state.play.conditions, state.play.active, state.play.inspiration],
    [106, ["poisoned"], ["shellDefense"], true]);
  fresh();
  playStore.longRest();
  playStore.toggleSlot(1, 0);
  playStore.toggleUse("divineSense", 2);
  playStore.setHitDiceSpent(3);
  playStore.setDeathSaves("failures", 1);
  equal("orbs, hit dice and death saves leave no undo either", state.history.length, 1);
  playStore.undo();
  equal("and an undo keeps them", [state.play.slotsSpent[1], state.play.spent.divineSense, state.play.hitDiceSpent, state.play.deathSaves.failures],
    [[0], [2], 3, 1]);
  fresh();
  playStore.setHitDiceSpent(4);
  playStore.longRest();
  playStore.setHitDiceSpent(state.play.hitDiceSpent + 1);
  playStore.undo();
  equal("a die spent after a rest still counts when the rest is undone", state.play.hitDiceSpent, 5);
  fresh();
  playStore.spendSlot(2);
  equal("a smite can still be undone", state.history.length, 1);
  [1, 2, 3, 4, 5, 6, 7].forEach(() => playStore.takeDamage(1));
  equal("it remembers the last five", state.history.length, 5);
  fresh();
  playStore.toggleCondition("concentrating");
  playStore.adjustHp(-24);
  equal("damage while concentrating asks for a save", state.notice.damage, 24);
  playStore.adjustHp(-1);
  equal("a quick second tap is the same hit", state.notice.damage, 25);
  playStore.loseConcentration();
  equal("losing it drops Concentrating and the prompt", [state.play.conditions.includes("concentrating"), state.notice], [false, null]);
  fresh();
  playStore.toggleCondition("concentrating");
  playStore.takeDamage(200);
  equal("no save to ask for at 0 HP", state.notice, null);
}

section("Store edits");
{
  fresh();
  playStore.setExhaustion(4);
  equal("exhaustion 4 trims HP to the halved max", state.play.hp, 53);
  fresh();
  characterStore.setField("maxHp", 80);
  equal("lowering max HP trims current HP", state.play.hp, 80);
  fresh();
  playStore.setHitDiceSpent(10);
  characterStore.setField("level", 6);
  equal("lowering level trims spent hit dice", state.play.hitDiceSpent, 6);
  fresh();
  playStore.takeDamage(40);
  const pool = state.character.features.find(one => one.id === "layOnHands");
  playStore.spendPool(pool, 5, true);
  equal("lay on hands on yourself spends and heals", [state.play.spent.layOnHands, state.play.hp], [5, 71]);
  playStore.spendPool(pool, 100, false);
  equal("a pool never spends past empty", state.play.spent.layOnHands, 50);
  playStore.restorePool(pool, 5);
  equal("points go back into the pool", state.play.spent.layOnHands, 45);
  playStore.restorePool(pool, 100);
  equal("a pool never fills past full", state.play.spent.layOnHands, 0);
  fresh();
  [1, 2, 3, 4, 5].forEach(() => playStore.spendSlot(1));
  equal("spending stops when slots run out, rightmost orb first", state.play.slotsSpent[1], [3, 2, 1, 0]);
  fresh();
  playStore.toggleSlot(2, 0);
  playStore.toggleSlot(2, 2);
  equal("each orb toggles on its own", state.play.slotsSpent[2], [0, 2]);
  playStore.toggleSlot(2, 0);
  equal("and back", state.play.slotsSpent[2], [2]);
  equal("slots left counts the orbs", sheet.slotsLeft(state.character, state.play, 2), 2);
  playStore.spendSlot(2);
  equal("smite takes the rightmost ready orb", state.play.slotsSpent[2], [2, 1]);
  fresh();
  characterStore.toggleSkillProficiency("stealth");
  equal("toggling a skill proficiency", sheet.skillBonus(state.character, skill("stealth")), 4);
}

section("Spell library data");
{
  const library = await loadSpellLibrary();
  check("well over a thousand spells", library.length > 1500, library.length);
  equal("every spell has a known source", library.filter(spell => !SPELL_SOURCES[spell.source]).length, 0);
  equal("ids are unique", new Set(library.map(spell => spell.id)).size, library.length);
  equal("every spell has a name and level", library.filter(spell => !spell.name || !(spell.level >= 0 && spell.level <= 9)).map(spell => spell.id), []);
  check("loading twice reuses the same library", await loadSpellLibrary() === library);
  equal("every linked sample spell exists", SAMPLE_CHARACTER.spellcasting.spells.filter(entry => entry.id && !library.some(spell => spell.id === entry.id)).map(entry => entry.id), []);
}

section("Searching spells");
{
  const library = await loadSpellLibrary();
  const names = list => list.map(spell => spell.name);
  const search = (query, level = null, className = null) => spellRules.searchSpells(library, {query, level, className});
  check("finds Misty Step by name", names(search("misty")).includes("Misty Step"));
  check("word order doesn't matter", names(search("step misty")).includes("Misty Step"));
  const possessive = library.find(spell => /\w's /.test(spell.name));
  check("apostrophes are optional", names(search(possessive.name.replace("'", ""))).includes(possessive.name), possessive.name);
  equal("name hits come before text hits", search("fireball")[0].name, "Fireball");
  check("level filter", search("", 3).every(spell => spell.level === 3));
  check("class filter", search("", null, "paladin").every(spell => spell.classes.includes("paladin")));
  check("paladin list has Revivify", names(search("revivify", 3, "paladin")).includes("Revivify"));
  equal("versions of one spell, 2014 SRD first", spellRules.spellVersions(library, "misty step").map(spell => spell.source), ["srd-2014", "srd-2024", "a5e-ag"]);
  equal("an id pins a version", spellRules.findSpell(library, {id: "srd-2024_misty-step", name: "Misty Step"}).source, "srd-2024");
  equal("no id falls back to the name", spellRules.findSpell(library, {id: null, name: "Moonbeam"}).id, "srd_moonbeam");
  equal("a stale id falls back to the name", spellRules.findSpell(library, {id: "gone", name: "Moonbeam"}).id, "srd_moonbeam");
  equal("closed-book spells come back empty", spellRules.findSpell(library, {id: null, name: "Compelled Duel"}), null);
}

section("Spell text formatting");
{
  const blocks = textBlocks("A **bold** start and *soft* end.\n\n* one\n* two\n\n| d4 | Effect |\n|---|---|\n| 1 | Fire |\n\n### Heading");
  equal("block kinds", blocks.map(block => block.kind), ["paragraph", "list", "table", "heading"]);
  equal("inline styles", blocks[0].parts.map(part => part.style), ["plain", "strong", "plain", "emphasis", "plain"]);
  equal("list items", blocks[1].items.map(item => item[0].text), ["one", "two"]);
  equal("table drops the separator row", blocks[2].rows.map(row => row.map(cell => cell[0].text)), [["d4", "Effect"], ["1", "Fire"]]);
  equal("level labels", [0, 1, 2, 3, 4, 9].map(levelLabel), ["Cantrip", "1st level", "2nd level", "3rd level", "4th level", "9th level"]);
  equal("levels include cantrips and slotless spells", spellRules.spellLevels({slots: {1: 2, 2: 1}, spells: [{level: 0}, {level: 4}, {level: 1}]}), [0, 1, 2, 4]);
}

section("Editing the spell list");
{
  const library = await loadSpellLibrary();
  const spells = () => state.character.spellcasting.spells;
  fresh();
  const before = spells().length;
  characterStore.addSpell(library.find(spell => spell.id === "srd_bless"));
  equal("adding appends a linked entry", spells()[before], {id: "srd_bless", name: "Bless", level: 1, isAlwaysPrepared: false, text: ""});
  characterStore.replaceSpell(0, library.find(spell => spell.id === "srd_shield-of-faith"));
  equal("swapping replaces in place", spells()[0].name, "Shield of Faith");
  characterStore.pinSpellVersion(6, library.find(spell => spell.id === "srd-2024_misty-step"));
  equal("pinning a version keeps the oath flag", [spells()[6].id, spells()[6].isAlwaysPrepared], ["srd-2024_misty-step", true]);
  characterStore.setSpellText(4, "Thunder rings out.");
  equal("typed text saves on the entry", spells()[4].text, "Thunder rings out.");
  characterStore.removeSpell(0);
  equal("removing drops it", [spells().length, spells()[0].name], [before, "Ensnaring Strike"]);
  hydrate();
  equal("spell edits survive a reload", spells()[3].text, "Thunder rings out.");
}

section("Edit-mode saves");
{
  fresh();
  let redraws = 0;
  const {changes, toggleEditing} = await import("../src/store/state.js");
  changes.subscribe(() => redraws++);
  characterStore.setScore("dex", 14);
  characterStore.setField("name", "Shelly");
  characterStore.setAttack(0, "name", "Trident of the Deep");
  characterStore.setPersonality("flaws", "Too trusting.");
  equal("typed edits save without redrawing", redraws, 0);
  hydrate();
  equal("and survive a reload", [state.character.scores.dex, state.character.name, state.character.attacks[0].name, state.character.personality.flaws],
    [14, "Shelly", "Trident of the Deep", "Too trusting."]);
  toggleEditing();
  equal("toggling edit mode redraws", [state.isEditing, redraws], [true, 1]);
  toggleEditing();
  fresh();
  characterStore.cycleAttackAbility(0);
  equal("cycling an attack's ability", state.character.attacks[0].ability, "dex");
  characterStore.cycleAttackAbility(0);
  equal("and back", state.character.attacks[0].ability, "str");
  playStore.toggleSlot(3, 0);
  playStore.toggleSlot(3, 1);
  characterStore.setSlotTotal(3, 1);
  equal("lowering slots trims what's spent", state.play.slotsSpent[3], [0]);
  characterStore.setSlotTotal(3, 0);
  equal("zero slots removes the level", [3 in state.character.spellcasting.slots, state.play.slotsSpent[3]], [false, []]);
  characterStore.setSlotTotal(4, 1);
  equal("a new slot level", state.character.spellcasting.slots[4], 1);
}

process.exit(report() ? 0 : 1);
