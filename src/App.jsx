import { useState } from 'react';
import { parse } from './logic/ast';
import { evaluateUpToStep } from './logic/pushStep';
import { BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import Tree from 'react-d3-tree';
import { lastHighlightedOpStep3, lastHighlightedOpStep4, setLastHighlightedOpStep3, setLastHighlightedOpStep4} from './logic/buildSteps';
import { evaluateBooleanSteps } from './logic/buildStepsBoolean';
import './App.css';
import HelpSection from './HelpSection';
import TopBar from './TopBar';
import html2pdf from 'html2pdf.js';
import {Play,StepForward,StepBack,ListOrdered,RotateCcw} from 'lucide-react';

export default function App() {
  const [expression, setExpression] = useState('((x - y) * 3) + 2');
  const [treeData, setTreeData] = useState('');
  const [environment, setEnvironment] = useState([{ name: 'x', value: 6 }, { name: 'y', value: 1 }]);
  const [steps, setSteps] = useState([]);
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [mode, setMode] = useState('arith'); // 'arith' alebo 'bool'
  const [showHelpSection, setShowHelpSection] = useState(false);
  const [language, setLanguage] = useState('sk'); // 'sk' alebo 'en'
  const [darkMode, setDarkMode] = useState(false);
  const [customRules, setCustomRules] = useState([]);
  const [showRuleForm, setShowRuleForm] = useState(false);

  const [learningMode, setLearningMode] = useState(false);
  const [learningAnswer, setLearningAnswer] = useState("");
  const [learningFeedback, setLearningFeedback] = useState("");
  const [correctLearningAnswer, setCorrectLearningAnswer] = useState("");

  const [newRule, setNewRule] = useState({
  name: '',
  scope: 'arith',
  op: '',
  behavior: '',
  latex: ''
  });

  function handleStart() {
    try {
      console.log(expression);
      // Najprv parsuj bez režimu alebo so zmiešaným režimom
      const ast = parse(expression); // alebo custom parser, ktorý podporuje všetky typy
      const env = parseEnv(environment);

      // Automatické rozpoznanie typu výrazu
      let inferredMode = 'arith';

      if (
        ast.type === 'LogicalExpression' ||
        ast.type === 'BooleanLiteral' ||
        ast.type === 'UnaryExpression' ||
        (ast.type === 'BinaryExpression' && ['<=', '=', '>=', '!=', '<', '>'].includes(ast.operator))
      ) {
        inferredMode = 'bool';
      }

      setMode(inferredMode); // Ulož režim pre pravidlá v UI

      // Vykonaj výpočet podľa typu
      const allSteps = inferredMode === 'arith'
        ? evaluateUpToStep(ast, env, customRules)
        : evaluateBooleanSteps(ast, env, customRules);

      setSteps(allSteps);
      setVisibleSteps([allSteps[0]]);
      setTreeData(convertAstToTreeData(ast));
    } catch (err) {
      alert('Chyba: ' + err.message);
    }
  }

  function handleAddCustomRule() {
  if (
    !newRule.name.trim() ||
    !newRule.op.trim() ||
    !newRule.behavior.trim() ||
    !newRule.latex.trim()
  ) {
    alert(language === 'sk'
      ? 'Vyplň názov, operátor aj LaTeX pravidla.'
      : 'Fill in name, operator and rule LaTeX.'
    );
    return;
  }

  const rule = {
    id: Date.now(),
    name: newRule.name,
    scope: newRule.scope,
    op: newRule.op,
    behavior: newRule.behavior,
    latex: newRule.latex,
    source: 'user'
  };

  setCustomRules([...customRules, rule]);

  setNewRule({
    name: '',
    scope: 'arith',
    op: '',
    behavior: '',
    latex: ''
  });

  setShowRuleForm(false);
}

function handleRemoveCustomRule(id) {
  setCustomRules(customRules.filter(rule => rule.id !== id));
}


  function parseEnv() {
    const env = {};
    for (const { name, value } of environment) {
      if (!name || isNaN(Number(value))) {
        throw new Error(`${translations[language].errorInvalidVariable}: ${name}=${value}`);
      }
      env[name] = Number(value);
    }
    return env;
  }

  function handleNextStep() {
    const nextIndex = visibleSteps.length;
    if (nextIndex < steps.length) {
      setVisibleSteps([...visibleSteps, steps[nextIndex]]);
    }
  }

  const handleStepBack = () => {
    if (visibleSteps.length > 0) {
      setVisibleSteps(visibleSteps.slice(0, -1));
    }
  };

  const handleShowAllSteps = () => {
    setVisibleSteps(steps);
  };

  const handleReset = () => {
    setExpression([]);
    setEnvironment([]);
    setSteps([]);
    setVisibleSteps([]);
    setTreeData(null);
    setLastHighlightedOpStep3(null);
    setLastHighlightedOpStep4(null);
  };

  function handleGenerateExample() {
      const examples = [
        {
          expression: '((x - y) * 3) + 2',
          environment: [
            { name: 'x', value: 6 },
            { name: 'y', value: 1 }
          ]
        },
        {
          expression: '(x + y) * 2',
          environment: [
            { name: 'x', value: 4 },
            { name: 'y', value: 3 }
          ]
        },
        {
          expression: 'x <= y',
          environment: [
            { name: 'x', value: 2 },
            { name: 'y', value: 5 }
          ]
        },
        {
          expression: '(x > y) ∨ false',
          environment: [
            { name: 'x', value: 6 },
            { name: 'y', value: 1 }
          ]
        },
        {
          expression: '¬(x <= y)',
          environment: [
            { name: 'x', value: 8 },
            { name: 'y', value: 3 }
          ]
        },
        {
          expression: '((x - y) * z) + 1',
          environment: [
            { name: 'x', value: 10 },
            { name: 'y', value: 4 },
            { name: 'z', value: 2 }
          ]
        }
      ];
  
      const randomExample = examples[Math.floor(Math.random() * examples.length)];
  
      setExpression(randomExample.expression);
      setEnvironment(randomExample.environment);
  
      setSteps([]);
      setVisibleSteps([]);
      setTreeData(null);
  
      setLastHighlightedOpStep3(null);
      setLastHighlightedOpStep4(null);

      return randomExample;
    }


  function startLearningMode() {
    const example = handleGenerateExample();

    setLearningMode(true);
    setLearningAnswer("");
    setLearningFeedback("");
    setCorrectLearningAnswer("");

    try {
      const ast = parse(example.expression);

      const env = Object.fromEntries(
        example.environment.map(v => [v.name, Number(v.value)])
      );

      const isBool =
        ast.type === "LogicalExpression" ||
        ast.type === "BooleanLiteral" ||
        ast.type === "UnaryExpression" ||
        (ast.type === "BinaryExpression" &&
          ["<=", "≤", "=", ">=", "!=", "<", ">"].includes(ast.operator));

      const resultSteps = isBool
        ? evaluateBooleanSteps(ast, env, customRules)
        : evaluateUpToStep(ast, env, customRules);

      const lastStep = resultSteps[resultSteps.length - 1];
      const rawLastStep = typeof lastStep === "string" ? lastStep : lastStep.raw;

      const matchBool = rawLastStep.match(/(tt|ff)\s*$/);
      const matchNumber = rawLastStep.match(/=?\s*(-?\d+)\s*$/);

      if (matchBool) {
        setCorrectLearningAnswer(matchBool[1]);
      } else if (matchNumber) {
        setCorrectLearningAnswer(matchNumber[1]);
      }

      setSteps(resultSteps);
      setVisibleSteps([]);
      setTreeData(convertAstToTreeData(ast));
      setMode(isBool ? "bool" : "arith");
    } catch (err) {
      console.error(err);
    }
  }

  function checkLearningAnswer() {
    if (learningAnswer.trim() === correctLearningAnswer) {
      setLearningFeedback(
        language === "sk" ? "Správne!" : "Correct!"
      );
    } else {
      setLearningFeedback(
        language === "sk"
          ? `Nesprávne. Správna odpoveď je ${correctLearningAnswer}.`
          : `Incorrect. The correct answer is ${correctLearningAnswer}.`
      );
    }

    setVisibleSteps(steps);
  }

  function convertAstToTreeData(ast) {
    if (!ast) return { name: '?' };

    switch (ast.type) {
      case 'Literal':
        return { name: String(ast.value) };

      case 'BooleanLiteral':
        return { name: ast.value ? 'true' : 'false' };

      case 'Identifier':
        return { name: ast.name };

      case 'BinaryExpression':
      case 'LogicalExpression':
        return {
          name: ast.operator,
          children: [
            convertAstToTreeData(ast.left),
            convertAstToTreeData(ast.right)
          ]
        };

      case 'UnaryExpression':
        return {
          name: ast.operator,
          children: [convertAstToTreeData(ast.argument)]
        };

      default:
        return { name: '?' };
    }
  }

  return (
    <div className={darkMode ? 'dark-mode' : ''}>
      <TopBar
        language={language}
        onLanguageChange={setLanguage}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
          <button onClick={() => setShowHelpSection(prev => !prev)}>
            {showHelpSection ? translations[language].hideHelp : translations[language].help}
          </button>
      </div>

      <div style={{ fontFamily: 'Arial', padding: '2rem' }}>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>
              {translations[language].expression}
            </label>
            <input
              type="text"
              value={expression}
              onChange={e => {
                const replacements = {
                  '\\land': '∧',
                  '\\lnot': '¬',
                  '\\leq': '≤',
                };

                let updated = e.target.value;
                for (const [latex, symbol] of Object.entries(replacements)) {
                  updated = updated.replaceAll(latex, symbol);
                }
                setExpression(updated);
              }}
              style={{ width: '300px' }}
            />
          </div>

          <div style={{ flexGrow: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>
              {translations[language].variables}
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              {environment.map((entry, index) => (
                <div key={index} className="variable-chip">
                  <input
                    value={entry.name}
                    onChange={e => {
                      const updated = [...environment];
                      updated[index].name = e.target.value;
                      setEnvironment(updated);
                    }}
                    placeholder="x"
                  />
                  =
                  <input
                    value={entry.value}
                    onChange={e => {
                      const updated = [...environment];
                      updated[index].value = e.target.value;
                      setEnvironment(updated);
                    }}
                    placeholder="0"
                  />
                  <span className="remove" onClick={() => {
                    const updated = environment.filter((_, i) => i !== index);
                    setEnvironment(updated);
                  }}>
                    ×
                  </span>
                </div>
              ))}
              <button className="add-var" onClick={() => {
                setEnvironment([...environment, { name: '', value: '' }]);
              }}>+</button>
            </div>
          </div>
        </div>

        <button onClick={handleStart}>
          <Play size={16} style={{ marginRight: '0.5rem' }} />
          {translations[language].start}
        </button>

        <button onClick={handleNextStep} disabled={visibleSteps.length >= steps.length}>
          <StepForward size={16} style={{ marginRight: '0.5rem' }} />
          {translations[language].next}
        </button>

        <button onClick={handleStepBack} disabled={visibleSteps.length === 0}>
          <StepBack size={16} style={{ marginRight: '0.5rem' }} />
          {translations[language].back}
        </button>

        <button onClick={handleShowAllSteps}>
          <ListOrdered size={16} style={{ marginRight: '0.5rem' }} />
          {translations[language].all}
        </button>

        <button onClick={handleReset}>
          <RotateCcw size={16} style={{ marginRight: '0.5rem' }} />
          {translations[language].reset}
        </button>

        <button onClick={handleGenerateExample}>
          <RotateCcw size={16} style={{ marginRight: '0.5rem' }} />
          {translations[language].generateExample}
        </button>

        <button onClick={startLearningMode}>
          {language === "sk" ? "Režim učenia" : "Learning mode"}
        </button>
        
        {learningMode && (
          <div className="learning-box">
            <h3>{language === "sk" ? "Režim učenia" : "Learning mode"}</h3>

            <p>
              {language === "sk"
                ? "Aký je výsledok zadaného výrazu?"
                : "What is the result of the entered expression?"}
            </p>

            <input
              value={learningAnswer}
              onChange={(e) => setLearningAnswer(e.target.value)}
              placeholder={language === "sk" ? "Zadaj výsledok" : "Enter result"}
            />

            <button onClick={checkLearningAnswer}>
              {language === "sk" ? "Skontrolovať" : "Check"}
            </button>

            {learningFeedback && <p>{learningFeedback}</p>}
          </div>
        )}


        <div className="container">
          {/* ĽAVÝ STĹPEC – pravidlá */}
          <div>
            {/* pravidlá sémantiky v samostatnom kontajneri */}
            <div className="rules-container">
            <h4>{translations[language].rules}</h4>
            <button onClick={() => setShowRuleForm(prev => !prev)}>
              {showRuleForm
                ? (language === 'sk' ? 'Skryť formulár' : 'Hide form')
                : (language === 'sk' ? '+ Pridať pravidlo' : '+ Add rule')}
            </button>

            {showRuleForm && (
              <div className="custom-rule-form">
                <label>
                  {language === 'sk' ? 'Názov pravidla' : 'Rule name'}
                </label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder={language === 'sk' ? 'Napr. Pravidlo pre delenie' : 'E.g. Division rule'}
                />

                <label>
                  {language === 'sk' ? 'Typ pravidla' : 'Rule type'}
                </label>
                <select
                  value={newRule.scope}
                  onChange={e => setNewRule({ ...newRule, scope: e.target.value })}
                >
                  <option value="arith">
                    {language === 'sk' ? 'Aritmetické' : 'Arithmetic'}
                  </option>
                  <option value="bool">
                    {language === 'sk' ? 'Boolovské' : 'Boolean'}
                  </option>
                </select>

                <label>
                  {language === 'sk' ? 'Operátor' : 'Operator'}
                </label>
                <input
                  type="text"
                  value={newRule.op}
                  onChange={e => setNewRule({ ...newRule, op: e.target.value })}
                  placeholder="+, -, *, /, =, <=, ∧, ¬"
                />

                <label>
                  {language === 'sk' ? 'Správanie pravidla' : 'Rule behavior'}
                </label>

                <select
                  value={newRule.behavior}
                  onChange={e => setNewRule({ ...newRule, behavior: e.target.value })}
                >
                  <option value="">
                    {language === 'sk' ? '-- vyber --' : '-- select --'}
                  </option>

                  {newRule.scope === 'arith' && (
                    <>
                      <option value="add">
                        {behaviorTranslations[language].Addition}
                      </option>

                      <option value="subtract">
                        {behaviorTranslations[language].Subtraction}
                      </option>

                      <option value="multiply">
                        {behaviorTranslations[language].Multiplication}
                      </option>

                      <option value="divide">
                        {behaviorTranslations[language].Division}
                      </option>

                      <option value="modulo">
                        {behaviorTranslations[language].Modulo}
                      </option>
                    </>
                  )}

                  {newRule.scope === 'bool' && (
                    <>
                      <option value="equal">
                        {behaviorTranslations[language].Equality}
                      </option>

                      <option value="notEqual">
                        {behaviorTranslations[language].NotEqual}
                      </option>

                      <option value="lessThan">
                        {behaviorTranslations[language].LessThan}
                      </option>

                      <option value="greaterThan">
                        {behaviorTranslations[language].GreaterThan}
                      </option>

                      <option value="lessEqual">
                        {behaviorTranslations[language].LessOrEqual}
                      </option>
                      
                      <option value="greaterEqual">
                        {behaviorTranslations[language].GreaterOrEqual}
                      </option> 

                      <option value="and">
                        {behaviorTranslations[language].AND}
                      </option>

                      <option value="or">
                        {behaviorTranslations[language].OR}
                      </option>

                      <option value="not">
                        {behaviorTranslations[language].NOT}
                      </option>
                    </>
                  )}
                </select>

                <label>
                  LaTeX
                </label>
                <textarea
                  value={newRule.latex}
                  onChange={e => setNewRule({ ...newRule, latex: e.target.value })}
                  placeholder="\\mathcal{E}\\llbracket e_1 / e_2 \\rrbracket s = \\mathcal{E}\\llbracket e_1 \\rrbracket s \\div \\mathcal{E}\\llbracket e_2 \\rrbracket s"
                  rows={4}
                />

                <button onClick={handleAddCustomRule}>
                  {language === 'sk' ? 'Uložiť pravidlo' : 'Save rule'}
                </button>
              </div>
            )}
            {[
              ...semanticRules,
              ...(mode === 'bool' ? semanticRulesBool : []),
              ...customRules.filter(rule =>
                mode === 'bool'
                  ? rule.scope === 'arith' || rule.scope === 'bool'
                  : rule.scope === 'arith'
              )
            ].map((rule, i) => {
              let highlightedLatex = rule.latex;

              const currentIndex = visibleSteps.length - 1;
              const currentStep = steps[currentIndex];
              let stepOp = null;

              if (mode === 'arith') {
                if (currentIndex === 2) {
                  stepOp = lastHighlightedOpStep3;
                } else if (currentIndex === 3) {
                  stepOp = lastHighlightedOpStep4;
                } else {
                  stepOp = extractOperatorFromStep(currentStep);
                }

                if (stepOp === rule.op && (currentIndex === 1 || currentIndex === 2 || currentIndex === 3)) {
                  highlightedLatex = rule.latex
                    .replace('\\mathcal{E}\\llbracket e_1 \\rrbracket s', '\\textcolor{gold}{\\mathcal{E}\\llbracket e_1 \\rrbracket s}')
                    .replace('\\oplus', '\\textcolor{orange}{\\oplus}')
                    .replace('\\ominus', '\\textcolor{orange}{\\ominus}')
                    .replace('\\otimes', '\\textcolor{orange}{\\otimes}')
                    .replace('\\mathcal{E}\\llbracket e_2 \\rrbracket s', '\\textcolor{cyan}{\\mathcal{E}\\llbracket e_2 \\rrbracket s}');
                }
              }

              if(mode === 'bool'){
                let stepOp = currentStep?.opRule || extractOperatorFromStep(currentStep);

                if (stepOp === rule.op) {
                  const isTrue = currentStep.raw.includes('= \\textcolor{green}{tt}');
                  const isFalse = currentStep.raw.includes('= \\textcolor{red}{ff}');

                  highlightedLatex = rule.latex;

                  // Zvýrazni hlavičku – len operátor v {e1 op e2}
                  highlightedLatex = highlightedLatex.replace(
                    /\\llbracket e_1 ([=≤]) e_2 \\rrbracket/,
                    (_, op) => `\\llbracket e_1 \\textcolor{orange}{${op}} e_2 \\rrbracket`
                  );

                  // Zvýrazni správny riadok podmienky podľa výsledku výpočtu
                  if (isTrue) {
                    highlightedLatex = highlightedLatex
                      .replace(/tt,/, '\\textcolor{green}{tt},')
                      .replace(/ak (.*?) = (.*?) \\\\/, 'ak \\textcolor{gold}{$1 = $2} \\\\');
                  }

                  if (isFalse) {
                    highlightedLatex = highlightedLatex
                      .replace(/ff,/, '\\textcolor{red}{ff},')
                      .replace(/ak (.*?) \\neq (.*?) \\end/, 'ak \\textcolor{cyan}{$1 \\neq $2} \\end');
                  }
                }

              }
              // Spoločné zvýraznenie pre `s x` a `𝔑[n]` podľa výskytu v raw texte
              const raw = steps[currentIndex]?.raw || '';
              if (/s\\,[a-zA-Z]/.test(raw) && rule.op === 'x') {
                highlightedLatex = rule.latex.replace(/s\\,[a-zA-Z]/g, match => `\\textcolor{green}{${match}}`);
              }
              if (raw.includes('\\mathbb{N} \\llbracket') && rule.op === 'n') {
                highlightedLatex = rule.latex.replace('\\mathbb{N}\\llbracket n \\rrbracket', '\\textcolor{darkblue}{\\mathbb{N}\\llbracket n \\rrbracket}');
              }

              return (
                        <div key={rule.id || i} className={rule.source === 'user' ? 'custom-rule-item' : ''}>
                          {rule.source === 'user' && (
                            <div className="custom-rule-header">
                              <strong>{rule.name}</strong>
                              <button
                                className="remove-rule-btn"
                                onClick={() => handleRemoveCustomRule(rule.id)}
                              >
                                ×
                              </button>
                            </div>
                          )}

                          <BlockMath math={highlightedLatex} />
                        </div>
                      );
            })}
            </div>
            {/* Nápoveda v samostatnom kontajneri */}
            {showHelpSection && (
              <div className="help-container">
                <HelpSection language={language} />
              </div>
            )}
          </div>


          {/* STREDNÝ STĹPEC – výpočet */}
          <div className="column middle">
            <h4>{translations[language].steps}</h4>
            {visibleSteps.map((step, i) => {
              const isActive = i === visibleSteps.length - 1;
              const math =
              typeof step === 'string'
                ? toLatexFormatted(step, i)
                : (isActive && step.colored ? step.colored : step.raw || '');

              return (
                <div key={i} style={{ marginBottom: '0.5rem' }}>
                  <BlockMath math={math} />
                </div>
              );
            })}

            {steps.length > 0 && visibleSteps.length === steps.length && (
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => {
                  const latex = exportStepsAsLatex(steps);
                  const blob = new Blob([latex], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'vypocet.tex';
                  link.click();
                  URL.revokeObjectURL(url);
                }}>
                  {translations[language].exportLatex}
                </button>
                <button onClick={() => downloadRenderedStepsAsPDF(steps, language)}>
                  {translations[language].exportPDF}
                </button>
              </div>
            )}

          </div>

          {/* PRAVÝ STĹPEC – AST placeholder */}
          <div className="column">
            <h4>{translations[language].ast}</h4>
            <div id="ast-tree">
              {treeData ? (
                <Tree
                  data={treeData}
                  renderCustomNodeElement={renderCustomNode}
                  orientation="vertical"
                  translate={{ x: 200, y: 50 }}
                  nodeSize={{ x: 100, y: 100 }}
                  separation={{ siblings: 0.5, nonSiblings: 1 }}
                  zoom={1.3}
                  zoomable={false}
                  collapsible={false}
                />
              ) : (
                <p style={{ textAlign: 'center', color: '#999' }}>
                  {translations[language].astPlaceholder}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Funkcia pre latex transformáciu
function toLatexFormatted(step, index) {
  const body = step
    .replace(/\[/g, '\\llbracket ')
    .replace(/\]/g, '\\rrbracket ')
    .replace(/⊕/g, '\\oplus ')
    .replace(/⊖/g, '\\ominus ')
    .replace(/⊗/g, '\\otimes ')
    .replace(/E\[(.*?)\]s/g, '\\mathcal{E}[$1]s')
    .replace(/N/g, '\\mathbb{N}')
    .replace(/s (\w+)/g, 's\\,$1');

  return index === 0 ? body : '= ' + body;
}


const semanticRules = [
  {
    op: 'n',
    latex: '\\mathcal{E}\\llbracket n \\rrbracket s = \\mathbb{N}\\llbracket n \\rrbracket',
  },
  {
    op: 'x',
    latex: '\\mathcal{E}\\llbracket x \\rrbracket s = s\\,x',
  },
  {
    op: '+',
    latex: '\\mathcal{E}\\llbracket e_1 + e_2 \\rrbracket s = \\mathcal{E}\\llbracket e_1 \\rrbracket s \\oplus \\mathcal{E}\\llbracket e_2 \\rrbracket s',
  },
  {
    op: '-',
    latex: '\\mathcal{E}\\llbracket e_1 - e_2 \\rrbracket s = \\mathcal{E}\\llbracket e_1 \\rrbracket s \\ominus \\mathcal{E}\\llbracket e_2 \\rrbracket s',
  },
  {
    op: '*',
    latex: '\\mathcal{E}\\llbracket e_1 * e_2 \\rrbracket s = \\mathcal{E}\\llbracket e_1 \\rrbracket s \\otimes \\mathcal{E}\\llbracket e_2 \\rrbracket s',
  },
  {
    op: 'group',
    latex: '\\mathcal{E}\\llbracket (e)\\rrbracket s = (\\mathcal{E}\\llbracket e \\rrbracket s)',
  }
];

function extractOperatorFromStep(step) {
  if (!step || typeof step !== 'object' || !step.raw) return null;

  if (step.raw.includes('⊕')) return '+';
  if (step.raw.includes('⊖')) return '-';
  if (step.raw.includes('⊗')) return '*';

  return null;
}

const semanticRulesBool = [
  { op: 'true', latex: '\\mathbb{B}\\llbracket true \\rrbracket s = tt' },
  { op: 'false', latex: '\\mathbb{B}\\llbracket false \\rrbracket s = ff' },
  { op: '=', latex: '\\mathbb{B}\\llbracket e_1 = e_2 \\rrbracket s = \\left\\{ \\begin{array}{ll} tt, & \\text{ ak } \\mathcal{E}\\llbracket e_1 \\rrbracket s = \\mathcal{E}\\llbracket e_2 \\rrbracket s \\\\ ff, & \\text{ ak } \\mathcal{E}\\llbracket e_1 \\rrbracket s \\neq \\mathcal{E}\\llbracket e_2 \\rrbracket s \\end{array} \\right.' },
  { op: '<=', latex: '\\mathbb{B}\\llbracket e_1 \\leq e_2 \\rrbracket s = \\left\\{ \\begin{array}{ll} tt, & \\text{ ak } \\mathcal{E}\\llbracket e_1 \\rrbracket s \\leq \\mathcal{E}\\llbracket e_2 \\rrbracket s \\\\ ff, & \\text{ ak } \\mathcal{E}\\llbracket e_1 \\rrbracket s > \\mathcal{E}\\llbracket e_2 \\rrbracket s \\end{array} \\right.' },
  { op: '¬', latex: '\\mathbb{B}\\llbracket \\neg b \\rrbracket s = \\left\\{ \\begin{array}{ll} tt, & \\text{ ak } \\mathbb{B}[b]s = ff \\\\ ff, & \\text{ ak } \\mathbb{B}[b]s = tt \\end{array} \\right.' },
  { op: '∧', latex: '\\mathbb{B}\\llbracket b_1 \\land b_2 \\rrbracket s = \\left\\{ \\begin{array}{ll} tt, & \\text{ ak } \\mathbb{B}[b_1]s = tt \\text{ a } \\mathbb{B}[b_2]s = tt \\\\ ff, & \\text{ ak } \\mathbb{B}[b_1]s = ff \\text{ alebo } \\mathbb{B}[b_2]s = ff \\end{array} \\right.' },
];

const renderCustomNode = ({ nodeDatum }) => {
  const isOperator = ['+', '-', '*', '/', '=', '<=', '¬', '∧'].includes(nodeDatum.name);
  const color = isOperator ? 'red' : 'black';

  return (
    <g>
      <circle r={10} fill="white" stroke="black" />
      <text
        fill={color}
        stroke="none"
        dy=".35em"
        textAnchor="middle"
        style={{ fontSize: '14px' }}
      >
        {nodeDatum.name}
      </text>
    </g>
  );
};

function exportStepsAsLatex(steps) {
  return steps.map((step, i) => {
    const raw = typeof step === 'string' ? step : (step.raw || step.colored || '');
    const formatted = toLatexFormatted(raw, i);
    return `\\[ ${formatted} \\]`;
  }).join('\n\n');
}

function downloadRenderedStepsAsPDF(steps, language) {
  const container = document.createElement('div');
  container.style.padding = '2rem';
  container.style.fontFamily = 'Arial';

  const title = document.createElement('h2');
  title.textContent = `${translations[language].calculationTitle}:`;
  container.appendChild(title);

  steps.forEach((step, i) => {
    const raw = typeof step === 'string' ? step : (step.raw || step.colored || '');
    const latex = toLatexFormatted(raw, i);
    const div = document.createElement('div');
    div.innerHTML = `<strong>${i + 1}.</strong> \\[ ${latex} \\]`;
    container.appendChild(div);
  });

  document.body.appendChild(container);

  // Načítaj KaTeX renderovanie
  window.renderMathInElement(container, {
    delimiters: [
      { left: "\\[", right: "\\]", display: true },
      { left: "$$", right: "$$", display: true }
    ]
  });

  setTimeout(() => {
    html2pdf()
      .from(container)
      .set({
        margin: 0.5,
        filename: 'vypocet.pdf',
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      })
      .save()
      .then(() => container.remove());
  }, 500); // Počkaj, kým KaTeX vyrenderuje
}

const translations = {
  sk: {
    expression: "Výraz:",
    variables: "Premenné:",
    start: "Spusti výpočet",
    next: "Ďalší krok",
    back: "Krok späť",
    all: "Zobraziť celý výpočet",
    reset: "Resetovať",
    rules: "Pravidlá sémantiky",
    steps: "Postup výpočtu",
    ast: "AST strom",
    exportLatex: "Exportovať do LaTeX",
    exportPDF: "Stiahnuť PDF (automaticky)",
    errorInvalidVariable: "Neplatná premenná",
    astPlaceholder: "AST strom sa zobrazí po spustení výpočtu.",
    calculationTitle: "Výpočtové kroky",
    help: "Zobraziť nápovedu",
    hideHelp: "Skryť nápovedu",
    generateExample: "Generovať príklad"
  },
  en: {
    expression: "Expression:",
    variables: "Variables:",
    start: "Start Evaluation",
    next: "Next Step",
    back: "Previous Step",
    all: "Show Full Evaluation",
    reset: "Reset",
    rules: "Semantic Rules",
    steps: "Evaluation Steps",
    ast: "AST Tree",
    exportLatex: "Export to LaTeX",
    exportPDF: "Download PDF (auto)",
    errorInvalidVariable: "Invalid variable",
    astPlaceholder: "AST tree will appear after evaluation starts.",
    calculationTitle: "Evaluation Steps",
    help: "Show Help",
    hideHelp: "Hide Help",
    generateExample: "Generate example"
  }
};

const behaviorTranslations = {
  sk: {
    Addition: 'Sčítanie',
    Subtraction: 'Odčítanie',
    Multiplication: 'Násobenie',
    Division: 'Delenie',
    Modulo: 'Modulo',

    Equality: 'Rovnosť',
    NotEqual: 'Nerovnosť',
    LessThan: 'Menšie ako',
    GreaterThan: 'Väčšie ako',
    LessOrEqual: 'Menšie alebo rovné',
    GreaterOrEqual: 'Väčšie alebo rovné',

    AND: 'AND',
    OR: 'OR',
    NOT: 'NOT'
  },

  en: {
    Addition: 'Addition',
    Subtraction: 'Subtraction',
    Multiplication: 'Multiplication',
    Division: 'Division',
    Modulo: 'Modulo',

    Equality: 'Equality',
    NotEqual: 'Not Equal',
    LessThan: 'Less Than',
    GreaterThan: 'Greater Than',
    LessOrEqual: 'Less or Equal',
    GreaterOrEqual: 'Greater or Equal',

    AND: 'AND',
    OR: 'OR',
    NOT: 'NOT'
  }
};
