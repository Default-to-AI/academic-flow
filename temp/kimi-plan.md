## הבעיה העיקרית: Over-generation של כותרות

**במסמך המקורי** (10 עמודים PDF):
- עמוד 1: כותרת "רציפות ואי רציפות" + תיאור כללי + משפט
- עמוד 2: גרפים של סוגי אי-רציפות
- עמוד 3: דוגמה אחת של פונקציה מפוצלת עם פתרון
- עמוד 4-5: עוד דוגמאות
- עמוד 6-8: תרגיל מספר 3 עם פתרון
- עמוד 9: 4 תרגילים לפתרון עצמי
- עמוד 10: ריק

**בפלט של Gemini** (127 עמודים!):
- כל מילה שנראית כמו "כותרת פוטנציאלית" הפכה ל-H2
- "ימין", "שמאל", "פתרון", "דוגמה" — כל אלה הפכו לכותרות נפרדות
- התוצאה: פיצול מוגזם של תוכן לסעיפים קטנטנים

## הבעיה בקוד: `sourceOutline.js`

בקומיט `0d2a26e` שינית את `sourceOutline.js` להיות **גנרי** — הוא כבר לא מחפש כותרות ספציפיות כמו "דוגמה" או "פתרון". במקום זה הוא משתמש ב-heuristic שמחשב ניקוד לכל שורה:

```javascript
function scoreHeadingCandidate(text) {
  let score = 0
  if (text.length >= 10 && text.length <= 80) score += 1
  if (text.length >= 15 && text.length <= 60) score += 2
  if (/^\d+[.)\s]/.test(text)) score += 2  // מספור כמו "1." או "2)"
  if (/[א-ת]/.test(text) && text.length <= 40) score += 1
  if (!/[.!?;:]/.test(text)) score += 1
  if (text.split(' ').length <= 6) score += 1
  if (text.split(' ').length <= 4) score += 1
  if (/[.)\s]$/.test(text)) score -= 2
  // ...
  return score
}
```

**הבעיה:** ה-heuristic הזה מחשב ניקוד **גבוה מדי** לשורות קצרות בעברית. למשל:
- "ימין" (4 אותיות) → `length <= 40` (+1), `<= 4` מילים (+1), אין סימני פיסוק (+1), אין נקודה בסוף (+0) → **score = 3**
- "פתרון" (5 אותיות) → דומה → **score = 3**
- "דוגמה" → **score = 3**

הסף הוא `score < 4`, אז כל אלה עוברים!

## למה זה קורה

1. **PDF → Text extraction** מפיק שורות קצרות כי הטקסט בעברית מעוצב עם רווחים גדולים ב-PDF
2. **ה-heuristic לא מבין הקשר** — הוא לא יודע ש"ימין" זה רק מילה בתוך משפט, לא כותרת
3. **Gemini מקבל outline עם יותר מדי items** ומייצר לכל אחד section נפרד
4. **כל section מקבל "דוגמה" + "נפוצות טעויות" + "פתרון"** — וזה מכפיל את התוכן

## הפתרון המיידי

צריך **להחמיר את ה-heuristic** ולהוסיף בדיקות הקשר:

### 1. הוסף blacklist של מילים שלא יכולות להיות כותרות

```javascript
const NON_HEADING_WORDS = new Set([
  'ימין', 'שמאל', 'לכן', 'אבל', 'או', 'וגם', 'כי', 'אם',
  'פתרון', 'דוגמה', 'הוכחה', 'בדיקה', 'חישוב', 'מסקנה',
  'שלב', 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי',
  'עבור', 'כאשר', 'נציב', 'נקבל', 'למשל'
])
```

### 2. הוסף בדיקת "האם זה משפט שלם"

```javascript
function looksLikeCompleteSentence(text) {
  // משפט שלם יש בו לפחות 3-4 מילים ופועל
  const words = text.split(/\s+/)
  if (words.length < 3) return false
  // בדוק אם יש מילה שמתחילה ב-א/ה/ו/ש/ב/ל/כ/מ (תחיליות בעברית)
  // או פועל בצורת ציווי/עבר
  return true
}
```

### 3. הוסף בדיקת "האם יש continuation"

```javascript
function isFollowedByContent(lines, index) {
  // בדוק אם השורה הבאה ממשיכה את אותו רעיון
  const nextLine = lines[index + 1]
  if (!nextLine) return false
  // אם השורה הבאה מתחילה באותה מילה או ממשיכה משפט...
  return nextLine.startsWith(text.slice(0, 3)) || 
         nextLine.length > text.length * 2
}
```

### 4. העלה את הסף ודרוש יותר תנאים

```javascript
const HEADING_SCORE_THRESHOLD = 6  // במקום 4

// או עודף דרישה:
if (score < HEADING_SCORE_THRESHOLD) return
if (NON_HEADING_WORDS.has(text.trim())) return
if (!looksLikeCompleteSentence(text)) return
```

## הבעיה השנייה: יותר מדי עמודים

המסמך המקורי הוא 10 עמודים, הפלט הוא 127. זה לא רק בגלל הכותרות — זה גם בגלל ש:

1. **כל section מקבל template מלא** (דוגמה + נפוצות טעויות + פתרון)
2. **ה-template מכפיל תוכן** — למשל, אותה דוגמה מופיעה פעמיים
3. **אין deduplication** — אותו תרגיל מופיע ב-sections שונים

## המלצה מיידית לשינוי בקוד

ב-`sourceOutline.js`, החלף את `scoreHeadingCandidate` בגרסה מחמירה:

```javascript
const STOP_WORDS = new Set([
  'ימין', 'שמאל', 'לכן', 'אבל', 'או', 'וגם', 'כי', 'אם', 'שלא',
  'פתרון', 'דוגמה', 'הוכחה', 'בדיקה', 'חישוב', 'מסקנה', 'שלב',
  'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי',
  'עבור', 'כאשר', 'נציב', 'נקבל', 'למשל', 'כלומר', 'כגון',
  'עמוד', 'הבא', 'הקודם', 'המשך', 'סוף', 'תחילת'
])

function scoreHeadingCandidate(text, prevLine, nextLine) {
  const trimmed = text.trim()
  
  // דחה מילים בודדות מ-blacklist
  if (STOP_WORDS.has(trimmed)) return 0
  
  // דחה שורות קצרות מדי
  if (trimmed.length < 15) return 0
  
  // דחה אם השורה הבאה ממשיכה את אותו משפט
  if (nextLine && nextLine.startsWith(trimmed.slice(0, 5))) return 0
  
  let score = 0
  if (trimmed.length >= 20 && trimmed.length <= 80) score += 2
  if (/^\d+[.)\s]/.test(trimmed)) score += 3  // מספור ברור
  if (/^#/.test(trimmed)) score += 3  // Markdown heading
  if (/[א-ת]/.test(trimmed) && trimmed.length >= 30) score += 1
  if (trimmed.split(' ').length >= 4 && trimmed.split(' ').length <= 10) score += 1
  if (/[:.!?]$/.test(trimmed)) score -= 1  // משפט שלם עם סימן פיסוק בסוף
  
  return score
}
```

וכן להוסיף **deduplication** אחרי buildSourceOutline:

```javascript
function deduplicateHeadings(outline) {
  const seen = new Set()
  return outline.filter(item => {
    const key = item.text.slice(0, 20) // 20 תווים ראשונים
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
```