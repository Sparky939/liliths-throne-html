// @ts-check
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["js/**", "mods/**", "tools/**", "node_modules/**"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    rules: {
      eqeqeq: ["error", "smart"],
      // This codebase is classic ES5-style `var`, converted mechanically without
      // rewrites (see TYPESCRIPT.md) — enforcing let/const here would demand a
      // scoping rewrite across every file, which is explicitly out of scope.
      "no-var": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      // The migration deliberately leans on `any` for now (see TYPESCRIPT.md);
      // tightening this is follow-up work, not part of the mechanical pass.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
);
