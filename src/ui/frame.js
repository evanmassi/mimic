export function makeFrame(el, label){
  el.classList.add("frame");
  const caption = document.createElement("span");
  caption.className = "frame-label";
  caption.textContent = label;
  el.appendChild(caption);
  return el;
}
