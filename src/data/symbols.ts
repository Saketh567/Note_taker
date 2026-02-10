export interface Symbol {
  char: string;
  name: string;
  shortcut?: string;
}

export type SymbolCategory = 'math' | 'chemistry' | 'code' | 'language' | 'greek' | 'recent';

export const SYMBOLS: Record<Exclude<SymbolCategory, 'recent'>, Symbol[]> = {
  math: [
    { char: '∫', name: 'integral', shortcut: 'int' },
    { char: '∑', name: 'sum', shortcut: 'sum' },
    { char: '∏', name: 'product', shortcut: 'prod' },
    { char: '√', name: 'square root', shortcut: 'sqrt' },
    { char: '∛', name: 'cube root', shortcut: 'cbrt' },
    { char: '∞', name: 'infinity', shortcut: 'inf' },
    { char: '≈', name: 'approximately equal', shortcut: '~=' },
    { char: '≠', name: 'not equal', shortcut: '!=' },
    { char: '≤', name: 'less than or equal', shortcut: '<=' },
    { char: '≥', name: 'greater than or equal', shortcut: '>=' },
    { char: '±', name: 'plus minus', shortcut: '+/-' },
    { char: '÷', name: 'division', shortcut: 'div' },
    { char: '×', name: 'multiplication', shortcut: 'times' },
    { char: '∂', name: 'partial derivative', shortcut: 'partial' },
    { char: '∇', name: 'nabla', shortcut: 'nabla' },
    { char: '∆', name: 'delta', shortcut: 'delta' },
    { char: '∈', name: 'element of', shortcut: 'in' },
    { char: '∉', name: 'not element of', shortcut: 'notin' },
    { char: '⊂', name: 'subset of', shortcut: 'subset' },
    { char: '∪', name: 'union', shortcut: 'union' },
    { char: '∩', name: 'intersection', shortcut: 'inter' },
    { char: '∅', name: 'empty set', shortcut: 'empty' },
    { char: '∀', name: 'for all', shortcut: 'forall' },
    { char: '∃', name: 'exists', shortcut: 'exists' },
    { char: '∴', name: 'therefore', shortcut: 'therefore' },
    { char: '∵', name: 'because', shortcut: 'because' },
    { char: '°', name: 'degree', shortcut: 'deg' },
    { char: '′', name: 'prime', shortcut: "'" },
    { char: '″', name: 'double prime', shortcut: "''" },
    { char: 'π', name: 'pi', shortcut: 'pi' },
    { char: 'θ', name: 'theta', shortcut: 'theta' },
    { char: 'φ', name: 'phi', shortcut: 'phi' },
    { char: '½', name: 'one half', shortcut: '1/2' },
    { char: '¼', name: 'one quarter', shortcut: '1/4' },
    { char: '¾', name: 'three quarters', shortcut: '3/4' },
    { char: '¹', name: 'superscript 1', shortcut: '^1' },
    { char: '²', name: 'superscript 2', shortcut: '^2' },
    { char: '³', name: 'superscript 3', shortcut: '^3' },
    { char: '⁰', name: 'superscript 0', shortcut: '^0' },
    { char: 'ⁿ', name: 'superscript n', shortcut: '^n' },
  ],
  chemistry: [
    { char: '→', name: 'reaction arrow', shortcut: '->' },
    { char: '⇌', name: 'equilibrium', shortcut: '<=>' },
    { char: '↑', name: 'gas evolved', shortcut: 'up' },
    { char: '↓', name: 'precipitate', shortcut: 'down' },
    { char: '°C', name: 'celsius', shortcut: 'degC' },
    { char: '°F', name: 'fahrenheit', shortcut: 'degF' },
    { char: 'K', name: 'kelvin', shortcut: 'K' },
    { char: 'mol', name: 'mole', shortcut: 'mol' },
    { char: 'M', name: 'molar', shortcut: 'M' },
    { char: 'g', name: 'grams', shortcut: 'g' },
    { char: 'mg', name: 'milligrams', shortcut: 'mg' },
    { char: 'L', name: 'liters', shortcut: 'L' },
    { char: 'mL', name: 'milliliters', shortcut: 'mL' },
    { char: 'μL', name: 'microliters', shortcut: 'uL' },
    { char: 'pH', name: 'pH', shortcut: 'pH' },
    { char: 'pKa', name: 'pKa', shortcut: 'pKa' },
    { char: 'Δ', name: 'delta/change', shortcut: 'delta' },
    { char: 'δ', name: 'partial charge', shortcut: 'partial' },
    { char: 'α', name: 'alpha', shortcut: 'alpha' },
    { char: 'β', name: 'beta', shortcut: 'beta' },
    { char: 'γ', name: 'gamma', shortcut: 'gamma' },
    { char: 'λ', name: 'wavelength', shortcut: 'lambda' },
    { char: 'Å', name: 'angstrom', shortcut: 'ang' },
    { char: '⁺', name: 'positive charge', shortcut: '+' },
    { char: '⁻', name: 'negative charge', shortcut: '-' },
    { char: '⁰', name: 'neutral', shortcut: '0' },
    { char: '₁', name: 'subscript 1', shortcut: '_1' },
    { char: '₂', name: 'subscript 2', shortcut: '_2' },
    { char: '₃', name: 'subscript 3', shortcut: '_3' },
    { char: '₄', name: 'subscript 4', shortcut: '_4' },
    { char: '₅', name: 'subscript 5', shortcut: '_5' },
    { char: 'ₐ', name: 'subscript a', shortcut: '_a' },
  ],
  code: [
    { char: '```', name: 'code block', shortcut: '```' },
    { char: '=>', name: 'arrow function', shortcut: '=>' },
    { char: '!=', name: 'not equal', shortcut: '!=' },
    { char: '!==', name: 'strict not equal', shortcut: '!==' },
    { char: '==', name: 'equal', shortcut: '==' },
    { char: '===', name: 'strict equal', shortcut: '===' },
    { char: '>=', name: 'greater equal', shortcut: '>=' },
    { char: '<=', name: 'less equal', shortcut: '<=' },
    { char: '&&', name: 'logical and', shortcut: '&&' },
    { char: '||', name: 'logical or', shortcut: '||' },
    { char: '??', name: 'nullish coalescing', shortcut: '??' },
    { char: '?.', name: 'optional chaining', shortcut: '?.' },
    { char: '...', name: 'spread operator', shortcut: '...' },
    { char: '/**/', name: 'block comment', shortcut: '/**/' },
    { char: '//', name: 'line comment', shortcut: '//' },
    { char: '# ', name: 'markdown heading', shortcut: '# ' },
    { char: '- ', name: 'markdown list', shortcut: '- ' },
    { char: '* ', name: 'markdown bullet', shortcut: '* ' },
    { char: '> ', name: 'markdown quote', shortcut: '> ' },
    { char: '[ ]', name: 'checkbox unchecked', shortcut: '[ ]' },
    { char: '[x]', name: 'checkbox checked', shortcut: '[x]' },
    { char: '|', name: 'pipe', shortcut: '|' },
    { char: '~', name: 'tilde', shortcut: '~' },
    { char: '`', name: 'backtick', shortcut: '`' },
    { char: '←', name: 'left arrow', shortcut: '<-' },
    { char: '→', name: 'right arrow', shortcut: '->' },
    { char: '↔', name: 'left right arrow', shortcut: '<->' },
    { char: '⚠', name: 'warning', shortcut: 'warn' },
    { char: '✓', name: 'check', shortcut: 'ok' },
    { char: '✗', name: 'cross', shortcut: 'x' },
    { char: '→', name: 'implies', shortcut: 'implies' },
    { char: '↦', name: 'maps to', shortcut: '|->' },
    { char: '∘', name: 'compose', shortcut: 'compose' },
    { char: '⊕', name: 'xor', shortcut: 'xor' },
    { char: '⊗', name: 'tensor', shortcut: 'tensor' },
  ],
  language: [
    { char: 'é', name: 'e acute', shortcut: "e'" },
    { char: 'è', name: 'e grave', shortcut: 'e`' },
    { char: 'ê', name: 'e circumflex', shortcut: 'e^' },
    { char: 'ë', name: 'e diaeresis', shortcut: 'e"' },
    { char: 'à', name: 'a grave', shortcut: 'a`' },
    { char: 'â', name: 'a circumflex', shortcut: 'a^' },
    { char: 'ä', name: 'a diaeresis', shortcut: 'a"' },
    { char: 'å', name: 'a ring', shortcut: 'aa' },
    { char: 'æ', name: 'ae ligature', shortcut: 'ae' },
    { char: 'ç', name: 'c cedilla', shortcut: 'c,' },
    { char: 'ï', name: 'i diaeresis', shortcut: 'i"' },
    { char: 'î', name: 'i circumflex', shortcut: 'i^' },
    { char: 'ô', name: 'o circumflex', shortcut: 'o^' },
    { char: 'ö', name: 'o diaeresis', shortcut: 'o"' },
    { char: 'œ', name: 'oe ligature', shortcut: 'oe' },
    { char: 'ù', name: 'u grave', shortcut: 'u`' },
    { char: 'û', name: 'u circumflex', shortcut: 'u^' },
    { char: 'ü', name: 'u diaeresis', shortcut: 'u"' },
    { char: 'ÿ', name: 'y diaeresis', shortcut: 'y"' },
    { char: 'ñ', name: 'n tilde', shortcut: 'n~' },
    { char: 'ß', name: 'eszett', shortcut: 'ss' },
    { char: '¡', name: 'inverted exclamation', shortcut: '!i' },
    { char: '¿', name: 'inverted question', shortcut: '?i' },
    { char: '«', name: 'left guillemet', shortcut: '<<' },
    { char: '»', name: 'right guillemet', shortcut: '>>' },
    { char: '€', name: 'euro', shortcut: 'EUR' },
    { char: '£', name: 'pound', shortcut: 'GBP' },
    { char: '¥', name: 'yen', shortcut: 'JPY' },
    { char: '©', name: 'copyright', shortcut: '(c)' },
    { char: '®', name: 'registered', shortcut: '(r)' },
    { char: '™', name: 'trademark', shortcut: 'TM' },
    { char: '§', name: 'section', shortcut: 'SS' },
    { char: '¶', name: 'paragraph', shortcut: 'P' },
    { char: '•', name: 'bullet', shortcut: 'bullet' },
    { char: '…', name: 'ellipsis', shortcut: '...' },
    { char: '–', name: 'en dash', shortcut: '--' },
    { char: '—', name: 'em dash', shortcut: '---' },
    { char: '\u2018', name: 'left single quote', shortcut: "lsquo" },
    { char: '\u2019', name: 'right single quote', shortcut: "rsquo" },
    { char: '\u201C', name: 'left double quote', shortcut: "ldquo" },
    { char: '\u201D', name: 'right double quote', shortcut: "rdquo" },
  ],
  greek: [
    { char: 'α', name: 'alpha', shortcut: 'alpha' },
    { char: 'β', name: 'beta', shortcut: 'beta' },
    { char: 'γ', name: 'gamma', shortcut: 'gamma' },
    { char: 'δ', name: 'delta', shortcut: 'delta' },
    { char: 'ε', name: 'epsilon', shortcut: 'epsilon' },
    { char: 'ζ', name: 'zeta', shortcut: 'zeta' },
    { char: 'η', name: 'eta', shortcut: 'eta' },
    { char: 'θ', name: 'theta', shortcut: 'theta' },
    { char: 'ι', name: 'iota', shortcut: 'iota' },
    { char: 'κ', name: 'kappa', shortcut: 'kappa' },
    { char: 'λ', name: 'lambda', shortcut: 'lambda' },
    { char: 'μ', name: 'mu', shortcut: 'mu' },
    { char: 'ν', name: 'nu', shortcut: 'nu' },
    { char: 'ξ', name: 'xi', shortcut: 'xi' },
    { char: 'ο', name: 'omicron', shortcut: 'omicron' },
    { char: 'π', name: 'pi', shortcut: 'pi' },
    { char: 'ρ', name: 'rho', shortcut: 'rho' },
    { char: 'σ', name: 'sigma', shortcut: 'sigma' },
    { char: 'ς', name: 'final sigma', shortcut: 'sigmaf' },
    { char: 'τ', name: 'tau', shortcut: 'tau' },
    { char: 'υ', name: 'upsilon', shortcut: 'upsilon' },
    { char: 'φ', name: 'phi', shortcut: 'phi' },
    { char: 'χ', name: 'chi', shortcut: 'chi' },
    { char: 'ψ', name: 'psi', shortcut: 'psi' },
    { char: 'ω', name: 'omega', shortcut: 'omega' },
    { char: 'Γ', name: 'Gamma', shortcut: 'Gamma' },
    { char: 'Δ', name: 'Delta', shortcut: 'Delta' },
    { char: 'Θ', name: 'Theta', shortcut: 'Theta' },
    { char: 'Λ', name: 'Lambda', shortcut: 'Lambda' },
    { char: 'Ξ', name: 'Xi', shortcut: 'Xi' },
    { char: 'Π', name: 'Pi', shortcut: 'Pi' },
    { char: 'Σ', name: 'Sigma', shortcut: 'Sigma' },
    { char: 'Φ', name: 'Phi', shortcut: 'Phi' },
    { char: 'Ψ', name: 'Psi', shortcut: 'Psi' },
    { char: 'Ω', name: 'Omega', shortcut: 'Omega' },
  ],
};

// Get all symbols for search
export const getAllSymbols = (): Symbol[] => {
  return Object.values(SYMBOLS).flat();
};

// Search symbols by name or shortcut
export const searchSymbols = (query: string): Symbol[] => {
  const lowerQuery = query.toLowerCase();
  return getAllSymbols().filter(
    (s) =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.shortcut?.toLowerCase().includes(lowerQuery)
  );
};

// Get recent symbols from localStorage
const RECENT_SYMBOLS_KEY = 'note-taker-recent-symbols';
const MAX_RECENT = 10;

export const getRecentSymbols = (): Symbol[] => {
  try {
    const stored = localStorage.getItem(RECENT_SYMBOLS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load recent symbols:', e);
  }
  return [];
};

export const addRecentSymbol = (symbol: Symbol): void => {
  try {
    const recent = getRecentSymbols();
    // Remove if already exists
    const filtered = recent.filter((s) => s.char !== symbol.char);
    // Add to front
    const updated = [symbol, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SYMBOLS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save recent symbol:', e);
  }
};
