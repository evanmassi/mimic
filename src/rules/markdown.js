const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/;
const SEPARATOR = /^\|[\s:|-]+\|?$/;

function inlineParts(text){
  return text.split(INLINE).map((piece, index) => {
    const isMatch = index % 2 === 1;
    if(isMatch && piece.startsWith("**")) return {style: "strong", text: piece.slice(2, -2)};
    if(isMatch) return {style: "emphasis", text: piece.slice(1, -1)};
    return {style: "plain", text: piece};
  }).filter(part => part.text);
}

const kindOf = line => /^#+\s/.test(line) ? "heading" : /^[*-] /.test(line) ? "list" : line.startsWith("|") ? "table" : "paragraph";
const cells = line => line.replace(/^\||\|$/g, "").split("|").map(cell => inlineParts(cell.trim()));

function block({kind, lines}){
  if(kind === "heading") return {kind, parts: inlineParts(lines.map(line => line.replace(/^#+\s*/, "")).join(" "))};
  if(kind === "list") return {kind, items: lines.map(line => inlineParts(line.slice(2)))};
  if(kind === "table") return {kind, rows: lines.filter(line => !SEPARATOR.test(line)).map(cells)};
  return {kind, parts: inlineParts(lines.join(" "))};
}

export function textBlocks(text){
  const runs = [];
  text.split(/\n\s*\n/).forEach(chunk => {
    let run = null;
    chunk.split("\n").map(line => line.trim()).filter(Boolean).forEach(line => {
      const kind = kindOf(line);
      if(!run || run.kind !== kind || kind === "heading"){
        run = {kind, lines: []};
        runs.push(run);
      }
      run.lines.push(line);
    });
  });
  return runs.map(block);
}
