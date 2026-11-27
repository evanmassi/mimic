export const SAMPLE_CHARACTER = {
  name: "Nawe Ironshell",
  playerName: "Evan",
  className: "Paladin",
  subclass: "Oath of the Ancients",
  level: 10,
  race: "Tortle",
  background: "Outlander",
  alignment: "Neutral Good",
  scores: {str: 20, dex: 10, con: 19, int: 8, wis: 12, cha: 16},
  saveProficiencies: ["wis", "cha"],
  skillProficiencies: ["athletics", "insight", "intimidation", "perception", "survival"],
  skillAbilities: {religion: "wis"},
  armorClass: 19,
  speed: 30,
  maxHp: 106,
  hitDie: 10,
  attacks: [
    {name: "Trident +1", ability: "str", magicBonus: 1, damageDice: "1d6", damageBonus: 2, damageType: "P"},
    {name: "Mace", ability: "str", magicBonus: 0, damageDice: "1d6", damageBonus: 2, damageType: "B"},
    {name: "Claws", ability: "str", magicBonus: 0, damageDice: "1d6", damageBonus: 2, damageType: "S"},
    {name: "Staff", ability: "str", magicBonus: 0, damageDice: "1d4", damageBonus: 2, damageType: "B"}
  ],
  spellcasting: {
    ability: "cha",
    slots: {1: 4, 2: 3, 3: 2},
    spells: [
      {id: null, name: "Compelled Duel", level: 1, isAlwaysPrepared: false, text: ""},
      {id: "srd-2024_ensnaring-strike", name: "Ensnaring Strike", level: 1, isAlwaysPrepared: true, text: ""},
      {id: "srd_protection-from-evil-and-good", name: "Protection from Evil and Good", level: 1, isAlwaysPrepared: false, text: ""},
      {id: "srd_speak-with-animals", name: "Speak with Animals", level: 1, isAlwaysPrepared: true, text: ""},
      {id: null, name: "Thunderous Smite", level: 1, isAlwaysPrepared: false, text: ""},
      {id: null, name: "Wrathful Smite", level: 1, isAlwaysPrepared: false, text: ""},
      {id: "srd_misty-step", name: "Misty Step", level: 2, isAlwaysPrepared: true, text: ""},
      {id: "srd_moonbeam", name: "Moonbeam", level: 2, isAlwaysPrepared: true, text: ""},
      {id: "srd-2024_searing-smite", name: "Searing Smite", level: 2, isAlwaysPrepared: false, text: ""},
      {id: null, name: "Blinding Smite", level: 3, isAlwaysPrepared: false, text: ""},
      {id: "srd_plant-growth", name: "Plant Growth", level: 3, isAlwaysPrepared: true, text: ""},
      {id: null, name: "Crusader's Mantle", level: 3, isAlwaysPrepared: false, text: ""},
      {id: "srd_protection-from-energy", name: "Protection from Energy", level: 3, isAlwaysPrepared: true, text: ""},
      {id: "srd_revivify", name: "Revivify", level: 3, isAlwaysPrepared: false, text: ""}
    ]
  },
  features: [
    {id: "shellDefense", name: "Shell Defense",
      text: "Action: withdraw into your shell. +4 AC and advantage on STR and CON saves. You are prone, speed 0, disadvantage on DEX saves, no reactions. Bonus action to emerge.",
      tracker: {kind: "toggle", onLabel: "Emerge", offLabel: "Withdraw", effects: {acBonus: 4, speedOverride: 0, conditions: ["prone"],
        rolls: {saves: {str: "adv", con: "adv", dex: "dis"}}}}},
    {id: "divineSmite", name: "Divine Smite",
      text: "On a melee hit, spend a spell slot for radiant damage. +1d8 against undead or fiends.",
      tracker: {kind: "slotSpend", die: "d8", baseDice: 2, maxDice: 5}},
    {id: "layOnHands", name: "Lay on Hands",
      text: "Restore hit points from the pool by touch. 5 points cures one disease or poison.",
      tracker: {kind: "pool", max: {perLevel: 5}, recharge: "long", steps: [1, 5], isHealing: true}},
    {id: "divineSense", name: "Divine Sense",
      text: "Until the end of your next turn, know the location of any celestial, fiend or undead within 60 ft not behind total cover.",
      tracker: {kind: "uses", max: {base: 1, ability: "cha"}, recharge: "long"}},
    {id: "channelDivinity", name: "Channel Divinity",
      text: "Nature's Wrath or Turn the Faithless.",
      tracker: {kind: "uses", max: {base: 1}, recharge: "short"}},
    {id: "extraAttack", name: "Extra Attack", text: "Attack twice when you take the Attack action.", tracker: null,
      effects: {attacks: 2}},
    {id: "auraOfProtection", name: "Aura of Protection", text: "You and friendly creatures within 10 ft add your CHA modifier to saving throws while you're conscious.", tracker: null,
      effects: {saveBonus: {label: "Aura", amount: {ability: "cha"}, min: 1}, whileConscious: true}},
    {id: "auraOfCourage", name: "Aura of Courage", text: "You and friendly creatures within 10 ft can't be frightened.", tracker: null},
    {id: "auraOfWarding", name: "Aura of Warding", text: "You and friendly creatures within 10 ft have resistance to damage from spells.", tracker: null},
    {id: "holdBreath", name: "Hold Breath", text: "Hold your breath for up to 1 hour.", tracker: null},
    {id: "divineHealth", name: "Divine Health", text: "Immune to disease.", tracker: null}
  ],
  otherProficiencies: [
    "Languages: Common, Aquan, Orc (picked up living near the Moonsea)",
    "Weapons: simple and martial"
  ],
  equipment: [
    "Explorer's pack",
    "Holy symbol: Ilmater, God of Endurance",
    "Amulet of Health",
    "Potion of Slipperiness",
    "1 Greater Healing Potion",
    "2 Healing Potions",
    "1 Diamond",
    "Ember",
    "1 Molotov"
  ],
  coins: {cp: 0, sp: 0, ep: 0, gp: 207, pp: 0},
  personality: {
    traits: "Kind and loyal. Quiet, but inquisitive. Nomadic, but longing for a permanent home.",
    ideals: "Nature and a sense of belonging. Always willing to learn new skills and knowledge brought by new people.",
    bonds: "A profound respect for the power and beauty of the natural world. Very protective of the friends he makes, and will use violence to keep them safe.",
    flaws: "Distrustful of new people. Stubborn when confident he's right."
  }
};

export const SAMPLE_NOTES = {text: "Progress toward a benefit: +1", drawing: null};
