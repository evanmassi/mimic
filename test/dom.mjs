const noop = () => {};

const fakeContext = new Proxy({}, {get: (target, key) => key in target ? target[key] : noop, set: (target, key, value) => { target[key] = value; return true; }});

class FakeNode {
  constructor(tag){
    this.tag = tag;
    this.children = [];
    this.attrs = {};
    this.dataset = {};
    this.style = {
      setProperty(name, value){ this[name] = String(value); },
      removeProperty(name){ delete this[name]; },
      getPropertyValue(name){ return this[name] || ""; }
    };
    this.listeners = {};
    this._class = "";
    this._html = "";
    this._text = "";
    this.value = "";
    this.hidden = false;
    this.disabled = false;
    this.scrollTop = 0;
    this.clientWidth = 0;
  }
  focus(){}
  setPointerCapture(){}
  getBoundingClientRect(){ return {width: 0, height: 0}; }
  getContext(){ return fakeContext; }
  toDataURL(){ return "data:image/png;base64,"; }
  get className(){ return this._class; }
  set className(v){ this._class = String(v); }
  get classList(){
    const node = this;
    return {
      add: (...names) => { node._class = [...new Set(node._class.split(" ").filter(Boolean).concat(names))].join(" "); },
      remove: (...names) => { node._class = node._class.split(" ").filter(c => c && !names.includes(c)).join(" "); },
      toggle: (name, on) => { on ? node.classList.add(name) : node.classList.remove(name); },
      contains: name => node._class.split(" ").includes(name)
    };
  }
  get innerHTML(){ return this._html + this.children.map(c => c.outerHTML).join(""); }
  set innerHTML(v){ this._html = String(v); this._text = ""; this.children = []; }
  get textContent(){ return this._text || this._html.replace(/<[^>]*>/g, "") + this.children.map(c => c.textContent).join(""); }
  set textContent(v){ this._text = String(v); this._html = ""; this.children = []; }
  get outerHTML(){
    return `<${this.tag} class="${this._class}">${this.innerHTML}${this._text}</${this.tag}>`;
  }
  appendChild(child){ child.parentNode = this; this.children.push(child); return child; }
  append(...nodes){ nodes.forEach(n => this.appendChild(n)); }
  setAttribute(name, value){ this.attrs[name] = String(value); }
  getAttribute(name){ return this.attrs[name]; }
  addEventListener(type, fn){ (this.listeners[type] = this.listeners[type] || []).push(fn); }
  fire(type, event){ (this.listeners[type] || []).forEach(fn => fn(Object.assign({stopPropagation: noop, preventDefault: noop}, event))); }
  find(sel){
    const want = sel.replace(/^\./, "");
    const hits = [];
    const walk = node => node.children.forEach(child => {
      if(child._class.split(" ").includes(want)) hits.push(child);
      walk(child);
    });
    walk(this);
    return hits;
  }
}

export function installDom(){
  const byId = {};
  ["hud", "main", "drawer", "drawerback", "drawerclose", "drawertitle", "drawerbody"]
    .forEach(id => { byId[id] = new FakeNode("div"); });

  const doc = {
    getElementById: id => byId[id] || (byId[id] = new FakeNode("div")),
    createElement: tag => new FakeNode(tag),
    listeners: {},
    addEventListener(type, fn){ (doc.listeners[type] = doc.listeners[type] || []).push(fn); },
    body: new FakeNode("body")
  };

  globalThis.document = doc;
  globalThis.window = {addEventListener: noop, devicePixelRatio: 1};
  globalThis.getComputedStyle = () => ({color: "#2b2118"});
  globalThis.Image = class { set src(value){ this.loaded = value; } };

  return byId;
}

export function installStorage(){
  const store = {};
  globalThis.localStorage = {
    getItem: key => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: key => { delete store[key]; },
    clear: () => { for(const key in store) delete store[key]; }
  };
}
