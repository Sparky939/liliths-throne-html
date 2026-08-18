// The `as any` here is the one deliberate escape hatch: TS has no way to see a plain
// ES5 constructor function as satisfying a `new (...) => LTResponse` signature, even
// with an explicit `this` parameter. Everything downstream — every `new LT.Response(...)`
// call site and the prototype methods below — is fully typed as a result.
LT.Response = function (this: LTResponse, title: string, tooltipText?: string | null, nextDialogue?: string | null, effects?: (() => void) | null) {
  this.title = title;
  this.tooltipText = tooltipText || "";
  this.nextDialogue = nextDialogue || null;
  this.effects = effects || null;
  this.disabled = false;
  this.colour = null;
  this.secondsPassed = null;
  this.sexStub = false;
} as any;

LT.Response.prototype.disable = function (this: LTResponse, reason?: string) {
  this.disabled = true;
  if (reason) this.tooltipText = reason;
  return this;
};

LT.Response.prototype.withColour = function (this: LTResponse, hex: string) {
  this.colour = hex;
  return this;
};

LT.Response.prototype.withTime = function (this: LTResponse, seconds: number) {
  this.secondsPassed = seconds;
  return this;
};

LT.effectsOnly = function (title, tooltipText, effects) {
  return new LT.Response(title, tooltipText, null, effects);
};
