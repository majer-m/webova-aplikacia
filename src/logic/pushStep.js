import { generateStep1, generateStep2, generateStep3, generateStep4, generateStep5, generateStep7 } from './buildSteps';
import { getStep5ReplacementCount } from './buildSteps';

export function evaluateUpToStep(ast, env) {
  const steps = [];
  const depth = getAstDepth(ast);
  //console.log(depth);
  // Krok 1
  if (depth >= 1) {
    steps.push(`${generateStep1(ast)}`);
  }
  
  // Krok 2
  if (depth >= 2 && ast.type === 'BinaryExpression') {
    steps.push({
      raw: generateStep2(ast, false),
      colored: generateStep2(ast, true)
    });;
  }
  
    // Krok 3
  if (depth >= 3) {
    steps.push({
      raw: generateStep3(ast, false),
      colored: generateStep3(ast, true)
    });
  }

  // Krok 4
  if (depth >= 4) {
    steps.push({
      raw: generateStep4(ast, false),
      colored: generateStep4(ast, true)
    });
  }
  
  // Krok 5
  const totalSteps = getStep5ReplacementCount(ast);
  for (let i = 1; i <= totalSteps; i++) {
    const raw = generateStep5(ast, env, i, false);
    const colored = generateStep5(ast, env, i, true);
    if (raw) steps.push({ raw, colored });
  }
      
  // Krok 7 (výpočtové kroky)
  const step7List = generateStep7(ast, env);
  step7List.forEach((s) => {
    steps.push(`${s}`);
  });

  return steps;
}

export function getAstDepth(ast) {
  if (!ast || typeof ast !== 'object') return 0;

  switch (ast.type) {
    case 'BinaryExpression':
      return 1 + Math.max(getAstDepth(ast.left), getAstDepth(ast.right));
    case 'Identifier':
    case 'Literal':
      return 1;
    default:
      throw new Error('Neznámy typ uzla: ' + ast.type);
  }
}
  
export function getAstSteps(ast) {
  const steps = [];

  function traverse(node) {
    if (node.type === 'BinaryExpression') {
      // najprv ľavý, potom pravý, potom tento uzol
      traverse(node.left);
      traverse(node.right);
      steps.push(node);
    }
  }

  traverse(ast);
  return steps;
}