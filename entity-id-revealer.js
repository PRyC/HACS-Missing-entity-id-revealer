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

  function observeWarning(el) {
    if (el._erWatched) return;
    el._erWatched = true;
    var obs = new MutationObserver(function () {
      patchWarning(el);
    });
    obs.observe(el, { childList: true, characterData: true, subtree: true });
    el._erObserver = obs;
  }

  function patchWarning(el) {
    var host = el.getRootNode().host;
    if (!host) {
      console.log("[er] patchWarning: no host", el);
      return;
    }
    var config = host._config || host.config;
    if (!config || !config.entity) {
      console.log("[er] patchWarning: no config/entity", el, host);
      return;
    }
    var entityId = config.entity;
    console.log("[er] patchWarning: entityId=" + entityId, el);

    if (el.tagName === "HUI-WARNING") {
      observeWarning(el);
      var text = el.textContent || "";
      console.log("[er] HUI-WARNING text=" + text + " isNotFound=" + isNotFoundMessage(text) + " alreadyHasId=" + (text.indexOf(entityId) !== -1));
      if (isNotFoundMessage(text) && text.indexOf(entityId) === -1) {
        el.innerHTML = text.replace(/:*\s*$/, "") + ":<br>" + entityId;
        console.log("[er] patched HUI-WARNING to:", el.innerHTML);
      }
      var errorCard = el.shadowRoot && el.shadowRoot.querySelector("hui-error-card");
      if (errorCard) fixErrorCard(errorCard);
    } else if (el.tagName === "HUI-WARNING-ELEMENT") {
      var label = el.label || "";
      console.log("[er] HUI-WARNING-ELEMENT label=" + label);
      if (isNotFoundMessage(label) && label.indexOf(entityId) === -1) {
        el.label = label.replace(/:*\s*$/, "") + ": " + entityId;
        console.log("[er] patched HUI-WARNING-ELEMENT to:", el.label);
      }
    }
  }

  function scanForWarnings(root, label) {
    var warnings = root.querySelectorAll("hui-warning, hui-warning-element");
    console.log("[er] scanForWarnings(" + label + "): found " + warnings.length + " warnings, root:", root);
    for (var i = 0; i < warnings.length; i++) {
      patchWarning(warnings[i]);
      if (warnings[i].tagName === "HUI-WARNING") observeWarning(warnings[i]);
    }
    var children = root.querySelectorAll("*");
    var shadowCount = 0;
    for (var i = 0; i < children.length; i++) {
      if (children[i].shadowRoot) {
        shadowCount++;
        scanForWarnings(children[i].shadowRoot, label + ">" + (children[i].tagName || children[i].localName));
      }
    }
    console.log("[er] scanForWarnings(" + label + "): recursed into " + shadowCount + " shadow roots");
  }

  function patchElement(name) {
    var patch = function () {
      var Cls = customElements.get(name);
      if (!Cls) {
        console.log("[er] patchElement(" + name + "): not defined yet");
        return false;
      }
      var orig = Cls.prototype.connectedCallback;
      if (orig._erPatched) {
        console.log("[er] patchElement(" + name + "): already patched");
        return true;
      }
      Cls.prototype.connectedCallback = function () {
        orig.apply(this, arguments);
        console.log("[er] connectedCallback(" + name + "): triggered, scheduling patchWarning");
        var self = this;
        var attempts = [0, 50, 200];
        for (var a = 0; a < attempts.length; a++) {
          setTimeout(patchWarning, attempts[a], self);
        }
      };
      Cls.prototype.connectedCallback._erPatched = true;
      console.log("[er] patchElement(" + name + "): patched successfully (sync)");
      return true;
    };
    if (!patch()) {
      customElements.whenDefined(name).then(function () {
        console.log("[er] patchElement(" + name + "): whenDefined resolved, now patching");
        patch();
      });
    }
  }

  console.log("[er] === STARTUP ===");
  patchElement("hui-warning");
  patchElement("hui-warning-element");

  scanForWarnings(document.body, "body");
  setTimeout(function () { scanForWarnings(document.body, "body-500"); }, 500);
  setTimeout(function () { scanForWarnings(document.body, "body-1500"); }, 1500);
  setTimeout(function () { console.log("[er] === FINAL SCAN ==="); scanForWarnings(document.body, "body-3000"); }, 3000);

  window.__entityIdRevealerActive = true;
})();
