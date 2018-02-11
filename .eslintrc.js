module.exports = {
  "extends": [
    "standard",
    "plugin:flowtype/recommended",
    "prettier",
    "prettier/flowtype",
    "prettier/standard"
  ],
  "plugins": [
    "flowtype",
    "prettier",
    "standard"
  ],
  "env": {
    "es6": true,
    "node": true
  },
  "rules": {
    "prettier/prettier": "error",
    "prettier/prettier": ["error", { "singleQuote": true }],
    "quotes": ["error", "single"],
    "indent": ["error", 2]
  }
};