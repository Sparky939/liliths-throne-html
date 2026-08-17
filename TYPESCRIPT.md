# TypeScript migration

The site still boots the same way it always did: `index.html` loads a single
`js/boot.js`, which injects the rest of `js/**/*.js` as plain `<script>` tags
in a fixed order, all writing onto the shared global `LT` object. There is no
bundler and no module system — that hasn't changed.

What's new is a TypeScript layer:

- Source of truth lives under `src/`, mirroring the layout of `js/`.
- `npm run build` compiles `src/**/*.ts` and writes the output back into the
  matching path under `js/` (e.g. `src/lt.ts` → `js/lt.js`). The compiled
  `.js` is what `boot.js` actually loads, and it's committed to the repo
  since the site has no build step in production.
- `npm run typecheck` runs `tsc --noEmit` for a fast check without touching
  `js/`.
- `npm run lint` runs ESLint (typescript-eslint) over `src/`.
- `npm run test` runs vitest.
- `npm run watch` recompiles on save during local development.
- Node 22 is pinned via `mise.toml` (`mise install` picks it up automatically).

**Status: fully converted.** All 104 original `.js` files under `js/` now
have a `src/**/*.ts` counterpart, including the boot loader itself
(`src/boot.ts`). `js/text/kaysTextiles.js` was never referenced by
`boot.js`'s load list before the migration either — it's converted
(`src/text/kaysTextiles.ts`) but still orphaned; that's a pre-existing
condition in the original repo, not something this migration changed.

## Typing philosophy: pragmatic, not exhaustive

`tsconfig.json` uses `strict: true` with `noImplicitAny` and `noImplicitThis`
turned back off. This codebase is classic ES5-style prototype/closure code —
`Foo.prototype.method = function () { this.x }` and untyped callback params
are the norm on nearly every file. Requiring an explicit type on every one of
those would turn a mechanical migration into a full typing rewrite. Turning
those two checks off keeps real safety (`strictNullChecks`,
`strictFunctionTypes`, etc.) while letting untyped `this`/params stay
implicitly `any`, same as they always effectively were at runtime.

Beyond that, a handful of literal-inference edge cases show up constantly
enough that they're worth knowing about if you touch more code here:

- `var x = [];` / `var x = {};` / `var x = null;` reassigned across a
  `continue`/early-return sometimes gets inferred as `never[]`/`never`
  instead of `any[]`/`any`. Fix: annotate explicitly, e.g.
  `var x: any[] = [];`.
- `document.getElementById(...)` / `document.querySelector(...)` results are
  `Element | null` in lib.dom, but this code generally uses them without a
  null check and expects wider properties (`.value`, `.hidden`, etc.) than
  base `Element` has. Fix: `var el: any = document.getElementById(...)`.
- Event handler callbacks (`addEventListener("click", function (e) {...})`)
  get contextually typed to a real DOM event, whose `.target` is
  `EventTarget | null` without `.closest`/`.matches`. Fix: annotate the
  param, `function (e: any) {...}`.
- A helper called with fewer arguments than it declares (relying on JS's
  implicit `undefined` for missing params) needs the trailing params marked
  optional: `function foo(a, b, c?: any) {...}`.

None of this changes runtime behavior — every converted file was diffed
(whitespace-insensitive) against its pre-conversion version, and the only
differences are formatting, a `"use strict"` header, and the sourcemap
comment. The one deliberate exception: `src/grid/grid.ts`'s console-logging
shim was rewritten from `fn.apply(console, arguments)` to
`console.warn(...args)` — behaviorally identical, just satisfies
`@typescript-eslint`'s `prefer-rest-params`/`prefer-spread` rules.

A few pre-existing dead-code warnings surface from ESLint
(`no-unused-vars`) on functions/variables that were already unused in the
original JS — left as-is; fixing them would be a logic change, not a typing
one.

Deep typing (real `Character`/`Item`/`CombatState` interfaces instead of
`any`) is deliberately out of scope for this pass — that's follow-up work,
done incrementally per module as needed.

## Rules for converting a file

1. `git mv js/foo/bar.js src/foo/bar.ts` (keep the same relative path so the
   build output lands back where `boot.js` expects it).
2. Add types incrementally — the global `LT` namespace is typed as
   `interface LTNamespace { [key: string]: any }` in
   `src/types/global.d.ts`. A handful of other globals that live outside
   `LT` (mainly grid-related, exposed via `window.X = X` from inside an
   IIFE) are declared the same way in that file. Narrow individual
   properties as you convert the code that defines them, rather than
   leaving everything `any` forever.
3. Run `npm run typecheck`, fix whatever comes up (see the common patterns
   above), then `npm run build` and diff the emitted `js/foo/bar.js`
   against the pre-conversion version — behavior should be identical
   (formatting and a leading `"use strict"` aside).
4. Once a file lives in `src/`, stop hand-editing its `js/` counterpart
   directly — it's now a build artifact.

## Tests

Vitest is set up but only covers genuinely pure, stateless modules so far —
ones that just build a data structure onto `LT` without touching
`window`/`document`/`localStorage` or other game state (e.g.
`src/engine/colours.ts`, `src/paths.ts`, `src/character/bodyEnums.ts`,
`src/character/occupations.ts`, `src/items/enchanting.ts`). Most of this
codebase mutates shared global state (`LT.game`, the player, combat), which
needs a deliberate mocking strategy before it's reasonably testable —
that's follow-up work, not part of this pass.

Convention: co-locate `*.test.ts` next to the module it tests (e.g.
`src/engine/colours.test.ts`). `vitest.config.ts` picks up
`src/**/*.test.ts` and loads `src/test-setup.ts` first, which seeds
`globalThis.LT = {}` before any test module (and the source file it
imports for side effects) runs — these are still non-module global scripts
under the hood, so `LT` has to exist as a real global before they execute.
Compiled `js/**/*.test.js` build artifacts are gitignored; they're never
referenced by `boot.js`.

CI (`.github/workflows/ci.yml`) runs typecheck, lint, build, and test on
every push/PR.
