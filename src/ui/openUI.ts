(function () {
  var registry: Record<string, UISectionEntry> = {};
  var activeByTarget: Record<string, string | null> = {
    stage: null,
    left: null,
    right: null,
    overlay: null,
  };

  function inferTarget(id: string): string {
    var el = document.querySelector<HTMLElement>('[data-ui="' + id + '"]');
    return (el && el.getAttribute("data-ui-target")) || "stage";
  }

  function hideSection(id: string) {
    var el = document.querySelector<HTMLElement>('[data-ui="' + id + '"]');
    if (el) el.hidden = true;
  }

  function showSection(id: string) {
    var el = document.querySelector<HTMLElement>('[data-ui="' + id + '"]');
    if (el) el.hidden = false;
  }

  LT.registerUI = function (id: string, hooks?: UISectionHooks | null) {
    hooks = hooks || {};
    registry[id] = {
      id: id,
      target: hooks.target || inferTarget(id),
      onOpen: hooks.onOpen || null,
      onClose: hooks.onClose || null,
      render: hooks.render || null,
    };
  };

  LT.getActive = function (target?: string | null) {
    return activeByTarget[target || "stage"];
  };

  LT.openUI = function (id: string, opts?: UIOpenOpts | null) {
    opts = opts || {};
    var entry: UISectionEntry = registry[id] || { id: id, target: opts.target || inferTarget(id), onOpen: null, onClose: null, render: null };
    var target = opts.target || entry.target || "stage";
    var prevId = activeByTarget[target];

    if (prevId && prevId !== id) {
      var prev = registry[prevId];
      if (prev && prev.onClose) prev.onClose(opts);
      hideSection(prevId);
    }

    activeByTarget[target] = id;
    showSection(id);
    if (entry.onOpen) entry.onOpen(opts);
    if (entry.render) entry.render(opts);

    document.dispatchEvent(
      new CustomEvent("lt-ui-opened", { detail: { id: id, target: target, opts: opts, prevId: prevId } }),
    );
    return id;
  };

  LT.closeUI = function (id: string) {
    var entry = registry[id];
    var target = (entry && entry.target) || inferTarget(id);
    if (activeByTarget[target] !== id) return;
    if (entry && entry.onClose) entry.onClose({});
    hideSection(id);
    activeByTarget[target] = null;
  };

  LT.setTitle = function (text?: string | null) {
    var el = document.getElementById("content-title");
    if (!el) return;
    el.innerHTML = text || "";
    el.hidden = !text;
  };

  LT.setChrome = function (opts?: ChromeOpts | null) {
    opts = opts || {};
    var app = document.getElementById("app");
    if (app) {
      if (opts.left === false) app.classList.add("chrome-left-hidden");
      if (opts.left === true) app.classList.remove("chrome-left-hidden");
      if (opts.right === false) app.classList.add("chrome-right-hidden");
      if (opts.right === true) app.classList.remove("chrome-right-hidden");
    }
    if (opts.title !== undefined) LT.setTitle(opts.title);
  };

  LT.initOpenUI = function () {
    var els = document.querySelectorAll<HTMLElement>("[data-ui]");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var id = el.getAttribute("data-ui")!;
      if (!registry[id]) {
        LT.registerUI(id, { target: el.getAttribute("data-ui-target") || "stage" });
      }
      el.hidden = true;
    }
  };
})();
