export function makeField(input){
  const host = document.createElement("span");
  host.className = "field";
  input.classList.add("field-input");
  host.appendChild(input);
  return host;
}
