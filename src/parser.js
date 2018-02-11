const transformations = require('./constants/transformations.json');
const nodeTypes = require('./constants/types.json');
const b = require('ast-types').builders;
const types = require('ast-types').namedTypes;
const fs = require('fs-extra');

const doFun = (fn, ls) => (fn ? fn(ls) : ls);

const accGetters = (inst, func) => (acc, v) =>
  Object.assign({}, acc, inst[v] && { [v]: func(inst[v]) });

const switchCases = (transformations, fns) => ls => {
  const typeName = ls.type;
  const transformation = transformations[typeName];

  if (typeName && transformation) {
    const values = (transformation.values || []).reduce(
      accGetters(ls, switchCases(transformations, fns)),
      {}
    );
    const lists = (transformation.lists || []).reduce(
      accGetters(ls, mV => mV.map(switchCases(transformations, fns))),
      {}
    );

    return doFun(fns[typeName], {
      ...ls,
      ...values,
      ...lists
    });
  } else {
    return ls;
  }
};

const parseStrictBody = declarations => body => {
  if (body[0] && body[0].directive === 'use strict') {
    return [b.literal('use strict')].concat(declarations).concat(body.slice(1));
  } else {
    return declarations.concat(body);
  }
};

const parseReturn = body => {
  const lastElement = body[body.length - 1];
  if (types.ReturnStatement.check(lastElement)) {
    return body
      .slice(0, -1)
      .concat(
        b.expressionStatement(
          b.assignmentExpression(
            '=',
            b.memberExpression(
              b.identifier('module'),
              b.identifier('exports'),
              false
            ),
            lastElement.argument
          )
        )
      );
  } else {
    return body;
  }
};

module.exports = astTree => {
  if (process.env.DEBUG) {
    fs.writeFileSync('./test-data/ast.json', JSON.stringify(astTree, null, 4));
  }

  return switchCases(transformations, {
    [nodeTypes.PROGRAM]: ast => {
      return {
        ...ast,
        body: ast.body.reduce((acc, expr) => {
          if (types.ExpressionStatement.check(expr)) {
            const callee = expr.expression.callee;

            if (
              types.Identifier.check(callee) &&
              (callee.name === 'requirejs' || callee.name === 'define')
            ) {
              const [props, funcs] = expr.expression.arguments;
              const imports = props.elements.map(v => v.value);
              const definitions = funcs.params.map(v => v.name);
              if (imports.length !== definitions.length)
                throw new Error('Declaration length does not match');

              const declarations = definitions.map((de, idx) =>
                b.variableDeclaration('const', [
                  b.variableDeclarator(
                    b.identifier(de),
                    b.callExpression(b.identifier('require'), [
                      b.literal(imports[idx])
                    ])
                  )
                ])
              );
              return acc.concat(
                parseReturn(parseStrictBody(declarations)(funcs.body.body))
              );
            } else {
              return acc.concat(expr);
            }
          } else {
            return acc.concat(expr);
          }
        }, [])
      };
    },
    [nodeTypes.EXPRESSION_STATEMENT]: ast => {
      const callee = ast.expression.callee;
      const args = ast.expression.arguments;
      if (
        types.Identifier.check(callee) &&
        (callee.name === 'requirejs' || callee.name === 'define')
      ) {
        args.forEach(arg => {
          if (types.ArrayExpression.check(arg)) {
            console.log(arg.elements.map(v => v.value));
          }
        });
      }
      return ast;
    }
  })(astTree);
};
