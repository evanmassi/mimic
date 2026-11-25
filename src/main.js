import {changes, hydrate} from "./store/state.js";
import {render} from "./views/app.js";
import {mountDrawer} from "./views/drawers/drawer.js";
import {byId} from "./views/dom.js";

mountDrawer(byId("drawer"), byId("drawertitle"), byId("drawerbody"), byId("drawerclose"), byId("drawerback"));

changes.subscribe(render);
hydrate();
render();

const LOCAL_HOST = /^(localhost|127\.|\[?::1\]?$|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/;
const isLocalDev = LOCAL_HOST.test(location.hostname);

if("serviceWorker" in navigator){
  if(isLocalDev){
    navigator.serviceWorker.getRegistrations()
      .then(all => all.forEach(one => one.unregister())).catch(() => {});
    if(window.caches) caches.keys().then(keys => keys.forEach(key => caches.delete(key))).catch(() => {});
  } else {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
}
