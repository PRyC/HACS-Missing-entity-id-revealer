(function () {
  if (window.__entityIdRevealerActive) return;

  function isNotFoundMessage(text) {
    if (!text) return false;
    var t = text.trim().toLowerCase();
    return (
      t.indexOf("not found") !== -1 ||
      t.indexOf("nie znaleziono") !== -1 ||
      t.indexOf("nicht gefunden") !== -1 ||
      t.indexOf("non trouv") !== -1 ||
      t.indexOf("no encontrado") !== -1 ||
      t.indexOf("non trovato") !== -1 ||
      t.indexOf("não encontrado") !== -1 ||
      t.indexOf("не найден") !== -1 ||
      t.indexOf("找不到") !== -1
    );
  }

  function fixErrorCard(card) {
    if (card._erFixed) return;
    card._erFixed = true;
    var root = card.shadowRoot;
    if (!root) return;
    var s = document.createElement("style");
    s.textContent =
      ".title { white-space: normal !important; overflow: visible !important; text-overflow: clip !important; word-break: break-all !important; }";
    root.appendChild(s);
  }

  function patchWarning(el) {
    var host = el.getRootNode().host;
    if (!host) return;
    var config = host._config || host.config;
    if (!config || !config.entity) return;
    var entityId = config.entity;

    if (el.tagName === "HUI-WARNING") {
      var text = el.textContent || "";
      if (isNotFoundMessage(text) && text.indexOf(entityId) === -1) {
        el.innerHTML = text.replace(/:*\s*$/, "") + ":<br>" + entityId;
      }
      var errorCard =
        el.shadowRoot && el.shadowRoot.querySelector("hui-error-card");
      if (errorCard) fixErrorCard(errorCard);
    } else if (el.tagName === "HUI-WARNING-ELEMENT") {
      var label = el.label || "";
      if (isNotFoundMessage(label) && label.indexOf(entityId) === -1) {
        el.label = label.replace(/:*\s*$/, "") + ": " + entityId;
      }
    }
  }

  function scanNode(node) {
    if (node.nodeType !== 1) return;
    if (node.tagName === "HUI-WARNING" || node.tagName === "HUI-WARNING-ELEMENT") {
      patchWarning(node);
    }
    if (node.shadowRoot) scanForWarnings(node.shadowRoot);
    var warnings = node.querySelectorAll("hui-warning, hui-warning-element");
    for (var i = 0; i < warnings.length; i++) patchWarning(warnings[i]);
    var all = node.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      if (all[i].shadowRoot) scanForWarnings(all[i].shadowRoot);
    }
  }

  function scanForWarnings(root) {
    var warnings = root.querySelectorAll("hui-warning, hui-warning-element");
    for (var i = 0; i < warnings.length; i++) patchWarning(warnings[i]);
    var children = root.querySelectorAll("*");
    for (var i = 0; i < children.length; i++) {
      if (children[i].shadowRoot) scanForWarnings(children[i].shadowRoot);
    }
  }

  var lightObserver = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.type !== "childList") continue;
      for (var j = 0; j < m.addedNodes.length; j++) {
        scanNode(m.addedNodes[j]);
      }
    }
  });
  lightObserver.observe(document.body, { childList: true, subtree: true });

  function patchElement(name) {
    var cls = customElements.get(name);
    var patch = function () {
      var Cls = customElements.get(name);
      if (!Cls) return;
      var orig = Cls.prototype.connectedCallback;
      if (orig._erPatched) return;
      Cls.prototype.connectedCallback = function () {
        orig.apply(this, arguments);
        var self = this;
        setTimeout(function () { patchWarning(self); }, 0);
      };
      Cls.prototype.connectedCallback._erPatched = true;
    };
    if (cls) {
      patch();
    } else {
      customElements.whenDefined(name).then(patch);
    }
  }

  patchElement("hui-warning");
  patchElement("hui-warning-element");

  scanForWarnings(document.body);
  setTimeout(function () { scanForWarnings(document.body); }, 500);
  setTimeout(function () { scanForWarnings(document.body); }, 1500);
  setTimeout(function () { scanForWarnings(document.body); }, 3000);

  window.__entityIdRevealerActive = true;
})();
