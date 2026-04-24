import { auditGeneratedDocument } from './documentAudit'
import { auditMathBlocks } from './mathAudit'
import { createAttemptLog, nowIso } from './pipelineTelemetry'

const MAX_SECTION_ATTEMPTS = 3
const PROTECTED_MATH_PATTERN = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g

function stripMath(text) {
  return (text || '').replace(PROTECTED_MATH_PATTERN, ' ')
}

function hasExcessEnglishProse(section) {
  const plainText = stripMath([section.content, section.common_mistakes, section.example].join('\n'))
  const englishWords = plainText.match(/\b[A-Za-z]{3,}\b/g) || []
  const hebrewWords = plainText.match(/[\u0590-\u05FF]{2,}/g) || []

  return englishWords.length >= 8 && englishWords.length > hebrewWords.length
}

function buildErrorContext(mathAudit, hasEmptyField, languageAuditFailed) {
  const issues = []
  if (hasEmptyField) issues.push('השדה content הוחזר ריק — מלא אותו בטקסט המקור הרלוונטי בלי לסכם')
  if (languageAuditFailed) issues.push('הטקסט חזר ברובו באנגלית — חייב להיות בעברית')
  if (mathAudit?.unbalancedDelimiters) issues.push('תוחמי מתמטיקה לא מאוזנים — ודא שכל $ ו-$$ נסגרים כהלכה')
  if (mathAudit?.rawLatexLeaks?.length) issues.push(`פקודות LaTeX מחוץ לתוחמים: ${mathAudit.rawLatexLeaks.join(', ')} — העבר אותן לתוך $...$`)
  if (mathAudit && !mathAudit.katexPassed) issues.push('נוסחה גורמת לשגיאת KaTeX — בדוק את תחביר ה-LaTeX')
  return issues.length ? issues : null
}

function buildFallbackSection(section, reason) {
  const excerpt = (section.sourceText || '').split('\n').slice(0, 12).join('\n').trim()
  const userMessage = reason === 'language_audit_failed'
    ? 'המערכת זיהתה שהתוכן חזר בשפה או בפורמט לא תקינים.'
    : 'המערכת לא הצליחה לעבד את הסעיף הזה בצורה מלאה.'

  return {
    header: section.heading,
    content: [
      '**שחזור אוטומטי חלקי**',
      `${userMessage} לכן מצורף קטע המקור כפי שחולץ מהקובץ:`,
      excerpt || 'לא חולץ טקסט זמין מהמקור עבור סעיף זה.',
    ].join('\n\n'),
    common_mistakes: 'ייתכן שהסעיף כלל נוסחאות, כיווניות או ניסוח שלא עברו את בדיקות האיכות.',
    example: 'הסעיף הוחזר במצב גיבוי כדי למנוע קריסה של כל המסמך.',
    _fallback: true,
  }
}

function summarizeDocumentMath(sections) {
  const aggregate = {
    unbalancedDelimiters: false,
    rawLatexLeaks: [],
    katexPassed: true,
    passed: true,
    fallbackSections: 0,
  }

  for (const section of sections) {
    const audit = auditMathBlocks([section.content, section.common_mistakes, section.example].join('\n'))
    aggregate.unbalancedDelimiters ||= audit.unbalancedDelimiters
    aggregate.katexPassed &&= audit.katexPassed
    aggregate.rawLatexLeaks.push(...audit.rawLatexLeaks)
    if (section._fallback) aggregate.fallbackSections += 1
  }

  aggregate.rawLatexLeaks = [...new Set(aggregate.rawLatexLeaks)]
  aggregate.passed =
    !aggregate.unbalancedDelimiters &&
    aggregate.rawLatexLeaks.length === 0 &&
    aggregate.katexPassed &&
    aggregate.fallbackSections === 0

  return aggregate
}

export async function processSections({ sections, generateSection, onStatus = () => {} }) {
  const output = []

  for (const section of sections) {
    let success = null
    let lastReason = 'unknown_failure'
    let lastErrorContext = null

    for (let attempt = 1; attempt <= MAX_SECTION_ATTEMPTS; attempt += 1) {
      onStatus(createAttemptLog({
        attempt,
        maxAttempts: MAX_SECTION_ATTEMPTS,
        timestamp: nowIso(),
        status: `section:${section.heading}:request_sent`,
      }))

      try {
        const candidate = await generateSection(section, attempt, lastErrorContext)
        const mathAudit = auditMathBlocks([candidate.content, candidate.common_mistakes, candidate.example].join('\n'))
        const hasEmptyField = !(candidate.content || '').trim()
        const languageAuditFailed = hasExcessEnglishProse(candidate)

        if (mathAudit.passed && !hasEmptyField && !languageAuditFailed) {
          success = candidate
          break
        }

        if (hasEmptyField) {
          lastReason = 'empty_block_detected'
        } else if (languageAuditFailed) {
          lastReason = 'language_audit_failed'
        } else {
          lastReason = 'math_audit_failed'
        }

        lastErrorContext = buildErrorContext(mathAudit, hasEmptyField, languageAuditFailed)

        onStatus(createAttemptLog({
          attempt,
          maxAttempts: MAX_SECTION_ATTEMPTS,
          timestamp: nowIso(),
          status: `section:${section.heading}:${lastReason}`,
        }))
      } catch (error) {
        lastErrorContext = null
        lastReason = error?.message || 'request_failed'
        onStatus(createAttemptLog({
          attempt,
          maxAttempts: MAX_SECTION_ATTEMPTS,
          timestamp: nowIso(),
          status: `section:${section.heading}:request_failed`,
        }))
      }
    }

    if (!success) {
      success = buildFallbackSection(section, lastReason)
      onStatus(createAttemptLog({
        attempt: MAX_SECTION_ATTEMPTS,
        maxAttempts: MAX_SECTION_ATTEMPTS,
        timestamp: nowIso(),
        status: `section:${section.heading}:fallback_applied`,
      }))
    }

    output.push(success)
  }

  return output
}

export function auditPipelineOutput({ outline, generated }) {
  const documentAudit = auditGeneratedDocument({ outline, generated })
  const mathAudit = summarizeDocumentMath(generated.sections || [])

  return {
    ...documentAudit,
    ...mathAudit,
    passed: documentAudit.passed && mathAudit.passed,
  }
}

export function buildProcessingState({ attempts, audit }) {
  return {
    attempts,
    auditSummary: [
      `Missing headers: ${audit.missingHeaders?.length || 0}`,
      `Unexpected headers: ${audit.unexpectedHeaders?.length || 0}`,
      `Empty blocks: ${audit.emptyBlocks?.length || 0}`,
      `Raw LaTeX leaks: ${audit.rawLatexLeaks?.length || 0}`,
      `Fallback sections: ${audit.fallbackSections || 0}`,
    ],
  }
}
