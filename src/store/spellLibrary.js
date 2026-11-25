let library = null;

export function loadSpellLibrary(){
  if(!library) library = import("../data/spells.js").then(module => module.SPELLS);
  return library;
}
