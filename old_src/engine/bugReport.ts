(function () {
  var MAX_ENTRIES = 20;

  LT.bugReportErrors = [];
  LT.bugReportHistory = [];

  function pushBounded<T>(list: T[], entry: T): void {
    list.push(entry);
    if (list.length > MAX_ENTRIES) list.shift();
  }

  function nowIso(): string {
    return new Date().toISOString();
  }

  // Installed as early as possible in boot.ts's load order so this captures
  // errors thrown by later scripts too, not just ones after this file loads.
  window.addEventListener("error", function (e: ErrorEvent) {
    pushBounded<BugReportErrorEntry>(LT.bugReportErrors, {
      time: nowIso(),
      message: e.message,
      source: e.filename,
      line: e.lineno,
      column: e.colno,
      stack: e.error && e.error.stack,
    });
  });

  window.addEventListener("unhandledrejection", function (e: PromiseRejectionEvent) {
    var reason: any = e.reason;
    pushBounded<BugReportErrorEntry>(LT.bugReportErrors, {
      time: nowIso(),
      message: "Unhandled promise rejection: " + (reason && reason.message ? reason.message : String(reason)),
      stack: reason && reason.stack,
    });
  });

  // engine/game.ts's setContent/choose dispatch these on every node
  // transition / response chosen — listening here instead of hard-coding
  // history tracking into game.ts itself keeps this module a pure add-on.
  document.addEventListener("lt-content", function (e: Event) {
    var detail = (e as CustomEvent).detail;
    var node = detail && detail.node;
    if (!node) return;
    pushBounded<BugReportHistoryEntry>(LT.bugReportHistory, {
      time: nowIso(),
      type: "node",
      label: String(node.id || "?"),
    });
  });

  document.addEventListener("lt-choice", function (e: Event) {
    var detail = (e as CustomEvent).detail;
    var response = detail && detail.response;
    if (!response) return;
    pushBounded<BugReportHistoryEntry>(LT.bugReportHistory, {
      time: nowIso(),
      type: "choice",
      label: String(response.title || "?"),
    });
  });

  LT.buildBugReport = function (): string {
    var lines: string[] = [];
    lines.push("=== Lilith's Throne (HTML/TS fork) Bug Report ===");
    lines.push("Version: " + (LT.VERSION || "?") + " (source " + (LT.SOURCE_VERSION || "?") + ")");
    lines.push("Generated: " + nowIso());
    if (typeof location !== "undefined") lines.push("URL: " + location.href);
    if (typeof navigator !== "undefined") lines.push("User agent: " + navigator.userAgent);
    if (typeof window !== "undefined") lines.push("Viewport: " + window.innerWidth + "x" + window.innerHeight);
    lines.push("");

    var snap: any = null;
    try {
      if (typeof LT.snapshotGame === "function") snap = LT.snapshotGame();
    } catch (err) {
      lines.push("(failed to capture game snapshot: " + err + ")");
      lines.push("");
    }

    lines.push("--- Current State ---");
    if (snap) {
      lines.push("Node: " + (snap.node || "?"));
      lines.push("Location: " + (snap.world || "?") + " / " + (snap.place || "?") + " (" + snap.x + ", " + snap.y + ")");
      lines.push("Game seconds passed: " + snap.secondsPassed);
      lines.push("Started: " + snap.started);
    } else {
      lines.push("(no active game / snapshot unavailable)");
    }
    lines.push("");

    lines.push("--- Full State Snapshot ---");
    lines.push(snap ? JSON.stringify(snap, null, 2) : "(unavailable)");
    lines.push("");

    lines.push("--- Recent History (oldest first, up to " + MAX_ENTRIES + ") ---");
    if (LT.bugReportHistory.length) {
      for (var i = 0; i < LT.bugReportHistory.length; i++) {
        var h = LT.bugReportHistory[i];
        lines.push("[" + h.time + "] " + (h.type === "choice" ? "Chose: " : "Visited node: ") + h.label);
      }
    } else {
      lines.push("(none recorded)");
    }
    lines.push("");

    lines.push("--- Recent Errors (oldest first, up to " + MAX_ENTRIES + ") ---");
    if (LT.bugReportErrors.length) {
      for (var j = 0; j < LT.bugReportErrors.length; j++) {
        var er = LT.bugReportErrors[j];
        lines.push("[" + er.time + "] " + er.message + (er.source ? " (" + er.source + ":" + er.line + ":" + er.column + ")" : ""));
        if (er.stack) lines.push(er.stack);
      }
    } else {
      lines.push("(none recorded)");
    }

    return lines.join("\n");
  };
})();
