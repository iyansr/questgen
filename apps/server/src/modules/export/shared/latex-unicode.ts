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
  '\\le': '≤',
  '\\geq': '≥',
  '\\ge': '≥',
  '\\neq': '≠',
  '\\ne': '≠',
  '\\approx': '≈',
  '\\equiv': '≡',
  '\\propto': '∝',
  '\\rightarrow': '→',
  '\\leftarrow': '←',
  '\\Rightarrow': '⇒',
  '\\Leftarrow': '⇐',
  '\\leftrightarrow': '↔',
  '\\implies': '⟹',
  '\\mid': '∣',
  '\\in': '∈',
  '\\sum': '∑',
  '\\int': '∫',
  '\\partial': '∂',
  '\\nabla': '∇',
  '\\degree': '°',
  '\\circ': '°',
};

const LATEX_COMMANDS_SORTED = Object.keys(LATEX_SYMBOLS).sort(
  (a, b) => b.length - a.length,
);

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
  '+': '⁺',
};

const BLACKBOARD_LETTERS: Record<string, string> = {
  R: 'ℝ',
  N: 'ℕ',
  Z: 'ℤ',
  Q: 'ℚ',
  C: 'ℂ',
};

function toSuperscript(value: string): string {
  return value
    .split('')
    .map((char) => SUPERSCRIPT_DIGITS[char] ?? char)
    .join('');
}

function convertSuperscripts(text: string): string {
  return text
    .replace(/\^\{([^}]*)\}/g, (_, inner: string) => toSuperscript(inner))
    .replace(/\^([0-9+-])/g, (_, char: string) => toSuperscript(char));
}

function convertSubscripts(text: string): string {
  return text
    .replace(/_\{([^}]*)\}/g, (_, inner: string) => `_${inner}`)
    .replace(/_([0-9a-zA-Z])/g, (_, char: string) => `_${char}`);
}

export function latexToUnicode(latex: string): string {
  let result = latex
    .replace(/\\{/g, '{')
    .replace(/\\}/g, '}')
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)')
    .replace(/\\sqrt\[([\s\S]*?)\]\{([^}]*)\}/g, '$1√($2)')
    .replace(/\\sqrt\{([^}]*)\}/g, '√($1)')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\mathbb\{([^}]*)\}/g, (_, letters: string) =>
      letters
        .split('')
        .map((letter) => BLACKBOARD_LETTERS[letter] ?? letter)
        .join(''),
    );

  for (const command of LATEX_COMMANDS_SORTED) {
    result = result.split(command).join(LATEX_SYMBOLS[command] ?? '');
  }

  result = convertSuperscripts(result);
  result = convertSubscripts(result);
  result = result.replace(/\\[a-zA-Z]+/g, '');

  return result.replace(/\s+/g, ' ').trim();
}
