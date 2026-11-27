import {CHAPTER_GAP_PX} from "../data/constants.js";
import {byId, el} from "./dom.js";

let tabs = [];
let current = null;

const anchors = () => Array.from(byId("main").children).filter(child => child.dataset.chapter);

function mark(chapter){
  current = chapter;
  tabs.forEach(tab => { tab.dataset.on = tab.textContent === chapter ? "on" : "off"; });
}

function jump(anchor){
  const top = anchor.getBoundingClientRect().top + window.scrollY - byId("hud").offsetHeight - CHAPTER_GAP_PX;
  window.scrollTo({top, behavior: "smooth"});
  mark(anchor.dataset.chapter);
}

export function makeChapterTabs(){
  const strip = el("nav", "chapter-tabs");
  tabs = anchors().map(anchor => {
    const tab = el("button", "chapter-tab", anchor.dataset.chapter);
    tab.type = "button";
    tab.addEventListener("click", () => jump(anchor));
    strip.appendChild(tab);
    return tab;
  });
  mark(current || (tabs[0] ? tabs[0].textContent : null));
  return strip;
}

export function followChapters(){
  window.addEventListener("scroll", () => {
    const list = anchors();
    if(!list.length) return;
    const line = byId("hud").getBoundingClientRect().bottom + CHAPTER_GAP_PX * 2;
    const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - CHAPTER_GAP_PX;
    const passed = list.filter(anchor => anchor.getBoundingClientRect().top <= line);
    const reached = isAtBottom ? list[list.length - 1] : passed[passed.length - 1] || list[0];
    if(reached.dataset.chapter !== current) mark(reached.dataset.chapter);
  }, {passive: true});
}
