// Runs before every test file loads. The converted modules are plain global
// scripts (see TYPESCRIPT.md) that write onto `LT` as a bare identifier, so
// it has to exist on globalThis before any of them are imported.
globalThis.LT = globalThis.LT || ({} as LTNamespace);
