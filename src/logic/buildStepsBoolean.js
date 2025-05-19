import { evaluateUpToStep } from './pushStep';

export function evaluateBooleanSteps(ast, env) {
  const steps = [];

  if (
        ast.type === 'BinaryExpression' &&
        typeof ast.operator === 'string' &&
        (ast.operator === '=' || ast.operator === '<=' || ast.operator === '≤')
    )  {
    const e1 = ast.left;
    const e2 = ast.right;

    steps.push(...evaluateUpToStep(e1, env));
    steps.push(...evaluateUpToStep(e2, env));

    const e1Val = evalArithmetic(ast.left, env);
    const e2Val = evalArithmetic(ast.right, env);

    let result;
    if (ast.operator === '=') {
        result = e1Val === e2Val ? 'tt' : 'ff';
    } else if (ast.operator === '<=' || ast.operator === '≤') {
        result = e1Val <= e2Val ? 'tt' : 'ff';
    }

    // =
    steps.push({
      raw: `\\mathbb{B}\\llbracket ${(toExpr(ast.left))} ${(ast.operator)} ${(toExpr(ast.right))}\\rrbracket s = ${(result)}`,
      colored: highlightBoolOpInStep(`\\mathbb{B}\\llbracket ${(toExpr(ast.left))} ${(ast.operator)} ${(toExpr(ast.right))} \\rrbracket s = \\textcolor{${result === 'tt' ? 'green' : 'red'}}{${result}}`, ast.operator),
      opRule: ast.operator
    });

    return steps;
  }

  if (ast.type === 'UnaryExpression' && ast.operator === '¬') {
  const inner = ast.argument;
  const innerSteps = evaluateBooleanSteps(inner, env);
  steps.push(...innerSteps);

  const lastStep = innerSteps[innerSteps.length - 1];
  const result = lastStep.raw.includes('tt') ? 'ff' : 'tt';

  steps.push({
    raw: `\\mathbb{B}\\llbracket ¬${toExpr(inner)}\\rrbracket s = ${result}`,
    colored: highlightBoolOpInStep(`\\mathbb{B}\\llbracket ¬${toExpr(inner)}\\rrbracket s = ${result}`, ast.operator),
    opRule: ast.operator
  });

  return steps;
  }

  if (ast.type === 'LogicalExpression' && ast.operator === '∧') {
  const left = ast.left;
  const right = ast.right;

  const leftSteps = evaluateBooleanSteps(left, env);
  const rightSteps = evaluateBooleanSteps(right, env);

  steps.push(...leftSteps);
  steps.push(...rightSteps);

  const leftResult = lastBoolResult(leftSteps);
  const rightResult = lastBoolResult(rightSteps);

  const result = (leftResult === 'tt' && rightResult === 'tt') ? 'tt' : 'ff';
  
  // ∧
  steps.push({
    raw: `\\mathbb{B}\\llbracket ${(toExpr(ast.left))} ${(ast.operator)} ${(toExpr(ast.right))} \\rrbracket s = ${result}`,
    colored: highlightBoolOpInStep(`\\mathbb{B}\\llbracket ${(toExpr(ast.left))} ${(ast.operator)} ${(toExpr(ast.right))} \\rrbracket s = ${result}`, ast.operator),
    opRule: ast.operator
  });

  return steps;
  }

  // true alebo false
  if (ast.type === 'BooleanLiteral') {
    const result = ast.value ? 'tt' : 'ff';
    return [{
      raw: `\\mathbb{B}\\llbracket ${ast.value} \\rrbracket s = ${result}`,
      colored: `\\textcolor{${result === 'tt' ? 'green' : 'red'}}{\\mathbb{B}\\llbracket ${ast.value} \\rrbracket s = ${result}}`
    }];
  }

  throw new Error("Nepodporuje tento vyraz vypočtu");
}

function evalArithmetic(ast, env) {
  if (ast.type === 'Literal') return ast.value;
  if (ast.type === 'Identifier') return env[ast.name];
  if (ast.type === 'BinaryExpression') {
    const left = evalArithmetic(ast.left, env);
    const right = evalArithmetic(ast.right, env);
    return evalOp(ast.operator, left, right);
  }
  throw new Error("Neznámy aritmetický uzol");
}

function evalOp(op, a, b) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    case '/': return a / b;
    default:
      throw new Error(`Unsupported operator: ${op}`);
  }
}

function toExpr(ast) {
  if (ast.type === 'Identifier') return ast.name;
  if (ast.type === 'Literal') return ast.value;
  if (ast.type === 'BooleanLiteral') return ast.value ? 'true' : 'false'; // pridané
  if (ast.type === 'BinaryExpression') {
    return `(${toExpr(ast.left)} ${ast.operator} ${toExpr(ast.right)})`;
  }
  if (ast.type === 'LogicalExpression') {
    return `(${toExpr(ast.left)} ∧ ${toExpr(ast.right)})`;
  }
  if (ast.type === 'UnaryExpression') {
    return `¬(${toExpr(ast.argument)})`;
  }
  return '?';
}

function lastBoolResult(stepArray) {
  for (let i = stepArray.length - 1; i >= 0; i--) {
    const raw = stepArray[i].raw;
    if (raw.includes('tt')) return 'tt';
    if (raw.includes('ff')) return 'ff';
  }
  return '?';
}

export let lastHighlightedBoolOperator = null;

function highlightBoolOpInStep(rawText, operator) {
  lastHighlightedBoolOperator = operator;

  const match = rawText.match(/^𝔅\[(.*)\]s = (tt|ff)$/);
  if (!match) return rawText;

  const innerExpr = match[1];
  const result = match[2];

  // rozdelenie výrazu podľa hlavného operátora (napr. = alebo <=)
  const splitRegex = new RegExp(`(.*)\\s*\\${operator}\\s*(.*)`);
  const subMatch = innerExpr.match(splitRegex);

  let highlightedExpr = innerExpr;
  if (subMatch) {
    const left = subMatch[1].trim();
    const right = subMatch[2].trim();
    highlightedExpr =
      `\\textcolor{gold}{${left}} ` +
      `\\textcolor{orange}{${operator}} ` +
      `\\textcolor{cyan}{${right}}`;
  }

  const coloredResult = result === 'tt'
    ? `\\textcolor{green}{tt}`
    : `\\textcolor{red}{ff}`;

  return `{\\mathbb{B}\\llbracket ${highlightedExpr} \\rrbracket s} = ${coloredResult}`;
}



