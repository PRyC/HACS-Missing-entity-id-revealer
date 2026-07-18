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

  var observedRoots = [];

  function scanNode(node) {
    if (node.nodeType !== 1) return;
    var tag = node.tagName;
    if (tag === "HUI-WARNING" || tag === "HUI-WARNING-ELEMENT") {
      patchWarning(node);
    }
    if (node.shadowRoot) {
      observeRoot(node.shadowRoot);
    }
    var warnings = node.querySelectorAll("hui-warning, hui-warning-element");
    for (var i = 0; i < warnings.length; i++) {
      patchWarning(warnings[i]);
    }
    var all = node.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      if (all[i].shadowRoot) {
        observeRoot(all[i].shadowRoot);
      }
    }
  }

  function observeRoot(root) {
    if (root._erObserved) return;
    root._erObserved = true;
    observedRoots.push(root);

    var warnings = root.querySelectorAll("hui-warning, hui-warning-element");
    for (var i = 0; i < warnings.length; i++) {
      patchWarning(warnings[i]);
    }
    var all = root.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      if (all[i].shadowRoot) {
        observeRoot(all[i].shadowRoot);
      }
    }

    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === "childList") {
          for (var j = 0; j < m.addedNodes.length; j++) {
            scanNode(m.addedNodes[j]);
          }
          for (var j = 0; j < m.removedNodes.length; j++) {
            cleanupRemoved(m.removedNodes[j]);
          }
        } else if (m.type === "characterData") {
          var p = m.target.parentElement;
          if (p && (p.tagName === "HUI-WARNING" || p.tagName === "HUI-WARNING-ELEMENT")) {
            patchWarning(p);
          }
        }
      }
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
  }

  function cleanupRemoved(node) {
    if (node.nodeType !== 1) return;
    if (node.shadowRoot && node.shadowRoot._erObserved) {
      observedRoots = observedRoots.filter(function (r) { return r !== node.shadowRoot; });
    }
    var all = node.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      if (all[i].shadowRoot && all[i].shadowRoot._erObserved) {
        observedRoots = observedRoots.filter(function (r) { return r !== all[i].shadowRoot; });
      }
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

  function scanForWarnings(root) {
    var warnings = root.querySelectorAll("hui-warning, hui-warning-element");
    for (var i = 0; i < warnings.length; i++) patchWarning(warnings[i]);
    var children = root.querySelectorAll("*");
    for (var i = 0; i < children.length; i++) {
      if (children[i].shadowRoot) {
        observeRoot(children[i].shadowRoot);
        scanForWarnings(children[i].shadowRoot);
      }
    }
  }

  scanForWarnings(document.body);
  setTimeout(function () { scanForWarnings(document.body); }, 500);
  setTimeout(function () { scanForWarnings(document.body); }, 1500);
  setTimeout(function () { scanForWarnings(document.body); }, 3000);

  window.__entityIdRevealerActive = true;
})();
