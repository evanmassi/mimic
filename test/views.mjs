import {installDom, installStorage} from "./dom.mjs";
import {section, check, equal, report} from "./checks.mjs";

const els = installDom();
installStorage();

const {state, hydrate, changes} = await import("../src/store/state.js");
const {render} = await import("../src/views/app.js");
const {mountDrawer} = await import("../src/views/drawers/drawer.js");
const {loadSpellLibrary} = await import("../src/store/spellLibrary.js");

mountDrawer(els.drawer, els.drawertitle, els.drawerbody, els.drawerclose, els.drawerback);
changes.subscribe(render);

const nodes = root => root.children.flatMap(child => [child, ...nodes(child)]);
const byText = (root, text) => nodes(root).find(node => node.tag === "button" && node.textContent === text);
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
  tap(els.hud, "−");
  equal("minus takes 1 HP", state.play.hp, 105);
  check("the bar shakes on a hit", els.hud.find("hp-bar")[0].classList.contains("hit"));
  tap(els.hud, "+");
  check("the bar flashes on a heal", els.hud.find("hp-bar")[0].classList.contains("healed"));

  const bar = els.hud.find("hp-bar")[0];
  bar.clientWidth = 300;
  bar.fire("pointerdown", {clientX: 200});
  bar.fire("pointermove", {clientX: 50});
  equal("dragging previews the change", bar.find("hp-delta")[0].textContent, "−32");
  equal("the preview doesn't save yet", state.play.hp, 106);
  bar.fire("pointerup");
  equal("letting go applies it", state.play.hp, 74);

  const again = els.hud.find("hp-bar")[0];
  again.fire("pointerdown", {clientX: 100});
  again.fire("pointermove", {clientX: 103});
  again.fire("pointerup");
  check("a tap opens the HP drawer", drawerOpen() && els.drawertitle.textContent === "Hit points");
  els.drawerbody.find("field-input")[0].value = "20";
  tap(els.drawerbody, "Temp HP");
  equal("temp HP from the drawer", [state.play.tempHp, hudText("hp-text")], [20, "74 / 106  +20"]);
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
  check("death saves show in the HUD", els.hud.find("hud-death").length === 1);
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

section("Conditions and exhaustion");
{
  fresh();
  tap(els.hud, "+ condition");
  check("the condition drawer opens", drawerOpen() && els.drawertitle.textContent === "Conditions");
  els.drawerbody.find("pick").find(pick => pick.find("pick-name")[0].textContent === "Poisoned").fire("click");
  check("poisoned shows in the HUD", els.hud.find("tag").some(tag => tag.textContent === "Poisoned"));
  equal("the drawer stays open to pick more", drawerOpen(), true);
  els.hud.find("hud-exhaustion")[0].find("dot")[1].fire("click");
  equal("tapping the second exhaustion dot sets level 2", state.play.exhaustion, 2);
  equal("speed halves in the HUD", els.hud.find("hud-speed")[0].find("badge-value")[0].textContent, "15");
}

section("The sheet is locked until you tap Edit");
{
  fresh();
  check("pen fields are plain text outside edit mode", els.main.find("ability")[0].find("field-input").length === 0 && els.main.find("banner-name").length === 1);
  const athletics = () => els.main.find("prof").find(row => row.find("prof-name")[0].textContent === "Athletics");
  check("proficiency bubbles are locked", athletics().find("dot")[0].disabled);
  check("pencil things still work: coins are editable", els.main.find("coin")[0].find("field-input").length === 1);
  check("pencil things still work: hit dice dots", !els.main.find("vital")[0].find("dot")[0].disabled);
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

  els.hud.find("hp-bar")[0].fire("pointerdown", {clientX: 10});
  els.hud.find("hp-bar")[0].fire("pointerup");
  const max = els.drawerbody.find("field-input")[1];
  max.value = "115";
  tap(els.drawerbody, "Set");
  equal("max HP is set from the HP drawer", [state.character.maxHp, hudText("hp-text")], [115, "106 / 115"]);
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
  equal("the button turns into Done", els.hud.find("btn").some(button => button.textContent === "Done"), true);
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

  tap(els.hud, "Done");
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
  tap(els.hud, "−");
  check("damage throws blood and a number", effects("blood").length === 1 && effects("number").some(fx => fx.textContent === "−1"));
  tap(els.hud, "+");
  check("healing sparkles", effects("sparkle").length === 1 && effects("number").some(fx => fx.textContent === "+1"));
  els.hud.find("hud-slot")[0].find("dot")[3].fire("click");
  check("spending a slot casts a mana burst", effects("mana").length === 1);
  els.hud.find("hud-slot")[1].find("dot")[0].fire("click");
  equal("tapping the first orb spends that orb", els.hud.find("hud-slot")[1].find("dot").map(dot => dot.dataset.on), ["off", "on", "on"]);
  els.hud.find("hud-slot")[1].find("dot")[0].fire("click");
  equal("tapping it again brings it back", state.play.slotsSpent[2], []);
  els.main.find("vital")[0].find("dot")[9].fire("click");
  els.main.find("vital")[0].find("dot")[9].fire("click");
  check("filling a dot stamps a seal", effects("seal").length === 1);
  tap(els.main, "Withdraw");
  check("shell defense slams the AC shield", els.hud.find("hud-ac")[0].classList.contains("slam"));
  tap(els.hud, "Rest");
  els.drawerbody.find("pick")[1].fire("click");
  check("a long rest brings the night", effects("moon").length === 1);
  const deathRow = kind => els.main.find("vital")[1].find("dots")[kind === "life" ? 0 : 1];
  deathRow("life").find("dot")[0].fire("click");
  check("a death save success beats a heart", effects("heartbeat").length === 1);
  deathRow("life").find("dot")[2].fire("click");
  equal("each tap adds one save, wherever you tap", state.play.deathSaves.successes, 2);
  deathRow("life").find("dot")[2].fire("click");
  check("the third success says Stable", effects("stable").some(fx => fx.textContent.includes("Stable")));
  deathRow("death").find("dot")[0].fire("click");
  check("a failure brings a skull", effects("skull").length === 1);
  deathRow("death").find("dot")[2].fire("click");
  deathRow("death").find("dot")[2].fire("click");
  check("the third failure is grim", effects("doom").some(fx => fx.textContent.includes("Dead")));
  els.hud.find("hud-exhaustion")[0].find("dot")[0].fire("click");
  check("exhaustion sags", effects("weary").length === 1);
  const diceBefore = effects("dice").length;
  els.main.find("vital")[0].find("dot")[9].fire("click");
  check("spending a hit die rolls dice", effects("dice").length === diceBefore + 1);
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
}

section("Resting");
{
  fresh();
  tap(els.hud, "−");
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
