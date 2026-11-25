# Design notes

Where Mimic came from, what's decided, and what's next. Started 2026-11-24.

## Why

Evan plays a well-used printed 2014 sheet. Mimic puts it on his phone so the table has more room, and makes the
things that change during play fun to track instead of erasing pencil.

The reference character is **Nawe Ironshell**, a Tortle Paladin 10 (Oath of the Ancients). Photos of the paper sheet
are in `~/Pictures/DnD/Nawe_pg1-3.jpeg`. The app stays character-agnostic. Nawe is the sample it ships with.

## Decided

- **2014 5e rules.**
- **Built like Overload:** static PWA, plain modules, offline, data stays on the phone.
- **Numbers are worked out** from scores, level and proficiencies. Change a score and everything follows.
- **Everything is editable in the app** for level-ups and new loot.
- **No dice roller.** Real dice at the table.
- **Looks like the official sheet**, with an old-timey fantasy feel. The fonts are Solbera's fan recreations of the
  official ones.
- **HP is always visible** in a sticky HUD as a bar you drag left for damage and right for healing. Tap it to type an
  exact amount. Conditions, exhaustion, death saves and spell slots live in the HUD too.
- **Notes take typing and finger drawing.**
- **Pen fields are locked behind an edit mode** (a quill in the top bar). Pencil things like HP, dots, slots,
  conditions and coins stay one tap. Edits happen in place on the sheet, not in bottom drawers.
- **No sound for now.** Feedback is visual: whimsical, themed animation on taps, drags, damage and rests, plus a
  small vibration on Android.
- **Every spell, without bundling closed text:** an Import spells feature reads a spell file Evan emails to himself
  and keeps it only on the phone. Mimic's repo stays openly licensed. *(Not built yet.)*
- **Spells come from every openly licensed source** Open5e gathers (1,955 spells): the 2014 and 2024 SRDs, Level
  Up A5E, Kobold Press books, and community homebrew, each clearly tagged. Books that aren't openly licensed (most of
  the PHB, Xanathar's, Tasha's) can't be bundled; those spells are typed in by the player. Searchable by name and
  text, filterable by level and class list, with swap/add/remove on the sheet.
- **Name: Mimic.** It mimics the paper sheet. The icon is a toothy treasure chest.

## Open questions from the paper sheet

- The trident's damage is scribbled on paper. The app derives 1d6+8, assuming the Dueling style (Mace 1d6+7 implies it).
- What is "Progress toward a benefit +1"? It's in the notes for now.
- "Wraithful Smite" on the sheet is spelled Wrathful Smite in the books; the app uses the book spelling.
- Searing Smite is a 1st-level spell but sits under 2nd on the paper sheet; the app keeps it where Evan put it.
- Channel Divinity wasn't on the sheet. The app tracks it as 1 use per short rest.

## Next up

- **Import spells** from a file (common homebrew formats and Open5e's), merged into search, tagged Imported.
- **More whimsy:** the mimic chomps at 0 HP, themed condition chips, a campfire on short rest.
- **Editing features and their trackers** in edit mode.
- **Spell polish:** prepared-spell limit, a Cast button that spends a slot and starts Concentrating, an index of
  closed-book spells (name, level, school, classes only) so every official spell is at least searchable.
- **Themed condition chips:** each one styled for what it is, but still saying the word. Hearts for Charmed, green
  goop for Poisoned, and so on.
- **Backstory and appearance,** from page 2 of the sheet.
- **Backup export and import,** like Overload's.
- **A new-character flow,** since the app is meant to work for any character.
- **Test on a real phone:** the drag feel, HUD height and touch targets.
- **When Evan says so:** `git init`, a GitHub repo and GitHub Pages.
