import {DRAWER_CLOSE_MS} from "../../data/constants.js";
import {makeButton} from "../../ui/button.js";

let drawer, title, body, closing = null;

export function mountDrawer(drawerEl, titleEl, bodyEl, closeEl, backdropEl){
  drawer = drawerEl;
  title = titleEl;
  body = bodyEl;
  drawer.style.setProperty("--drawer-close", DRAWER_CLOSE_MS + "ms");
  makeButton(closeEl, {label: "Close"});
  closeEl.addEventListener("click", closeDrawer);
  backdropEl.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", e => { if(e.key === "Escape" && !drawer.hidden) closeDrawer(); });
}

export function closeDrawer(){
  if(drawer.hidden || closing) return;
  drawer.dataset.closing = "";
  closing = setTimeout(() => {
    drawer.hidden = true;
    delete drawer.dataset.closing;
    closing = null;
  }, DRAWER_CLOSE_MS);
}

export function openDrawer(heading){
  title.textContent = heading;
  body.innerHTML = "";
  clearTimeout(closing);
  closing = null;
  delete drawer.dataset.closing;
  drawer.hidden = false;
  body.scrollTop = 0;
  return body;
}
