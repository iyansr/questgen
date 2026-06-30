const LATEX_SYMBOLS: Record<string, string> = {
  '\\Delta': 'Δ',
  '\\delta': 'δ',
  '\\Alpha': 'Α',
  '\\alpha': 'α',
  '\\Beta': 'Β',
  '\\beta': 'β',
  '\\Gamma': 'Γ',
  '\\gamma': 'γ',
  '\\Theta': 'Θ',
  '\\theta': 'θ',
  '\\Lambda': 'Λ',
  '\\lambda': 'λ',
  '\\Pi': 'Π',
  '\\pi': 'π',
  '\\Sigma': 'Σ',
  '\\sigma': 'σ',
  '\\Omega': 'Ω',
  '\\omega': 'ω',
  '\\mu': 'μ',
  '\\phi': 'φ',
  '\\Phi': 'Φ',
  '\\rho': 'ρ',
  '\\tau': 'τ',
  '\\epsilon': 'ε',
  '\\varepsilon': 'ε',
  '\\eta': 'η',
  '\\kappa': 'κ',
  '\\nu': 'ν',
  '\\xi': 'ξ',
  '\\psi': 'ψ',
  '\\chi': 'χ',
  '\\infty': '∞',
  '\\pm': '±',
  '\\mp': '∓',
  '\\times': '×',
  '\\cdot': '·',
  '\\div': '÷',
  '\\leq': '≤',
  '\\geq': '≥',
  '\\neq': '≠',
  '\\approx': '≈',
  '\\equiv': '≡',
  '\\propto': '∝',
  '\\rightarrow': '→',
  '\\leftarrow': '←',
  '\\Rightarrow': '⇒',
  '\\Leftarrow': '⇐',
  '\\leftrightarrow': '↔',
  '\\sum': '∑',
  '\\int': '∫',
  '\\partial': '∂',
  '\\nabla': '∇',
  '\\sqrt': '√',
  '\\degree': '°',
  '\\circ': '°',
};

const LATEX_COMMANDS_SORTED = Object.keys(LATEX_SYMBOLS).sort(
  (a, b) => b.length - a.length,
);

export function latexToUnicode(latex: string): string {
  let result = latex;

  for (const command of LATEX_COMMANDS_SORTED) {
    result = result.split(command).join(LATEX_SYMBOLS[command] ?? '');
  }

  return result
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]*)\}/g, '√($1)')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
