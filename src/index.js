const eslint = require('eslint');
const espree = require('espree');
const escodegen = require('escodegen');
const parser = require('./parser');

const linter = new eslint.CLIEngine({ fix: true });

const config = {
  range: true,
  loc: true,
  comment: true,
  attachComment: true,
  tokens: false,
  ecmaVersion: 6,
  sourceType: 'module',
  ecmaFeatures: {
    impliedStrict: true
  }
};

const parse = code => {
  let comments = [];
  let tokens = [];

  const ast = espree.parse(
    code,
    Object.assign({}, config, { onComment: comments, onToken: tokens })
  );

  const mAst = parser(ast);

  // escodegen.attachComments(mAst, comments, tokens);

  const resultCode = escodegen.generate(mAst);

  return linter.executeOnText(resultCode).results[0].output;
};

module.exports = parse;
