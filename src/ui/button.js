export function makeButton(el, options = {}){
  const {label, tone = "ink", chosen, icon} = options;
  el.type = "button";
  el.classList.add("btn");
  el.dataset.tone = tone;
  if(icon){
    el.dataset.icon = icon;
    el.setAttribute("aria-label", label);
  }else if(label !== undefined) el.textContent = label;
  el.setChosen = on => {
    el.dataset.chosen = on ? "on" : "off";
    el.setAttribute("aria-pressed", String(on));
  };
  if(chosen !== undefined) el.setChosen(chosen);
  return el;
}
