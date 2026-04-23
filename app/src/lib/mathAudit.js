import katex from 'katex'

const PROTECTED_MATH_PATTERN = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g
const RAW_LATEX_PATTERN = /(\\begin\{[a-z*]+\}|\\end\{[a-z*]+\}|\\frac|\\sqrt|\\sum|\\int)/g
const BEGIN_PATTERN = /\\begin\{([a-z*]+)\}/g
const END_PATTERN = /\\end\{([a-z*]+)\}/g

function countToken(text, token) {
  return (text.match(token) || []).length
}

function extractRawLatexLeaks(text) {
  const outsideMath = (text || '').replace(PROTECTED_MATH_PATTERN, ' ')
  return [...new Set(outsideMath.match(RAW_LATEX_PATTERN) || [])]
}

function hasBalancedEnvironmentPairs(text) {
  const beginNames = [...(text.matchAll(BEGIN_PATTERN) || [])].map(match => match[1])
  const endNames = [...(text.matchAll(END_PATTERN) || [])].map(match => match[1])
  if (beginNames.length !== endNames.length) return false
  return beginNames.every((name, index) => endNames[index] === name)
}

function collectProtectedBlocks(text) {
  return text.match(PROTECTED_MATH_PATTERN) || []
}

function runKatexSmokeTest(blocks) {
  for (const block of blocks) {
    const displayMode = block.startsWith('$$')
    const formula = block.slice(displayMode ? 2 : 1, displayMode ? -2 : -1).trim()
    if (!formula) return false
    try {
      katex.renderToString(formula, {
        displayMode,
        output: 'html',
        throwOnError: true,
      })
    } catch {
      return false
    }
  }

  return true
}

export function auditMathBlocks(text) {
  const safeText = text || ''
  const blockDelimiterCount = countToken(safeText, /\$\$/g)
  const totalDollarCount = countToken(safeText, /\$/g)
  const inlineDelimiterCount = totalDollarCount - blockDelimiterCount * 2
  const protectedBlocks = collectProtectedBlocks(safeText)
  const rawLatexLeaks = extractRawLatexLeaks(safeText)
  const balancedDelimiters = blockDelimiterCount % 2 === 0 && inlineDelimiterCount % 2 === 0
  const balancedEnvironments = hasBalancedEnvironmentPairs(safeText)
  const katexPassed = balancedDelimiters && balancedEnvironments && runKatexSmokeTest(protectedBlocks)

  return {
    unbalancedDelimiters: !balancedDelimiters || !balancedEnvironments,
    rawLatexLeaks,
    katexPassed,
    passed: balancedDelimiters && balancedEnvironments && rawLatexLeaks.length === 0 && katexPassed,
  }
}
