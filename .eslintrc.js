module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier", "license-header"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module"
  },
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/interface-name-prefix": ["error", "always"],
    "import/no-unresolved": 0,
    // TODO: FIXME: This rule is causing 'Invalid license header' errors on all
    //  the (valid!) source - so will have to look into this later!
    "license-header/header": ["error", "../../resources/license-header.js"],
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}
