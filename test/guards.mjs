import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {installDom, installStorage} from "./dom.mjs";
import {section, check, equal, report} from "./checks.mjs";

installDom();
installStorage();

const root = fileURLToPath(new URL("../", import.meta.url));
const at = (...parts) => path.join(root, ...parts);
const read = file => fs.readFileSync(file, "utf8");
const relative = file => path.relative(root, file).split(path.sep).join("/");

function filesUnder(dir, extension){
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if(entry.isDirectory()) return filesUnder(full, extension);
    return entry.name.endsWith(extension) ? [full] : [];
  });
}

const modules = filesUnder(at("src"), ".js").map(relative);
const sourceOf = file => read(at(file));

section("Every module loads");
const exportsByFile = {};
for(const file of modules){
  if(file === "src/main.js") continue;
  try{
    exportsByFile[file] = Object.keys(await import(new URL("../" + file, import.meta.url)));
    check(file.padEnd(38) + exportsByFile[file].length + " exports", true);
  }catch(err){
    check(file, false, err.message);
  }
}

section("Dead exports");
const dead = [];
for(const file in exportsByFile){
  const elsewhere = modules.filter(other => other !== file).map(sourceOf).join("\n");
  exportsByFile[file].filter(name => !new RegExp(`\\b${name}\\b`).test(elsewhere))
    .forEach(name => dead.push(file + " → " + name));
}
equal("every export is imported somewhere", dead, []);

section("Layers");
const MAY_IMPORT = {
  data: ["data"],
  rules: ["data", "rules"],
  store: ["data", "rules", "store"],
  ui: ["ui"],
  views: ["data", "rules", "store", "ui", "views"],
  main: ["data", "rules", "store", "ui", "views"]
};
const layerOf = file => {
  const parts = file.split("/");
  return parts.length > 2 ? parts[1] : "main";
};
equal("every file sits in a known layer", modules.filter(file => !MAY_IMPORT[layerOf(file)]), []);
const upward = [];
for(const file of modules){
  const allowed = MAY_IMPORT[layerOf(file)] || [];
  for(const match of sourceOf(file).matchAll(/from\s+"(\.[^"]+)"/g)){
    const target = relative(path.resolve(path.dirname(at(file)), match[1]));
    if(!allowed.includes(layerOf(target))) upward.push(file + " → " + target);
  }
}
equal("no file imports from a layer above it", upward, []);
equal("only storage.js touches localStorage",
  modules.filter(file => file !== "src/store/storage.js" && /localStorage/.test(sourceOf(file))), []);

section("Rendered classes");
const css = filesUnder(at("src"), ".css").map(read).join("\n");
const rendered = new Set();
const collect = (text, pattern) => {
  for(const match of text.matchAll(pattern))
    match.slice(1).filter(Boolean).join(" ").split(/\s+/).forEach(name => name && rendered.add(name));
};
for(const text of modules.map(sourceOf).concat(read(at("index.html")))){
  collect(text, /className\s*=\s*"([^"]+)"/g);
  collect(text, /class="([^"$]+)"/g);
  collect(text, /classList\.(?:add|toggle)\("([^"]+)"/g);
  collect(text, /\bel\(\s*"[^"]*"\s*,\s*(?:"([^"]+)"|[^,"()]*\?\s*"([^"]+)"\s*:\s*"([^"]+)")/g);
  collect(text, /\bstatBox\(\s*"([^"]+)"/g);
}
const unstyled = [...rendered].sort().filter(name => !new RegExp("\\." + name + "[^a-zA-Z0-9_-]").test(css));
equal("every rendered class has a CSS rule", unstyled, []);

section("Service worker precache");
const assets = read(at("sw.js")).match(/const ASSETS = \[([\s\S]*?)\];/)[1];
const precached = [...assets.matchAll(/"\.\/([^"]*)"/g)].map(match => match[1]);
const shipped = ["", "index.html", "manifest.json"].concat([
  ...filesUnder(at("src"), ".js"), ...filesUnder(at("src"), ".css"),
  ...filesUnder(at("fonts"), ".otf"), ...filesUnder(at("icons"), ".png"), ...filesUnder(at("art"), ".webp")
].map(relative));
equal("every shipped file is precached", shipped.filter(file => !precached.includes(file)), []);
equal("every precached file exists", precached.filter(file => !shipped.includes(file)), []);

process.exit(report() ? 0 : 1);
