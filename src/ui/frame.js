export function makeFrame(el, label, aside){
  el.classList.add("frame");
  const caption = document.createElement("span");
  caption.className = "frame-label";
  caption.textContent = label;
  if(aside) caption.appendChild(aside);
  el.appendChild(caption);
  return el;
}
