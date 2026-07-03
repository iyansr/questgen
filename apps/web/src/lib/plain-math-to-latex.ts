const EXISTING_MATH_RE = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;

const MATH_STOP_WORD_RE =
  /\s+(dan|atau|menghasilkan|yang|dari|adalah|keduanya|memenuhi|prasyarat)\b/i;

function splitByExistingMath(
  text: string,
): Array<{ math: boolean; value: string }> {
  const parts: Array<{ math: boolean; value: string }> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(EXISTING_MATH_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ math: false, value: text.slice(lastIndex, index) });
    }
    parts.push({ math: true, value: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ math: false, value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ math: false, value: text }];
}

function replaceSqrtCalls(text: string): string {
  const lower = text.toLowerCase();
  let result = '';
  let i = 0;

  while (i < text.length) {
    if (lower.startsWith('sqrt', i)) {
      let j = i + 4;
      while (j < text.length && text[j] === ' ') j++;

      if (text[j] === '(') {
        let depth = 0;
        let k = j;
        while (k < text.length) {
          if (text[k] === '(') depth++;
          else if (text[k] === ')') {
            depth--;
            if (depth === 0) break;
          }
          k++;
        }

        if (depth === 0) {
          const inner = text.slice(j + 1, k);
          result += `\\sqrt{${inner}}`;
          i = k + 1;
          continue;
        }
      }
    }

    result += text[i];
    i++;
  }

  return result;
}

function replaceOperators(text: string): string {
  return text
    .replace(/<=/g, '\\leq')
    .replace(/>=/g, '\\geq')
    .replace(/!=/g, '\\neq')
    .replace(/->/g, '\\rightarrow')
    .replace(/→/g, '\\rightarrow');
}

function escapeSetBraces(latex: string): string {
  return latex.replace(/\{([^}]*\|[^}]*)\}/g, (_, inner: string) => {
    return `\\{${inner.replace(/\|/g, '\\mid')}\\}`;
  });
}

function trimMathSpan(span: string): string {
  return span.replace(MATH_STOP_WORD_RE, '').trim();
}

function hasMathSignal(span: string): boolean {
  return /(?:\\sqrt|\^|\\leq|\\geq|\\neq|\\rightarrow)/.test(span);
}

function wrapSqrtChains(text: string): string {
  return text.replace(
    /\\sqrt\{[^}]+\}(?:\s*(?:[=+\-*/]|\\leq|\\geq|\\neq)\s*\\sqrt\{[^}]+\})*/g,
    (match) => `$${escapeSetBraces(trimMathSpan(match))}$`,
  );
}

function wrapSetNotation(text: string): string {
  return text.replace(/\{[^{}]*\|[^{}]*\}/g, (match) => {
    return `$${escapeSetBraces(trimMathSpan(match))}$`;
  });
}

function wrapInequalitiesAndPowers(text: string): string {
  return text.replace(
    /(?<!\\)(?:\\sqrt\{[^}]+\}|[a-zA-Z0-9({][a-zA-Z0-9()+\-*/^|{}.,\\]*(?:\\leq|\\geq|\\neq|\\rightarrow|\^)\s*[a-zA-Z0-9()+\-*/^|{}.,\\]*)/g,
    (match) => {
      const trimmed = trimMathSpan(match);
      if (!hasMathSignal(trimmed)) return match;
      return `$${escapeSetBraces(trimmed)}$`;
    },
  );
}

function wrapMathSpans(text: string): string {
  return splitByExistingMath(text)
    .map((part) => {
      if (part.math) return part.value;
      let segment = wrapSqrtChains(part.value);
      segment = splitByExistingMath(segment)
        .map((p) => (p.math ? p.value : wrapSetNotation(p.value)))
        .join('');
      segment = splitByExistingMath(segment)
        .map((p) => (p.math ? p.value : wrapInequalitiesAndPowers(p.value)))
        .join('');
      return segment;
    })
    .join('');
}

function normalizePlainSegment(text: string): string {
  let segment = replaceSqrtCalls(text);
  segment = replaceOperators(segment);
  segment = wrapMathSpans(segment);
  return segment;
}

/** Convert AI plain-text math (sqrt, <=, ^) into remark-math $...$ LaTeX spans. */
export function plainMathToLatex(text: string): string {
  return splitByExistingMath(text)
    .map((part) => (part.math ? part.value : normalizePlainSegment(part.value)))
    .join('');
}
