import { evaluateUpToStep } from './pushStep';

export function evaluateBooleanSteps(ast, env, customRules = []) {
  const steps = [];

  // true / false
  if (ast.type === 'BooleanLiteral') {
    const result = ast.value ? 'tt' : 'ff';

    return [{
      raw: `\\mathbb{B}\\llbracket ${ast.value} \\rrbracket s = ${result}`,
      colored: `\\mathbb{B}\\llbracket ${ast.value} \\rrbracket s = \\textcolor{${result === 'tt' ? 'green' : 'red'}}{${result}}`,
      opRule: ast.value ? 'true' : 'false'
    }];
  }

  // negácia: ¬b alebo používateľské NOT
  if (
    ast.type === 'UnaryExpression' &&
    (
      ast.operator === '¬' ||
      ast.operator === '!' ||
      hasCustomRule(customRules, ast.operator, 'not')
    )
  ) {
    const innerSteps = evaluateBooleanSteps(ast.argument, env, customRules);
    steps.push(...innerSteps);

    const innerResult = lastBoolResult(innerSteps);
    const result = innerResult === 'tt' ? 'ff' : 'tt';

    steps.push({
      raw: `\\mathbb{B}\\llbracket ${ast.operator}${toExpr(ast.argument)} \\rrbracket s = ${result}`,
      colored: colorBoolResult(
        `\\mathbb{B}\\llbracket ${ast.operator}${toExpr(ast.argument)} \\rrbracket s = ${result}`,
        result
      ),
      opRule: ast.operator
    });

    return steps;
  }

  // relačné operátory: =, !=, <, >, <=, >=
  if (ast.type === 'BinaryExpression' && isComparisonOperator(ast.operator, customRules)) {
    steps.push(...evaluateUpToStep(ast.left, env, customRules));
    steps.push(...evaluateUpToStep(ast.right, env, customRules));

    const leftValue = evalArithmetic(ast.left, env, customRules);
    const rightValue = evalArithmetic(ast.right, env, customRules);

    const behavior = getBehavior(ast.operator, customRules);
    const result = evaluateComparison(leftValue, rightValue, ast.operator, behavior);

    steps.push({
      raw: `\\mathbb{B}\\llbracket ${toExpr(ast.left)} ${ast.operator} ${toExpr(ast.right)} \\rrbracket s = ${result}`,
      colored: colorBoolResult(
        `\\mathbb{B}\\llbracket ${toExpr(ast.left)} ${ast.operator} ${toExpr(ast.right)} \\rrbracket s = ${result}`,
        result
      ),
      opRule: ast.operator
    });

    return steps;
  }

  // logické spojky: ∧, ∨ + používateľské AND/OR
  if (ast.type === 'LogicalExpression' && isLogicalOperator(ast.operator, customRules)) {
    const leftSteps = evaluateBooleanSteps(ast.left, env, customRules);
    const rightSteps = evaluateBooleanSteps(ast.right, env, customRules);

    steps.push(...leftSteps);
    steps.push(...rightSteps);

    const leftResult = lastBoolResult(leftSteps);
    const rightResult = lastBoolResult(rightSteps);

    const behavior = getBehavior(ast.operator, customRules);
    const result = evaluateLogical(leftResult, rightResult, ast.operator, behavior);

    steps.push({
      raw: `\\mathbb{B}\\llbracket ${toExpr(ast.left)} ${ast.operator} ${toExpr(ast.right)} \\rrbracket s = ${result}`,
      colored: colorBoolResult(
        `\\mathbb{B}\\llbracket ${toExpr(ast.left)} ${ast.operator} ${toExpr(ast.right)} \\rrbracket s = ${result}`,
        result
      ),
      opRule: ast.operator
    });

    return steps;
  }

  throw new Error("Zadaný výraz nie je podporovaný. Skontrolujte syntax alebo použité operátory.");
}

function isComparisonOperator(operator, customRules = []) {
  return (
    ['=', '==', '<=', '≤'].includes(operator) ||
    customRules.some(rule =>
      rule.scope === 'bool' &&
      rule.op === operator &&
      ['lessThan', 'greaterThan', 'greaterEqual'].includes(rule.behavior)
    )
  );
}

function isLogicalOperator(operator, customRules = []) {
  return (
    ['∧', '&'].includes(operator) ||
    customRules.some(rule =>
      rule.scope === 'bool' &&
      rule.op === operator &&
      rule.behavior === 'or'
    )
  );
}

function hasCustomRule(customRules, operator, behavior) {
  return customRules.some(rule =>
    rule.scope === 'bool' &&
    rule.op === operator &&
    rule.behavior === behavior
  );
}

function getBehavior(operator, customRules = []) {
  const rule = customRules.find(rule =>
    rule.scope === 'bool' &&
    rule.op === operator
  );

  return rule?.behavior;
}

function evaluateComparison(left, right, operator, behavior) {
  if (operator === '=' || operator === '==' || behavior === 'equal') {
    return left === right ? 'tt' : 'ff';
  }

  if (operator === '<=' || operator === '≤' || behavior === 'lessEqual') {
    return left <= right ? 'tt' : 'ff';
  }

  if (operator === '<' || behavior === 'lessThan') {
    return left < right ? 'tt' : 'ff';
  }

  if (operator === '>' || behavior === 'greaterThan') {
    return left > right ? 'tt' : 'ff';
  }

  if (operator === '>=' || operator === '≥' || behavior === 'greaterEqual') {
    return left >= right ? 'tt' : 'ff';
  }

  throw new Error(`Najskôr pridajte používateľské pravidlo pre operátor: ${operator}`);
}

function evaluateLogical(leftResult, rightResult, operator, behavior) {
  if (operator === '∧' || operator === '&' || behavior === 'and') {
    return leftResult === 'tt' && rightResult === 'tt' ? 'tt' : 'ff';
  }

  if (operator === '∨' || operator === '|' || operator === 'v' || behavior === 'or') {
    return leftResult === 'tt' || rightResult === 'tt' ? 'tt' : 'ff';
  }

  throw new Error(`Najskôr pridajte používateľské pravidlo pre operátor: ${operator}`);
}

function evalArithmetic(ast, env, customRules = []) {
  if (ast.type === 'Literal') {
    return ast.value;
  }

  if (ast.type === 'Identifier') {
    if (!(ast.name in env)) {
      throw new Error(`Chýba hodnota pre premennú: ${ast.name}`);
    }

    return env[ast.name];
  }

  if (ast.type === 'BinaryExpression') {
    const left = evalArithmetic(ast.left, env, customRules);
    const right = evalArithmetic(ast.right, env, customRules);

    return evalArithmeticOperator(ast.operator, left, right, customRules);
  }

  throw new Error("Neznámy aritmetický uzol.");
}

function evalArithmeticOperator(operator, left, right, customRules = []) {
  switch (operator) {
    case '+':
      return left + right;

    case '-':
      return left - right;

    case '*':
      return left * right;

    case '/':
      return left / right;

    case '%':
      return left % right;

    case '^':
      return Math.pow(left, right);

    default: {
      const rule = customRules.find(rule =>
        rule.scope === 'arith' &&
        rule.op === operator
      );

      if (!rule) {
        throw new Error(`Nepodporovaný aritmetický operátor: ${operator}`);
      }

      switch (rule.behavior) {
        case 'add':
          return left + right;

        case 'subtract':
          return left - right;

        case 'multiply':
          return left * right;

        case 'divide':
          return left / right;

        case 'modulo':
          return left % right;

        default:
          throw new Error(`Nepodporované aritmetické pravidlo: ${rule.behavior}`);
      }
    }
  }
}

function toExpr(ast) {
  if (ast.type === 'Identifier') {
    return ast.name;
  }

  if (ast.type === 'Literal') {
    return ast.value;
  }

  if (ast.type === 'BooleanLiteral') {
    return ast.value ? 'true' : 'false';
  }

  if (ast.type === 'BinaryExpression') {
    return `(${toExpr(ast.left)} ${ast.operator} ${toExpr(ast.right)})`;
  }

  if (ast.type === 'LogicalExpression') {
    return `(${toExpr(ast.left)} ${ast.operator} ${toExpr(ast.right)})`;
  }

  if (ast.type === 'UnaryExpression') {
    return `${ast.operator}(${toExpr(ast.argument)})`;
  }

  return '?';
}

function lastBoolResult(stepArray) {
  for (let i = stepArray.length - 1; i >= 0; i--) {
    const step = stepArray[i];

    const raw =
      typeof step === 'string'
        ? step
        : step.raw || '';

    if (raw.includes('tt')) {
      return 'tt';
    }

    if (raw.includes('ff')) {
      return 'ff';
    }
  }

  return '?';
}

export let lastHighlightedBoolOperator = null;

function colorBoolResult(rawText, result) {
  const color = result === 'tt' ? 'green' : 'red';

  return rawText.replace(
    `= ${result}`,
    `= \\textcolor{${color}}{${result}}`
  );
}