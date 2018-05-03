module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true
  },
  "extends": ["eslint-config-airbnb","prettier"],
  "parserOptions": {
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true
    },
    "ecmaVersion": 8,
    "sourceType": "module"
  },
  "plugins": [
    "prettier"
  ],
  "rules": {
    "indent": "off",
    "react/jsx-filename-extension": [1, { "extensions": [".js", ".jsx"] }],
    "comma-dangle": ["error", "never"],
    "arrow-parens": ["error", "as-needed"],
    "no-plusplus": "off",
    "no-underscore-dangle":[0],
    "class-methods-use-this":"off",
    "import/no-extraneous-dependencies":"off",
    "react/forbid-prop-types":"off",
    "global-require":"off",
    "semi": [
      "error",
      "always"
    ],
    "prettier/prettier": "error"
  },
  "root":true
};
