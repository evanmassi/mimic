import {installDom, installStorage} from "./dom.mjs";
import {section, check, equal, report} from "./checks.mjs";

const els = installDom();
installStorage();

const {state, hydrate, changes} = await import("../src/store/state.js");
const {render} = await import("../src/views/app.js");
const {mountDrawer} = await import("../src/views/drawers/drawer.js");
const {loadSpellLibrary} = await import("../src/store/spellLibrary.js");
const {TRAY_CLOSE_MS} = await import("../src/data/constants.js");
const playStoreView = await import("../src/store/play.js");
const {openBackupDrawer} = await import("../src/views/drawers/backupDrawer.js");

mountDrawer(els.drawer, els.drawertitle, els.drawerbody, els.drawerclose, els.drawerback);
changes.subscribe(render);

const nodes = root => root.children.flatMap(child => [child, ...nodes(child)]);
const byText = (root, text) => nodes(root).find(node => node.tag === "button" && (node.textContent === text || node.attrs["aria-label"] === text));
const tap = (root, text) => byText(root, text).fire("click");
const drawerOpen = () => !els.drawer.hidden && !("closing" in els.drawer.dataset);
const hudText = className => els.hud.find(className)[0].textContent;
const settle = async () => { await loadSpellLibrary(); await new Promise(done => setTimeout(done, 0)); };
const sheetSpells = () => els.main.find("spell");
const pickNamed = name => els.drawerbody.find("pick").find(pick => pick.find("pick-name")[0].textContent === name);

function fresh(){
  localStorage.clear();
  state.isEditing = false;
  state.openAttack = null;
  state.tray = null;
  els.drawer.hidden = true;
  delete els.drawer.dataset.closing;
  hydrate();
  render();
}

section("The sheet renders");
{
  fresh();
  equal("HUD shows the name", hudText("hud-name"), "Nawe Ironshell");
  equal("HUD shows AC and speed", [els.hud.find("hud-ac")[0].find("badge-value")[0].textContent, els.hud.find("hud-speed")[0].find("badge-value")[0].textContent], ["19", "30"]);
  equal("HUD shows HP", hudText("hp-text"), "106 / 106");
  equal("HUD shows a slot row per spell level", els.hud.find("hud-slot").length, 3);
  equal("the hit die reads as a die", els.main.find("banner-field").find(box => box.find("stat-label")[0].textContent === "Hit die").find("stat-value")[0].textContent, "d10");
  equal("six ability boxes", els.main.find("ability").length, 6);
  equal("six saves and eighteen skills", els.main.find("prof").length, 24);
  equal("every attack renders", els.main.find("attack").length, 4);
  equal("every feature renders", els.main.find("feature").length, 11);
  equal("spells split by level", els.main.find("spell-names").map(row => row.children.length), [6, 3, 5]);
  equal("oath spells are marked", els.main.find("spell-always").length, 6);
  equal("the version shows at the bottom", els.main.find("app-version")[0].textContent.startsWith("Mimic v"), true);
  check("a notes box and drawing pad render", els.main.find("notes-text").length === 1 && els.main.find("notes-pad").length === 1);
}

section("HP buttons and the drag bar");
{
  fresh();
  const tapBar = () => {
    const bar = els.hud.find("hp-bar")[0];
    bar.fire("pointerdown", {clientX: 100});
    bar.fire("pointerup");
  };
  tapBar();
  check("a tap on the bar unrolls the HP scroll under it", els.hud.find("hp-steps").length === 1 && !drawerOpen());
  tap(els.hud, "−1");
  equal("−1 takes 1 HP and the scroll stays open", [state.play.hp, els.hud.find("hp-steps").length], [105, 1]);
  check("the bar shakes on a hit", els.hud.find("hp-bar")[0].classList.contains("hit"));
  tap(els.hud, "+5");
  equal("+5 heals up to the max", state.play.hp, 106);
  check("the bar flashes on a heal", els.hud.find("hp-bar")[0].classList.contains("healed"));
  tapBar();
  equal("tapping the bar again rolls it up", els.hud.find("tray")[0].dataset.motion, "close");
  state.tray = null;
  render();

  const bar = els.hud.find("hp-bar")[0];
  bar.clientWidth = 300;
  bar.fire("pointerdown", {clientX: 200});
  bar.fire("pointermove", {clientX: 50});
  equal("dragging previews the change", bar.find("hp-delta")[0].textContent, "−32");
  equal("the preview doesn't save yet", state.play.hp, 106);
  bar.fire("pointerup");
  equal("letting go applies it", state.play.hp, 74);
  const worn = els.hud.find("hp-bar")[0];
  equal("the bar wears with lost HP", worn.style["--wear"], "0.302");
  equal("cracks form at their HP levels", worn.find("hp-crack").map(crack => crack.dataset.on), ["on", "off", "off", "off", "off", "off"]);

  const again = els.hud.find("hp-bar")[0];
  again.fire("pointerdown", {clientX: 100});
  again.fire("pointermove", {clientX: 103});
  again.fire("pointerup");
  check("a tap opens the HP scroll", els.hud.find("hp-entry").length === 1);
  const amount = els.hud.find("hp-entry")[0].find("field-input")[0];
  amount.value = "2x0";
  amount.fire("input");
  equal("the amount takes digits only", amount.value, "20");
  equal("each outcome shows where you'd land", els.hud.find("hp-result").map(result => result.textContent), ["→ 54", "→ 94", "+20"]);
  els.hud.find("hp-outcome").find(button => button.find("hp-outcome-word")[0].textContent === "Temp HP").fire("click");
  equal("temp HP applies and the scroll rolls up", [state.play.tempHp, hudText("hp-text"), els.hud.find("hp-entry").length], [20, "74 / 106  +20", 0]);
  tapBar();
  els.hud.find("hp-max-change")[0].fire("click");
  els.hud.find("hp-max")[0].find("field-input")[0].value = "110";
  tap(els.hud.find("hp-max")[0], "Set");
  equal("the max can be changed from the foot", state.character.maxHp, 110);
}

section("The slip under the HP bar");
{
  fresh();
  playStoreView.adjustHp(-1);
  const slip = () => els.hud.find("notice")[0];
  const undoIcon = () => byText(els.hud, "Undo");
  equal("a change leaves no slip, just Undo ready in the HUD", [els.hud.find("notice").length, undoIcon().disabled, undoIcon().dataset.tone], [0, false, "blood"]);
  tap(els.hud, "Undo");
  equal("Undo puts it back and greys out", [state.play.hp, undoIcon().disabled], [106, true]);
  playStoreView.toggleCondition("poisoned");
  equal("a condition tap leaves no slip", els.hud.find("notice").length, 0);
  playStoreView.toggleCondition("poisoned");
  els.hud.find("hud-slot")[0].find("dot")[0].fire("click");
  equal("nor does an orb tap", [els.hud.find("notice").length, state.play.slotsSpent[1]], [0, [0]]);
  playStoreView.toggleCondition("concentrating");
  playStoreView.adjustHp(-1);
  equal("damage while concentrating asks for the save", [slip().find("notice-stamp-value")[0].textContent, slip().find("notice-bonus")[0].textContent], ["10", "+4"]);
  tap(slip(), "Lost");
  check("Lost drops Concentrating", !state.play.conditions.includes("concentrating"));
  playStoreView.toggleCondition("concentrating");
  playStoreView.adjustHp(-1);
  tap(slip(), "Held");
  equal("Held puts the slip away", els.hud.find("notice").length, 0);
}

section("Death saves appear at 0 HP");
{
  fresh();
  check("no death saves while standing", els.hud.find("hud-death").length === 0);
  const bar = els.hud.find("hp-bar")[0];
  bar.clientWidth = 300;
  bar.fire("pointerdown", {clientX: 300});
  bar.fire("pointermove", {clientX: -2000});
  bar.fire("pointerup");
  equal("dragging all the way left drops to 0", state.play.hp, 0);
  check("death saves take the slot row", els.hud.find("hud-death").length === 1 && els.hud.find("hud-slots").length === 0);
  const fallen = () => els.hud.find("hp-bar")[0];
  check("the bar shatters", fallen().classList.contains("shatter") && document.body.find("fx").some(fx => fx.dataset.kind === "fall"));
  equal("every crack is open and you're dying", [fallen().find("hp-crack").every(crack => crack.dataset.on === "on"), fallen().dataset.fate], [true, "dying"]);
  check("dropping to 0 knocks you unconscious", els.hud.find("tag").some(tag => tag.dataset.condition === "unconscious"));
  tap(els.hud, "Add a condition");
  els.hud.find("tray")[0].find("tag").find(tag => tag.textContent === "Unconscious").fire("click");
  check("it can't be taken off while at 0, and says why", els.hud.find("hud-status")[0].find("tag").some(tag => tag.textContent === "Unconscious")
    && els.hud.find("tray-rule-text")[0].textContent.startsWith("From dropping to 0 HP."));
  state.tray = null;
  state.play = {...state.play, deathSaves: {successes: 3, failures: 0}};
  render();
  equal("three successes steady the bar", fallen().dataset.fate, "stable");
  state.play = {...state.play, deathSaves: {successes: 1, failures: 3}};
  render();
  equal("three failures and it goes dark", fallen().dataset.fate, "dead");
}

section("The aura seal on the saves");
{
  fresh();
  const saves = () => els.main.find("frame").find(frame => frame.find("frame-label")[0].textContent === "Saving throws");
  const seal = () => saves().find("seal")[0];
  equal("the saves box glows with a +3 aura seal", [saves().dataset.seal, seal().textContent, seal().dataset.lit], ["lit", "+3Aura", "on"]);
  equal("the save numbers stay as written", saves().find("prof-value")[2].textContent, "+4");
  playStoreView.adjustHp(-200);
  equal("dropping to 0 HP puts the aura out", [saves().dataset.seal, seal().dataset.lit], ["out", "off"]);
  check("other boxes have no seal", !("seal" in els.main.find("frame").find(frame => frame.find("frame-label")[0].textContent === "Skills").dataset));
}

section("Roll marks");
{
  fresh();
  const frame = label => els.main.find("frame").find(one => one.find("frame-label")[0].textContent === label);
  const marksIn = node => node.find("dice-mark").map(mark => mark.dataset.roll);
  const initiative = () => els.main.find("combat-box").find(box => box.find("stat-label")[0].textContent === "Initiative");
  const spellAttack = () => els.main.find("spell-stat").find(box => box.find("stat-label")[0].textContent === "Attack");
  check("no marks on a fresh sheet", els.main.find("dice-mark").length === 0 && els.main.find("foes-note").length === 0);
  playStoreView.toggleCondition("poisoned");
  equal("poisoned marks the skills once, not every row", [marksIn(frame("Skills").find("frame-label")[0]), frame("Skills").find("prof").flatMap(marksIn)], [["dis"], []]);
  equal("and initiative, the attack column and the spell attack", [marksIn(initiative()), marksIn(els.main.find("attack-head")[0]), marksIn(spellAttack())], [["dis"], ["dis"], ["dis"]]);
  equal("the saves stay clear", marksIn(frame("Saving throws")), []);
  playStoreView.toggleCondition("poisoned");
  playStoreView.toggleActive("shellDefense");
  const saveRows = () => frame("Saving throws").find("prof").map(row => [row.find("prof-name")[0].textContent, marksIn(row)[0] || null]);
  equal("shell defense marks only the saves it changes", saveRows().filter(([, roll]) => roll), [["Strength", "adv"], ["Dexterity", "dis"], ["Constitution", "adv"]]);
  equal("prone warns about foes up close", els.main.find("foes-note")[0].textContent, "Near foes adv.");
  playStoreView.toggleActive("shellDefense");
  playStoreView.setExhaustion(3);
  equal("exhaustion 3 marks the saves once", [marksIn(frame("Saving throws").find("frame-label")[0]), frame("Saving throws").find("prof").flatMap(marksIn)], [["dis"], []]);
}

section("Hit dice are a rack of the character's die");
{
  fresh();
  const dice = () => els.main.find("die");
  equal("one d10 per level, all ready", [dice().length, dice().every(die => die.dataset.die === "d10" && die.dataset.on === "on")], [10, true]);
  dice()[0].fire("click");
  equal("tapping a ready die spends the last one, which rolls away and leaves a ghost", [state.play.hitDiceSpent, dice()[9].dataset.on, dice()[9].dataset.motion], [1, "off", "out"]);
  dice()[9].fire("click");
  equal("tapping the ghost brings it back, dropping in", [state.play.hitDiceSpent, dice()[9].dataset.on, dice()[9].dataset.motion], [0, "on", "in"]);
  render();
  equal("a later redraw doesn't replay it", dice()[9].dataset.motion, "still");
}

section("Backup sits folded at the bottom");
{
  fresh();
  state.isBackupOpen = false;
  render();
  const box = () => els.main.find("backup")[0];
  equal("it starts folded, saying when you last saved", [box().dataset.open, box().find("backup-when")[0].textContent, els.main.find("backup-actions").length], ["off", "Never saved", 0]);
  box().find("backup-toggle")[0].fire("click");
  equal("a tap unfolds Save and Load", box().find("backup-actions")[0].children.map(button => button.textContent), ["Save a backup", "Load a backup"]);
  openBackupDrawer(null);
  check("a stray file is turned away without changes", drawerOpen() && els.drawerbody.find("backup-warn")[0].textContent.startsWith("This file isn't a Mimic backup"));
  openBackupDrawer({savedAt: "2026-11-20T18:00:00.000Z", character: {...state.character, level: 11}, play: state.play, notes: state.notes});
  equal("a real one shows who's here and who's in the file", els.drawerbody.find("backup-meta").map(meta => meta.textContent), ["Paladin 10 · on this phone now", "Paladin 11 · backup from Nov 20, 2026"]);
  tap(els.drawerbody, "Replace with the backup");
  equal("replacing loads it", state.character.level, 11);
  state.isBackupOpen = false;
}

section("Shell Defense");
{
  fresh();
  tap(els.main, "Withdraw");
  equal("AC goes to 23 in the HUD", els.hud.find("hud-ac")[0].find("badge-value")[0].textContent, "23");
  equal("the AC badge is marked as changed", els.hud.find("hud-ac")[0].dataset.changed, "on");
  equal("speed goes to 0", els.hud.find("hud-speed")[0].find("badge-value")[0].textContent, "0");
  check("prone shows as a tag", els.hud.find("tag").some(tag => tag.textContent === "Prone"));
  tap(els.main, "Emerge");
  equal("emerging restores AC", els.hud.find("hud-ac")[0].find("badge-value")[0].textContent, "19");
}

section("The condition tray");
{
  fresh();
  const tray = () => els.hud.find("tray")[0];
  const trayChip = name => tray().find("tag").find(tag => tag.textContent === name);
  const statusTags = () => els.hud.find("hud-status")[0].find("tag").filter(tag => tag.dataset.condition).map(tag => tag.textContent);
  const rule = part => tray().find("tray-rule-" + part)[0].textContent;
  tap(els.hud, "Add a condition");
  equal("+ unrolls the tray in the HUD", tray().dataset.motion, "open");
  equal("no drawer covers the HUD", drawerOpen(), false);
  equal("it lists every condition", tray().find("tag").length, 15);
  trayChip("Poisoned").fire("click");
  equal("tapping one adds it to the status line", statusTags(), ["Poisoned"]);
  equal("the tray stays open without unrolling again", tray().dataset.motion, "still");
  equal("and says what it does", rule("name"), "Poisoned");
  trayChip("Poisoned").fire("click");
  equal("tapping it again takes it off", statusTags(), []);
  tray().find("tray-exhaustion")[0].find("dot")[1].fire("click");
  equal("tapping the second exhaustion dot in the tray sets level 2", state.play.exhaustion, 2);
  equal("exhaustion shows as a chip", els.hud.find("tag-exh")[0].find("exh-pip").map(pip => pip.dataset.on).join(" "), "on on off off off off");
  equal("speed halves in the HUD", els.hud.find("hud-speed")[0].find("badge-value")[0].textContent, "15");
  equal("the tray explains the level", rule("name"), "Exhaustion 2");
  tap(els.main, "Withdraw");
  trayChip("Prone").fire("click");
  check("a condition from a feature stays on", statusTags().includes("Prone") && rule("text").startsWith("From an active feature."));
  tap(els.main, "Emerge");
  trayChip("Charmed").fire("click");
  tap(tray(), "Close");
  equal("Close rolls it up", tray().dataset.motion, "close");
  await new Promise(done => setTimeout(done, TRAY_CLOSE_MS));
  equal("and then it's gone", els.hud.find("tray").length, 0);
  els.hud.find("hud-status")[0].find("tag").find(tag => tag.dataset.condition === "charmed").fire("click");
  equal("tapping a chip in the status line opens the tray to its rules", rule("name"), "Charmed");
}

section("The sheet is locked until you tap Edit");
{
  fresh();
  check("pen fields are plain text outside edit mode", els.main.find("ability")[0].find("field-input").length === 0 && els.main.find("banner-name").length === 1);
  const athletics = () => els.main.find("prof").find(row => row.find("prof-name")[0].textContent === "Athletics");
  check("proficiency bubbles are locked", athletics().find("dot")[0].disabled);
  check("pencil things still work: coins are editable", els.main.find("coin")[0].find("field-input").length === 1);
  check("pencil things still work: hit dice", !els.main.find("die")[0].disabled);
}

section("Pencil fields are always writable");
{
  fresh();
  const equipment = els.main.find("ruled")[0].find("field-input")[0];
  check("equipment is a ruled box you can write in", equipment.value.startsWith("Explorer's pack"));
  equipment.value = "Rope\n\nTorch  ";
  equipment.fire("input");
  equal("lists save one item per line", state.character.equipment, ["Rope", "Torch"]);
  const languages = els.main.find("ruled")[1].find("field-input")[0];
  languages.value = "Common, Aquan, Orc, Sylvan";
  languages.fire("input");
  equal("so do languages", state.character.otherProficiencies, ["Common, Aquan, Orc, Sylvan"]);

  const gold = els.main.find("coin")[3].find("field-input")[0];
  gold.value = "250";
  gold.fire("input");
  equal("coins save as you type", state.character.coins.gp, 250);
}

section("Attacks open in place");
{
  fresh();
  els.main.find("attack")[1].fire("click");
  equal("tapping an attack opens its editor", els.main.find("attack-edit").length, 1);
  const card = els.main.find("attack-edit")[0];
  const magic = card.find("field-input")[1];
  magic.value = "1";
  magic.fire("input");
  card.find("btn").find(button => button.textContent === "STR").fire("click");
  equal("the ability button cycles", state.character.attacks[1].ability, "dex");
  tap(els.main.find("attack-edit")[0], "Done");
  equal("Done closes it with the new numbers", els.main.find("attack")[1].find("attack-cell")[1].textContent, "+5");
  const before = state.character.attacks.length;
  tap(els.main, "+ Add an attack");
  equal("a new attack opens ready to fill in", [state.character.attacks.length, els.main.find("attack-edit").length], [before + 1, 1]);
  tap(els.main, "Remove");
  equal("removing an attack", [state.character.attacks.length, els.main.find("attack-edit").length], [before, 0]);
}

section("Edit mode");
{
  fresh();
  tap(els.hud, "Edit");
  equal("the quill turns solid", byText(els.hud, "Done editing").dataset.chosen, "on");
  equal("the sheet is marked as editing", els.main.dataset.editing, "on");
  check("an editing hint shows", els.main.find("edit-hint").length === 1);

  const strength = els.main.find("ability")[0].find("field-input")[0];
  strength.value = "14";
  strength.fire("input");
  equal("typing a score saves it", state.character.scores.str, 14);
  equal("its modifier updates in place", els.main.find("ability-mod")[0].textContent, "+2");
  check("typing doesn't redraw the sheet", els.main.find("ability")[0].find("field-input")[0] === strength);
  strength.value = "";
  strength.fire("input");
  equal("a half-typed score doesn't save", state.character.scores.str, 14);

  const name = els.main.find("banner")[0].find("field-input")[0];
  name.value = "Shelly";
  name.fire("input");
  const athletics = () => els.main.find("prof").find(row => row.find("prof-name")[0].textContent === "Athletics");
  athletics().find("dot")[0].fire("click");
  equal("bubbles toggle in edit mode", state.character.skillProficiencies.includes("athletics"), false);
  equal("tapping a button redraws with the new numbers", athletics().find("prof-value")[0].textContent, "+2");

  const level4 = els.main.find("slot-total").find(box => box.find("spell-hex")[0].textContent === "4").find("field-input")[0];
  level4.value = "1";
  level4.fire("input");

  tap(els.hud, "Done editing");
  equal("Done leaves edit mode", [els.main.dataset.editing, hudText("hud-name")], ["off", "Shelly"]);
  check("and the sheet shows plain text again", els.main.find("banner-name").length === 1);
  equal("a new slot level reaches the HUD", els.hud.find("hud-slot").length, 4);
}

section("Whimsy");
{
  fresh();
  const layer = () => document.body.find("fx-layer")[0];
  const effects = kind => layer() ? layer().find("fx").filter(fx => fx.dataset.kind === kind) : [];
  if(layer()) layer().children = [];
  playStoreView.adjustHp(-1);
  check("damage throws blood and a number", effects("blood").length === 1 && effects("number").some(fx => fx.textContent === "−1"));
  playStoreView.adjustHp(1);
  check("healing sparkles", effects("sparkle").length === 1 && effects("number").some(fx => fx.textContent === "+1"));
  els.hud.find("hud-slot")[0].find("dot")[3].fire("click");
  check("spending a slot casts a mana burst", effects("mana").length === 1);
  tap(els.hud, "Add a condition");
  els.hud.find("tray")[0].find("tag").find(tag => tag.textContent === "Poisoned").fire("click");
  const poisoned = els.hud.find("hud-status")[0].find("tag").find(tag => tag.textContent === "Poisoned");
  equal("the chip is marked with its condition", poisoned.dataset.condition, "poisoned");
  equal("a new condition bubbles once", effects("bubbles").length, 1);
  playStoreView.adjustHp(1);
  equal("a redraw doesn't replay it", effects("bubbles").length, 1);
  els.hud.find("hud-slot")[1].find("dot")[0].fire("click");
  equal("tapping the first orb spends that orb", els.hud.find("hud-slot")[1].find("dot").map(dot => dot.dataset.on), ["off", "on", "on"]);
  els.hud.find("hud-slot")[1].find("dot")[0].fire("click");
  equal("tapping it again brings it back", state.play.slotsSpent[2], []);
  state.isEditing = true;
  render();
  els.main.find("prof")[1].find("dot")[0].fire("click");
  check("filling a dot stamps a seal", effects("seal").length === 1);
  state.isEditing = false;
  render();
  tap(els.main, "Withdraw");
  check("shell defense slams the AC shield", els.hud.find("hud-ac")[0].classList.contains("slam"));
  equal("a condition from a feature plays its own burst", effects("thud").length, 1);
  tap(els.hud, "Rest");
  els.drawerbody.find("pick")[1].fire("click");
  check("a long rest brings the night", effects("moon").length === 1);
  const deathRow = kind => els.main.find("vital")[1].find("dots")[kind === "life" ? 0 : 1];
  deathRow("life").find("dot")[0].fire("click");
  check("a death save success lights a candle", effects("heartbeat").length === 1);
  deathRow("life").find("dot")[2].fire("click");
  equal("each tap adds one save, wherever you tap", state.play.deathSaves.successes, 2);
  deathRow("life").find("dot")[2].fire("click");
  check("the third success says Stable on a banner", effects("stable").some(fx => fx.find("fx-letter").map(letter => letter.textContent).join("") === "Stable"));
  deathRow("death").find("dot")[0].fire("click");
  check("a failure brings a skull", effects("skull").length === 1);
  deathRow("death").find("dot")[2].fire("click");
  deathRow("death").find("dot")[2].fire("click");
  check("the third failure is grim", effects("doom").some(fx => fx.find("fx-letter").map(letter => letter.textContent).join("") === "Dead"));
  els.hud.find("tray-exhaustion")[0].find("dot")[0].fire("click");
  check("exhaustion sags", effects("weary").length === 1);
  els.main.find("feature").find(item => item.find("feature-name")[0].textContent === "Divine Sense").find("dot")[3].fire("click");
  check("spending a feature use shines holy light", effects("holy").length === 1);
}

section("Slots, smite and resources");
{
  fresh();
  els.hud.find("hud-slot")[0].find("dot")[3].fire("click");
  equal("tapping the last level 1 slot in the HUD spends that one", state.play.slotsSpent[1], [3]);
  tap(els.main, "Lv 2 · 3d8");
  equal("smiting at level 2 spends a level 2 slot", state.play.slotsSpent[2], [2]);
  equal("the HUD slot row follows", els.hud.find("hud-slot")[1].find("dot").filter(dot => dot.dataset.on === "on").length, 2);
  tap(els.main, "−5");
  equal("lay on hands spends from the pool", els.main.find("pool-count")[0].textContent, "45/50");
  tap(els.main, "+1");
  equal("+1 puts a point back", els.main.find("pool-count")[0].textContent, "46/50");
  tap(els.main, "+5");
  equal("+5 fills it no further than full", els.main.find("pool-count")[0].textContent, "50/50");
  check("adding is off while the pool is full", byText(els.main, "+1").disabled && byText(els.main, "+5").disabled);
}

section("Feature uses are independent orbs");
{
  fresh();
  const senseOrbs = () => els.main.find("feature").find(item => item.find("feature-name")[0].textContent === "Divine Sense").find("dot");
  senseOrbs()[1].fire("click");
  equal("tapping the second orb spends that orb", senseOrbs().map(dot => dot.dataset.on), ["on", "off", "on", "on"]);
  senseOrbs()[1].fire("click");
  equal("tapping it again brings it back", state.play.spent.divineSense, []);
}

section("Resting");
{
  fresh();
  playStoreView.adjustHp(-1);
  tap(els.main, "Lv 1 · 2d8");
  tap(els.hud, "Rest");
  check("the rest drawer opens", drawerOpen() && els.drawertitle.textContent === "Rest");
  check("short rest names what comes back", els.drawerbody.find("pick-effect")[0].textContent.startsWith("Channel Divinity come back"));
  els.drawerbody.find("pick")[1].fire("click");
  equal("long rest restores HP and slots", [state.play.hp, state.play.slotsSpent], [106, {}]);
}

section("Notes");
{
  fresh();
  const text = els.main.find("notes-text")[0];
  text.value = "Goblin ambush at the bridge";
  text.fire("input");
  equal("typing saves the note", state.notes.text, "Goblin ambush at the bridge");
  check("typing doesn't redraw the box", els.main.find("notes-text")[0] === text);
  const pad = els.main.find("notes-pad")[0];
  pad.fire("pointerdown", {offsetX: 1, offsetY: 1});
  pad.fire("pointermove", {offsetX: 5, offsetY: 5});
  pad.fire("pointerup");
  check("a stroke saves the drawing", state.notes.drawing !== null);
  tap(els.main, "Clear drawing");
  equal("clear wipes it", state.notes.drawing, null);
}

section("Reading a spell");
{
  fresh();
  sheetSpells().find(spell => spell.textContent === "Misty Step").fire("click");
  check("the drawer opens straight away", drawerOpen() && els.drawertitle.textContent === "Misty Step");
  await settle();
  equal("the full spell shows", els.drawerbody.find("spell-title-name")[0].textContent, "Misty Step");
  equal("it's labeled with its source", els.drawerbody.find("spell-tag")[0].textContent, "2014 SRD");
  check("casting time, range, components and duration show", els.drawerbody.find("spell-meta-label").length === 4);
  const versions = els.drawerbody.find("chip-row")[0];
  equal("other versions are offered", versions.children.map(chip => chip.textContent), ["2014 SRD", "2024 SRD", "Level Up"]);
  versions.children[1].fire("click");
  equal("picking a version pins it", state.character.spellcasting.spells[6].id, "srd-2024_misty-step");
  equal("and shows it", els.drawerbody.find("spell-tag")[0].textContent, "2024 SRD");
}

section("A spell from a closed book");
{
  fresh();
  sheetSpells().find(spell => spell.textContent === "Compelled Duel").fire("click");
  await settle();
  check("it explains why there's no text", els.drawerbody.find("search-note").some(note => note.textContent.includes("isn't in the open reference")));
  els.drawerbody.find("field-input")[0].value = "Compel a creature into a duel.";
  tap(els.drawerbody, "Save text");
  equal("typed text saves", state.character.spellcasting.spells[0].text, "Compel a creature into a duel.");
}

section("Swapping a spell out");
{
  fresh();
  sheetSpells().find(spell => spell.textContent === "Revivify").fire("click");
  await settle();
  tap(els.drawerbody, "Swap out");
  await settle();
  equal("the search opens for the swap", els.drawertitle.textContent, "Swap out Revivify");
  check("filtered to the same level", els.drawerbody.find("chip-row")[0].children.find(chip => chip.dataset.chosen === "on").textContent === "3");
  const input = els.drawerbody.find("field-input")[0];
  input.value = "remove curse";
  input.fire("input");
  pickNamed("Remove Curse").fire("click");
  check("tapping a result shows the whole spell", els.drawerbody.find("spell-detail").length === 1);
  tap(els.drawerbody, "Swap in for Revivify");
  check("the drawer closes", !drawerOpen());
  check("the sheet shows the new spell", sheetSpells().some(spell => spell.textContent === "Remove Curse") && !sheetSpells().some(spell => spell.textContent === "Revivify"));
}

section("Adding and removing spells");
{
  fresh();
  tap(els.main, "+ Add a spell");
  await settle();
  equal("the add search opens", els.drawertitle.textContent, "Add a spell");
  const input = els.drawerbody.find("field-input")[0];
  input.value = "fireball";
  input.fire("input");
  check("paladin list leaves out wizard spells", !els.drawerbody.find("pick").some(pick => pick.find("pick-name")[0].textContent === "Fireball"));
  tap(els.drawerbody, "Every class");
  equal("every class finds it first", els.drawerbody.find("pick-name")[0].textContent, "Fireball");
  els.drawerbody.find("pick")[0].fire("click");
  tap(els.drawerbody, "Add to my spells");
  check("it lands on the sheet under a new 3rd-level spell", sheetSpells().some(spell => spell.textContent === "Fireball"));

  tap(els.main, "+ Add a spell");
  await settle();
  const typed = els.drawerbody.find("field-input")[0];
  typed.value = "Nawe's Tidal Slam";
  typed.fire("input");
  tap(els.drawerbody, "Add “Nawe's Tidal Slam” as my own spell");
  check("homemade spells can be added", sheetSpells().some(spell => spell.textContent === "Nawe's Tidal Slam"));

  sheetSpells().find(spell => spell.textContent === "Fireball").fire("click");
  await settle();
  tap(els.drawerbody, "Remove");
  check("removing takes it off the sheet", !sheetSpells().some(spell => spell.textContent === "Fireball"));
}

process.exit(report() ? 0 : 1);
