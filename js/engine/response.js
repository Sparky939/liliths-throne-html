"use strict";
// The `as unknown as ...` here is the one deliberate escape hatch: TS has no way to see
// a plain ES5 constructor function as satisfying a `new (...) => LTResponse` signature,
// even with an explicit `this` parameter — routed through `unknown` rather than `any`
// so the cast's target type (LTNamespace["Response"]) is still checked, just not the
// source. Everything downstream — every `new LT.Response(...)` call site and the
// prototype methods below — is fully typed as a result.
LT.Response = function (title, tooltipText, nextDialogue, effects) {
    this.title = title;
    this.tooltipText = tooltipText || "";
    this.nextDialogue = nextDialogue || null;
    this.effects = effects || null;
    this.disabled = false;
    this.colour = null;
    this.secondsPassed = null;
    this.sexStub = false;
};
LT.Response.prototype.disable = function (reason) {
    this.disabled = true;
    if (reason)
        this.tooltipText = reason;
    return this;
};
LT.Response.prototype.withColour = function (hex) {
    this.colour = hex;
    return this;
};
LT.Response.prototype.withTime = function (seconds) {
    this.secondsPassed = seconds;
    return this;
};
LT.effectsOnly = function (title, tooltipText, effects) {
    return new LT.Response(title, tooltipText, null, effects);
};
//# sourceMappingURL=response.js.map