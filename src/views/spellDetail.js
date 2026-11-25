import {SPELL_SOURCES} from "../data/spellSources.js";
import {textBlocks} from "../rules/markdown.js";
import {levelLabel} from "../rules/format.js";
import {el} from "./dom.js";

const INLINE_TAGS = {plain: "span", strong: "b", emphasis: "i"};

function inline(node, parts){
  parts.forEach(({style, text}) => node.appendChild(el(INLINE_TAGS[style], null, text)));
  return node;
}

function renderBlock(block){
  if(block.kind === "heading") return inline(el("h4", "spell-heading"), block.parts);
  if(block.kind === "list"){
    const list = el("ul", "spell-list");
    block.items.forEach(parts => list.appendChild(inline(el("li"), parts)));
    return list;
  }
  if(block.kind === "table"){
    const table = el("div", "spell-table");
    block.rows.forEach((cells, index) => {
      const row = el("div", index === 0 ? "spell-row spell-row-head" : "spell-row");
      row.style.setProperty("--cols", String(cells.length));
      cells.forEach(cell => row.appendChild(inline(el("span", "spell-cell"), cell)));
      table.appendChild(row);
    });
    return table;
  }
  return inline(el("p", "spell-para"), block.parts);
}

export function spellTag(spell){
  const source = SPELL_SOURCES[spell.source];
  const tag = el("span", "spell-tag", source.tag);
  tag.dataset.official = source.isOfficial ? "on" : "off";
  return tag;
}

export const spellSummary = spell => [levelLabel(spell.level), spell.school,
  spell.isConcentration && "concentration", spell.isRitual && "ritual"].filter(Boolean).join(" · ");

export function renderSpellDetail(spell){
  const detail = el("article", "spell-detail");
  const title = el("div", "spell-title");
  title.append(el("b", "spell-title-name", spell.name), spellTag(spell));
  const meta = el("dl", "spell-meta");
  [["Casting time", spell.castingTime], ["Range", spell.range],
    ["Components", spell.components + (spell.material ? ` (${spell.material})` : "")],
    ["Duration", (spell.isConcentration ? "Concentration, " : "") + spell.duration]]
    .forEach(([label, value]) => meta.append(el("dt", "spell-meta-label", label), el("dd", "spell-meta-value", value)));
  detail.append(title, el("span", "spell-summary", spellSummary(spell)), meta);
  textBlocks(spell.text).forEach(block => detail.appendChild(renderBlock(block)));
  if(!spell.text) detail.appendChild(el("p", "search-note", "The source has no text for this spell. Try another version above."));
  if(spell.higherLevel){
    detail.appendChild(el("h4", "spell-heading", "At higher levels"));
    textBlocks(spell.higherLevel).forEach(block => detail.appendChild(renderBlock(block)));
  }
  if(spell.classes.length) detail.appendChild(el("p", "spell-foot", "Classes: " + spell.classes.join(", ")));
  const source = SPELL_SOURCES[spell.source];
  detail.appendChild(el("p", "spell-foot", `${source.name} · ${source.publisher}`));
  return detail;
}
