/**
 * ============================================================================
 * MODULE: AST / Token-Based Source Code Similarity & Academic Integrity Engine
 * DIRECTORY: src/utils/codeSimilarity.js
 * ROLE/SCOPE: Faculty Grading Desk & Plagiarism Detection
 * DESCRIPTION:
 *   Evaluates academic integrity across student programming submissions.
 *   Performs lexical tokenization, comment stripping, identifier normalization
 *   (variable renaming resistance), 3-gram extraction, and calculates Jaccard
 *   similarity coefficients with risk tier categorization (LOW/MODERATE/CRITICAL).
 *
 * SECTION INDEX:
 *   1. RESERVED KEYWORDS & LANGUAGE DICTIONARIES
 *   2. LEXICAL TOKENIZER & IDENTIFIER NORMALIZER (tokenizeCode)
 *   3. N-GRAM GENERATION UTILITY (generateNGrams)
 *   4. SUBMISSION COMPARATOR & JACCARD SIMILARITY (compareSubmissions)
 *   5. BENCHMARK STUDENT CODE TEST CORPUS (SAMPLE_STUDENT_CODE_CORPUS)
 * ============================================================================
 */

// ============================================================================
// SECTION 1: RESERVED KEYWORDS & LANGUAGE DICTIONARIES
// ============================================================================
const KEYWORDS = new Set([
  'function', 'return', 'const', 'let', 'var', 'if', 'else', 'for', 'while',
  'import', 'from', 'export', 'default', 'class', 'extends', 'new', 'try',
  'catch', 'finally', 'async', 'await', 'def', 'defval', 'switch', 'case',
  'break', 'continue', 'public', 'private', 'protected', 'void', 'int', 'float',
]);

// ============================================================================
// SECTION 2: LEXICAL TOKENIZER & IDENTIFIER NORMALIZER
// ============================================================================
/**
 * Tokenizes raw source code by stripping comments, normalizing literals,
 * and mapping local identifiers to positional tokens (VAR_1, VAR_2) to defeat
 * variable-renaming evasion techniques.
 *
 * @param {string} codeString - Raw source code submitted by student.
 * @returns {string[]} Array of normalized lexical tokens.
 */
export function tokenizeCode(codeString) {
  if (!codeString || typeof codeString !== 'string') return [];

  // Step 1: Strip block comments and line comments safely (F-08 Remediation)
  let cleaned = codeString
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\r\n]*/g, ' ')
    .replace(/#[^\r\n]*/g, ' ')
    .replace(/""".*?"""/gs, ' ')
    .replace(/'''.*?'''/gs, ' ');

  // Step 2: Normalize string literals
  cleaned = cleaned.replace(/(["'])(?:(?=(\\?))\2[\s\S])*?\1/g, ' STR_LITERAL ');

  // Step 3: Normalize numeric literals
  cleaned = cleaned.replace(/\b\d+(\.\d+)?\b/g, ' NUM_LITERAL ');

  // Step 4: Tokenize into words, compound operators, and symbols (F-08 single-line resistance)
  const rawTokens = cleaned.match(/[a-zA-Z_]\w*|===|!==|==|!=|<=|>=|&&|\|\||\+\+|--|\+=|-=|\*=|\/=|=>|[{}()[\];,.<>!=+\-*/%&|^~]/g) || [];

  // Step 5: Identifier normalization map
  const identMap = new Map();
  let varCounter = 1;

  const normalizedTokens = rawTokens.map((tok) => {
    if (KEYWORDS.has(tok.toLowerCase())) return tok.toUpperCase();
    if (tok === 'STR_LITERAL' || tok === 'NUM_LITERAL') return tok;
    if (/^[a-zA-Z_]\w*$/.test(tok)) {
      const lower = tok.toLowerCase();
      if (!identMap.has(lower)) {
        identMap.set(lower, `VAR_${varCounter++}`);
      }
      return identMap.get(lower);
    }
    return tok;
  });

  return normalizedTokens;
}

// ============================================================================
// SECTION 3: N-GRAM GENERATION UTILITY
// ============================================================================
/**
 * Generates sliding window n-grams across an ordered token sequence.
 * Safely returns empty set for empty token sequences (F-08 Remediation).
 *
 * @param {string[]} tokens - Array of normalized tokens.
 * @param {number} n - Gram window size (defaults to 3-grams).
 * @returns {Set<string>} Unique n-gram string set.
 */
export function generateNGrams(tokens, n = 3) {
  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) return new Set();
  if (tokens.length < n) return new Set([tokens.join(' ')]);
  const ngrams = new Set();
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

// ============================================================================
// SECTION 4: SUBMISSION COMPARATOR & JACCARD SIMILARITY
// ============================================================================
/**
 * Calculates the Jaccard similarity coefficient between two source submissions
 * based on tokenized 3-gram intersections over unions.
 *
 * @param {string} codeA - Base submission code.
 * @param {string} codeB - Target submission code to evaluate against.
 * @returns {{ similarityScore: number, riskTier: string, matchedTokens: number, tokensCountA: number, tokensCountB: number, sampleTokensA: string[], sampleTokensB: string[] }}
 */
export function compareSubmissions(codeA = '', codeB = '') {
  const tokensA = tokenizeCode(codeA);
  const tokensB = tokenizeCode(codeB);

  if (tokensA.length === 0 || tokensB.length === 0) {
    return {
      similarityScore: 0,
      riskTier: 'LOW',
      matchedTokens: 0,
      tokensCountA: tokensA.length,
      tokensCountB: tokensB.length,
      sampleTokensA: tokensA.slice(0, 20),
      sampleTokensB: tokensB.slice(0, 20),
    };
  }

  const ngramsA = generateNGrams(tokensA, 3);
  const ngramsB = generateNGrams(tokensB, 3);

  let intersectionCount = 0;
  ngramsA.forEach((gram) => {
    if (ngramsB.has(gram)) intersectionCount++;
  });

  const unionCount = ngramsA.size + ngramsB.size - intersectionCount;
  const rawScore = unionCount > 0 ? (intersectionCount / unionCount) * 100 : 0;
  const similarityScore = Math.min(100, Math.round(rawScore * 10) / 10);

  let riskTier = 'LOW';
  if (similarityScore >= 75) {
    riskTier = 'CRITICAL';
  } else if (similarityScore >= 45) {
    riskTier = 'MODERATE';
  }

  return {
    similarityScore,
    riskTier,
    matchedTokens: intersectionCount,
    tokensCountA: tokensA.length,
    tokensCountB: tokensB.length,
    sampleTokensA: tokensA.slice(0, 24),
    sampleTokensB: tokensB.slice(0, 24),
  };
}

// ============================================================================
// SECTION 5: BENCHMARK STUDENT CODE TEST CORPUS
// ============================================================================
// Sample comparison corpus for testing and interactive grading demo
export const SAMPLE_STUDENT_CODE_CORPUS = {
  'st-101': {
    studentName: 'Alex Rivera',
    studentId: '2023-88129',
    taskTitle: 'Lab 4: Database Index B-Tree Algorithm',
    code: `
// B-Tree Node Implementation for CC105 Lab
function searchNode(root, targetKey) {
  let currentIndex = 0;
  while (currentIndex < root.keys.length && targetKey > root.keys[currentIndex]) {
    currentIndex++;
  }
  if (currentIndex < root.keys.length && targetKey === root.keys[currentIndex]) {
    return { found: true, node: root, index: currentIndex };
  }
  if (root.isLeaf) {
    return { found: false };
  }
  return searchNode(root.children[currentIndex], targetKey);
}
    `,
  },
  'st-102': {
    studentName: 'Beatriz Santos',
    studentId: '2023-90451',
    taskTitle: 'Lab 4: Database Index B-Tree Algorithm',
    code: `
// B-Tree search implementation
function searchNode(nodeRoot, lookupKey) {
  let idx = 0;
  while (idx < nodeRoot.keys.length && lookupKey > nodeRoot.keys[idx]) {
    idx++;
  }
  if (idx < nodeRoot.keys.length && lookupKey === nodeRoot.keys[idx]) {
    return { found: true, node: nodeRoot, index: idx };
  }
  if (nodeRoot.isLeaf) {
    return { found: false };
  }
  return searchNode(nodeRoot.children[idx], lookupKey);
}
    `,
  },
  'st-103': {
    studentName: 'Christian Garcia',
    studentId: '2023-77402',
    taskTitle: 'Lab 4: Database Index B-Tree Algorithm',
    code: `
// Binary Search Tree Alternative Implementation
class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
  
  insert(val) {
    if (val < this.value) {
      if (!this.left) this.left = new TreeNode(val);
      else this.left.insert(val);
    } else {
      if (!this.right) this.right = new TreeNode(val);
      else this.right.insert(val);
    }
  }
}
    `,
  },
};
