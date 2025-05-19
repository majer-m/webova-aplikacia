function tokenize(input) {
  return input
    .match(/\s*(=>|<=|==|[A-Za-z]+|\d+|[!¬&∧|+*/<>=()-])\s*/g)
    .map(token => token.trim())
    .filter(token => token.length > 0);
}

export function parse(input) {
  const tokens = tokenize(input);
  let pos = 0;

  function peek() {
    return tokens[pos];
  }

  function consume(expected) {
    const token = tokens[pos++];
    if (expected && token !== expected) {
      throw new Error(`Expected '${expected}', got '${token}'`);
    }
    return token;
  }

  function getValueTypeForOperator(operator) {
    const boolOps = ['=', '<=', '∧', '&', '¬', '!'];
    return boolOps.includes(operator) ? 'bool' : 'arith';
  }

  function parsePrimary() {
    const token = peek();

    if (token === '(') {
      consume('(');
      const expr = parseExpression();
      consume(')');
      return expr;
    } else if (/^\d+$/.test(token)) {
      return { type: "Literal", value: Number(consume()), valueType: "arith" };
    } else if (token === 'true' || token === 'false') {
      return { type: "BooleanLiteral", value: consume() === 'true', valueType: "bool" };
    } else if (/^[A-Za-z]+$/.test(token)) {
      return { type: "Identifier", name: consume(), valueType: "unknown" };
    } else if (token === '¬' || token === '!') {
      consume();
      const arg = parsePrimary();
      return {
        type: "UnaryExpression",
        operator: '¬',
        argument: arg,
        valueType: "bool"
      };
    } else {
      throw new Error("Unexpected token in primary: " + token);
    }
  }

  function parseMultiplicative() {
    let node = parsePrimary();

    while (peek() === '*' || peek() === '/') {
      const operator = consume();
      const right = parsePrimary();
      node = {
        type: "BinaryExpression",
        operator,
        left: node,
        right,
        valueType: "arith"
      };
    }

    return node;
  }

  function parseAdditive() {
    let node = parseMultiplicative();

    while (peek() === '+' || peek() === '-') {
      const operator = consume();
      const right = parseMultiplicative();
      node = {
        type: "BinaryExpression",
        operator,
        left: node,
        right,
        valueType: "arith"
      };
    }

    return node;
  }

  function parseComparison() {
    let node = parseAdditive();

    while (peek() === '=' || peek() === '<=') {
      const operator = consume();
      const right = parseAdditive();
      node = {
        type: "BinaryExpression",
        operator,
        left: node,
        right,
        valueType: "bool"
      };
    }

    return node;
  }

  function parseLogicalAnd() {
    let node = parseComparison();

    while (peek() === '∧' || peek() === '&') {
      const operator = consume();
      const right = parseComparison();
      node = {
        type: "LogicalExpression",
        operator,
        left: node,
        right,
        valueType: "bool"
      };
    }

    return node;
  }

  // 🔍 Automatické rozhodovanie podľa prítomnosti bool operátorov
  function parseExpression() {
    const boolTokens = ['=', '<=', '∧', '&', '¬', '!', 'true', 'false'];
    const isBoolean = tokens.some(token => boolTokens.includes(token));
    return isBoolean ? parseLogicalAnd() : parseAdditive();
  }

  return parseExpression();
}
