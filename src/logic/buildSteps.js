function astToExpression(ast) {
  if (ast.type === "Literal") {
    return `${ast.value}`;
  } else if (ast.type === "Identifier") {
    return ast.name;
  } else if (ast.type === "BinaryExpression") {
    return `(${astToExpression(ast.left)} ${ast.operator} ${astToExpression(ast.right)})`;
  } else {
    throw new Error("Unknown AST node type");
  }
}

export function generateStep1(ast) {
  const fullExpression = astToExpression(ast);
  return `\\mathcal{E}\\llbracket ${fullExpression}\\rrbracket s`;
}


export function generateStep2(ast, colored = false) {
  if (ast.type !== "BinaryExpression") {
    throw new Error("Expected BinaryExpression at root");
  }

  const op = getOperatorSymbol(ast.operator);
  const leftExpr = astToExpression(ast.left);
  const rightExpr = astToExpression(ast.right);

  if (colored) {
    return `= \\textcolor{gold}{\\mathcal{E}\\llbracket ${leftExpr} \\rrbracket s} \\textcolor{orange}{${op}} \\textcolor{cyan}{\\mathcal{E}\\llbracket ${rightExpr} \\rrbracket s}`;
  } else {
    return `= \\mathcal{E}\\llbracket ${leftExpr} \\rrbracket s ${op} \\mathcal{E}\\llbracket ${rightExpr} \\rrbracket s`;
  }
}

function getOperatorSymbol(op) {
  switch (op) {
    case "+": return "⊕";
    case "-": return "⊖";
    case "*": return "⊗";
    case "/": return "÷";
    default: return op;
  }
}


let highlightUsedStep3 = false;
export let lastHighlightedOpStep3 = null;

export function generateStep3(ast, colored = false) {
  if (ast.type !== "BinaryExpression") throw new Error("Expected BinaryExpression");
  highlightUsedStep3 = false;
  lastHighlightedOpStep3 = null;

  const op = getOperatorSymbol(ast.operator);
  const left = transformStep3(ast.left, true, true, colored);
  const right = transformStep3(ast.right, true, true, colored);

  return `= \\left(${left} ${op} ${right}\\right)`;
}

function transformStep3(node, isTopLevel, forceSplit = false, colored = false) {
  if (node.type === "Literal" || node.type === "Identifier") {
    return toLatexExpr(node); // vždy vracaj LaTeX, aj keď nie je farebné
  }

  if (node.type === "BinaryExpression") {
    if (forceSplit) {
      const leftStr = transformStep3(node.left, false, false, colored);
      const rightStr = transformStep3(node.right, false, false, colored);
      const op = getOperatorSymbol(node.operator);

      if (colored && !highlightUsedStep3) {
        highlightUsedStep3 = true;
        lastHighlightedOpStep3 = node.operator; // ulož napr. "*"
        return `\\left(\\textcolor{gold}{${toLatexExpr(node.left)}} \\textcolor{orange}{${getOperatorSymbol(node.operator)}} \\textcolor{cyan}{${toLatexExpr(node.right)}}\\right)`;
      }
      return `\\left(${leftStr} ${op} ${rightStr}\\right)`;
    } else {
      return toLatexExpr(node);
    }
  }

  throw new Error("Unsupported node");
}

export let lastHighlightedOpStep4 = null;
let highlightUsedStep4 = false;

export function generateStep4(ast, colored = false) {
  if (ast.type !== "BinaryExpression") {
    throw new Error("Expected BinaryExpression");
  }

  highlightUsedStep4 = false;
  lastHighlightedOpStep4 = null;

  const left = transformStep4(ast.left, colored);
  const right = transformStep4(ast.right, colored);
  const op = getOperatorSymbol(ast.operator);

  return `= \\left(${left} ${op} ${right}\\right)`;
}

function transformStep4(node, colored = false) {
  if (node.type === "Literal" || node.type === "Identifier") {
    return toLatexExpr(node);
  }

  if (node.type === "BinaryExpression") {
    const leftStr = transformStep4(node.left, colored);
    const rightStr = transformStep4(node.right, colored);
    const op = getOperatorSymbol(node.operator);

    if (colored && !highlightUsedStep4) {
      highlightUsedStep4 = true;
      lastHighlightedOpStep4 = node.operator;
      return `\\left(\\textcolor{gold}{${toLatexExpr(node.left)}} \\textcolor{orange}{${op}} \\textcolor{cyan}{${toLatexExpr(node.right)}}\\right)`;
    }

    return `\\left(${leftStr} ${op} ${rightStr}\\right)`;
  }

  throw new Error("Unsupported node in step 4");
}

// Pridané: univerzálny krok 5 s postupným nahradzovaním po jednom prvku
export function generateStep5(ast, env, stepDepth = 0, colored = false) {
  let counter = { current: 0 };
  const result = buildStep5(ast, env, stepDepth, colored, counter);
  const plain = buildStep5(ast, env, stepDepth, false, { current: 0 });
  if (!plain || buildStep5.lastPlain === plain) return null;
  buildStep5.lastPlain = plain;
  return `= ${result}`;
}

function buildStep5(node, env = {}, stepDepth = 0, colored = false, counter = { current: 0 }) {
  if (node.type === "Literal") {
    const nExpr = `\\mathbb{N}\\llbracket${node.value}\\rrbracket`;
    const val = `${node.value}`;
    const stepIndex = counter.current++;

    // krok 1: zvýrazni N[[n]]
    if (stepDepth === stepIndex + 1) {
      return colored ? `\\textcolor{darkblue}{${nExpr}}` : nExpr;
    }

    // po kroku 1 – len číslo bez farby
    if (stepDepth > stepIndex + 1) {
      return val;
    }

    // pred výmenou
    return `\\mathcal{E}\\llbracket ${node.value}\\rrbracket s`;
  }

  if (node.type === "Identifier") {
    const sx = `s\\,${node.name}`;
    const value = env[node.name];
    const stepIndex = counter.current++;

    // krok 1: zvýrazni s x
    if (stepDepth === stepIndex + 1) {
      return colored ? `\\textcolor{green}{${sx}}` : sx;
    }

    // po kroku 1 – len číslo bez farby
    if (stepDepth > stepIndex + 1 && value !== undefined) {
      return `${value}`;
    }

    // pred výmenou
    return `\\mathcal{E}\\llbracket ${node.name}\\rrbracket s`;
  }

  if (node.type === "BinaryExpression") {
    const left = buildStep5(node.left, env, stepDepth, colored, counter);
    const right = buildStep5(node.right, env, stepDepth, colored, counter);
    const op = getOperatorSymbol(node.operator);
    return `\\left(${left} ${op} ${right}\\right)`;
  }

  throw new Error("Unsupported node in step 5");
}

export function getStep5ReplacementCount(ast) {
  let count = 0;
  function traverse(node) {
    if (node.type === 'Identifier' || node.type === 'Literal') {
      count++;
    }
    if (node.type === 'BinaryExpression') {
      traverse(node.left);
      traverse(node.right);
    }
  }
  traverse(ast);
  return count * 2; // každý uzol má dva podkroky: E[[x]]s -> sx -> 6
}

export function generateStep7(ast, env) {
  const expr = evaluateSymbolic2(ast, env);
  const steps = [];

  let current = expr;
  const parenExpr = /\((-?\d+)\s*([⊕⊖⊗÷])\s*(-?\d+)\)/;

  while (true) {
    const match = current.match(parenExpr);
    if (!match) break;

    const [full, a, op, b] = match;
    const result = compute(parseInt(a), op, parseInt(b));
    const next = current.replace(full, result.toString());

    if (next !== current && !steps.includes(next)) {
      steps.push(next);
    }

    current = next;
  }

  if (!steps.length || steps[steps.length - 1] !== current) {
    steps.push(current);
  }

  return steps;
}


function evaluateSymbolic2(node, env) {
  if (node.type === "Literal") {
    return `${node.value}`;
  }

  if (node.type === "Identifier") {
    if (!(node.name in env)) {
      throw new Error(`Missing value for variable: ${node.name}`);
    }
    return `${env[node.name]}`;
  }

  if (node.type === "BinaryExpression") {
    const left = evaluateSymbolic2(node.left, env);
    const right = evaluateSymbolic2(node.right, env);
    const op = getOperatorSymbol(node.operator);
    return `(${left} ${op} ${right})`;
  }

  throw new Error("Unsupported node in step 7");
}

function compute(a, op, b) {
  switch (op) {
    case '⊕': return a + b;
    case '⊖': return a - b;
    case '⊗': return a * b;
    default: throw new Error(`Unknown operator ${op}`);
}
}

function toLatexExpr(node) {
  return `\\mathcal{E}\\llbracket ${astToExpression(node)} \\rrbracket s`;
}

export function setLastHighlightedOpStep3(val) {
  lastHighlightedOpStep3 = val;
}
export function setLastHighlightedOpStep4(val) {
  lastHighlightedOpStep4 = val;
}