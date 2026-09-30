import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["**/*.{js,jsx}"],
    ...js.configs.recommended,
    ...react.configs.flat.recommended,
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: globals.browser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module", ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "unused-imports": unusedImports,
    },
    settings: { react: { version: "detect" } },
    rules: {
      "no-unused-vars": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-vars": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": ["warn", { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
