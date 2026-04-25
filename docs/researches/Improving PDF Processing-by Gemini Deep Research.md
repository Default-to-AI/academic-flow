# **אופטימיזציה של פייפליין PDF-to-PDF אקדמי: שילוב עברית (RTL), מתמטיקה (LTR) ו-LaTeX בתהליכי עיבוד מבוססי בינה מלאכולתית**

האתגר המרכזי בעיבוד מסמכים אקדמיים המשלבים עברית ונוסחאות מתמטיות טמון בסתירה המובנית שבין כיווניות הטקסט (RTL) לבין המבנה הלוגי והתחבירי של שפות סימון כגון LaTeX ונוסחאות מתמטיות (LTR). מסמכי PDF, המהווים את הסטנדרט להפצת ידע אקדמי, אינם שומרים על המבנה הסמנטי של הטקסט אלא על המיקום הוויזואלי של הגליפים, עובדה המובילה לכשלים חמורים בעת ניסיון לחלץ מידע בצורה אוטומטית. הדו"ח הנוכחי מנתח את צירי הפעולה הקריטיים לשיפור הפייפליין של זרימה אקדמית (academic-flow), תוך התמקדות בטכנולוגיות ראייה ממוחשבת, הנדסת פרומפטים מורכבת, אכיפת סכמות נתונים דטרמיניסטיות, ופתרונות רינדור מודרניים.

## **עיבוד מקדים של מסמכים וניתוח פריסה (Layout Analysis)**

השלב הראשון והמכריע בשיפור איכות הפלט של מודלי שפה גדולים (LLMs) הוא הדרך שבה המידע מוגש למודל. העברת צילומי מסך גולמיים ל-Gemini או למודלים מולטי-מודאליים אחרים עלולה להוביל לאובדן פרטים קטנים אך קריטיים, במיוחד בנוסחאות מורכבות הכוללות אינדקסים או סמלים יווניים. מחקרים מראים כי שימוש בספריות ייעודיות לחילוץ מבנה אקדמי עדיף משמעותית על גישות OCR מסורתיות.

### **השוואת כלי חילוץ ותשתית עיבוד**

קיימים מספר כלים מובילים המאפשרים חילוץ של כותרות, פסקאות ומשוואות תוך שמירה על ההקשר המבני של המסמך. Docling, שפותח על ידי IBM Research, נחשב לאחד הכלים המאוזנים ביותר, עם דיוק של כ-97.9% בחילוץ טבלאות מורכבות.1 עם זאת, הכלי דורש משאבים משמעותיים, כאשר נפח ההתקנה עולה על 1GB וזמן העיבוד גדל בצורה לינארית עם מספר העמודים.1

לעומתו, MinerU, ובמיוחד גרסת ה-MinerU2.5-Pro, מציע ביצועים הנחשבים כיום ל-State-of-the-Art (SOTA) בתחום ניתוח מסמכים אקדמיים. המודל מצליח להשיג תוצאות גבוהות יותר ממודלים מסחריים כמו Gemini 3 Pro במדדים של ניתוח פריסה (Layout Analysis) וחילוץ נוסחאות דחוסות.3 MinerU פועל בשיטה דו-שלבית: בשלב הראשון הוא מזהה את אזורי העניין (כמו משוואות וטבלאות) וגוזר אותם מהתמונה המקורית, ובשלב השני הוא מעבד אותם ברזולוציה גבוהה, מה שמונע אובדן פרטים האופייני לשיטות עיבוד מקצה לקצה.5

| כלי עיבוד | דיוק חילוץ טבלאות | מהירות עיבוד | תכונות מרכזיות |
| ----: | ----: | ----: | ----: |
| Docling | 97.9% | בינונית (לינארית) | שימוש ב-TableFormer ו-DocLayNet 1 |
| Marker | גבוה (עם LLM) | מהירה מאוד (25 עמ'/שנייה) | תמיכה ב-Gemini כשלב שיפור 6 |
| Unstructured | בינוני (75-100%) | איטית במיוחד | אמינות גבוהה לארגונים 1 |
| MinerU | 95.69 (OmniDocBench) | מהירה (2.12 עמ'/שנייה) | חילוץ נוסחאות דחוסות וטבלאות מורכבות 4 |
| Kreuzberg | בסיסי | מהירה ביותר (35+ קבצים/שנייה) | צריכת משאבים מינימלית (71MB) 2 |

### **ניתוח פריסה והפרדת אובייקטים (Object Detection)**

אחד האתגרים הגדולים ב-PDF אקדמי הוא מניעת הניסיון של מודל השפה "לקרוא" אובייקטים גרפיים כטקסט. ניתוח פריסה גיאומטרי (Geometric Layout Analysis) מאפשר לסווג אזורים כטקסט גוף, איורים, סמלים מתמטיים או טבלאות.7 שימוש במאגרי נתונים כמו DocLayNet, הכולל מעל 80,000 עמודים מתויגים ב-11 מחלקות שונות, מאפשר לאמן מודלים לזיהוי מדויק של קטעי קוד ונוסחאות בתוך טקסט עברי.8 מחקרים מצביעים על כך ששימוש בייצוג מבוסס גרפים (Graph-based Layout Analysis) יכול להפחית את מספר הפרמטרים של המודל ל-4 מיליון בלבד, לעומת מעל 100 מיליון במודלים מבוססי תמונה, תוך שמירה על דיוק גבוה דרך שימוש במטדאטה של ה-PDF.10

### **רזולוציה ועיבוד תמונה עבור Gemini 3**

הפרמטר media\_resolution ב-Gemini API משפיע בצורה דרמטית על איכות ה-OCR של נוסחאות מתמטיות. בניתוח של מסמכים אקדמיים דחוסים, רמת הרזולוציה הקבועה בברירת המחדל (Medium) עשויה להספיק לטקסט סטנדרטי, אך עבור נוסחאות הכוללות סימנים יווניים זעירים, רמת High (המקצה 1,120 טוקנים לעמוד) היא הכרחית.11 נמצא כי טעויות OCR נפוצות, כגון זיהוי האות ![][image1] כספרה 9, נובעות לרוב מרזולוציה נמוכה או מגופני Sans Serif (כמו Arial) שבהם הגליפים דומים.12

| רמת רזולוציה | הקצאת טוקנים (PDF) | השפעה על איכות OCR |
| ----: | ----: | ----: |
| LOW | 280 | מהיר וזול, לא מתאים לנוסחאות 11 |
| MEDIUM | 560 | אופטימלי לטקסט רגיל; רוויה ברוב המסמכים 11 |
| HIGH | 1,120 | נדרש לזיהוי טקסט צפוף, נוסחאות מורכבות ו-OCR מדויק 11 |
| ULTRA\_HIGH | 2,240 | מיועד לשימושים ספציפיים בלבד (Per-part) 11 |

## **הנדסת פרומפטים מותאמת ל-RTL ו-LaTeX**

השילוב של עברית (RTL) עם קוד LaTeX (LTR) בתוך פלט JSON יוצר עומס קוגניטיבי על מודל השפה. המודל נדרש לשמור על שלמות תחבירית של ה-JSON תוך כדי ניהול כיווניות הפוכה של הטקסט והנוסחאות.

### **התמודדות עם תופעת ה-Redundant Escaping ב-Gemini**

משתמשים רבים דיווחו על באג רגרסיה במודלי Gemini Pro שבו המודל מבצע "בריחה כפולה" (Redundant Escaping) של קווים נטויים ב-LaTeX.13 במקום לייצר $\\mathcal{O}(1)$, המודל עשוי לייצר רצפים כמו $\\\\\\\\\\\\\\\\mathcal{O}(1)$.13 תופעה זו נובעת מהעובדה שהמודל מאומן על כמויות אדירות של קוד תכנות שבו קווים נטויים דורשים בריחה, והוא משליך דפוס זה בטעות על נוסחאות מתמטיות. כדי לפתור זאת, יש להשתמש בהנחיות מערכת (System Prompts) קשיחות המחייבות את המודל להשתמש ב-Double Backslashes (\\\\) אך ורק עבור תאימות JSON, ולהימנע מבריחה נוספת בתוך ה-LaTeX עצמו.14

### **כללי כתיבה לשילוב עברית ומתמטיקה**

אחד הכללים הקריטיים ביותר בהנדסת פרומפטים לזרימה אקדמית עברית הוא הפרדה מוחלטת בין טקסט עברי לבין תחומים מתמטיים. חבילות רינדור רבות (כמו KaTeX) מסירות רווחים בתוך "מצב מתמטי", ולכן טקסט עברי שיופיע בתוך המפרידים ($...$) יוצג כרצף תווים מחובר ללא רווחים.14 על הפרומפט להורות למודל באופן חד-משמעי:

1. טקסט עברי תמיד ייכתב מחוץ למפרידי המתמטיקה.  
2. עבור סמלים בתוך טקסט, יש להשתמש במפרידים בודדים ($), ועבור נוסחאות מרכזיות יש להשתמש במפרידים כפולים ($$).  
3. אין להשתמש בבלוקי קוד (Triple Backticks) עבור נוסחאות, שכן הדבר משבש את יכולת הרינדור של הפלט הסופי.13

### **שימוש ב-Few-Shot וגילום תפקיד (Role-playing)**

מתן דוגמאות חיות של "קלט קשה" (למשל, תמונה של תרגיל הכולל שברים מורכבים ואינטגרלים לצד הסבר בעברית) ו"פלט מושלם" בפורמט JSON משפר משמעותית את עקביות המודל. הגדרת המודל כ"פרופסור למתמטיקה מומחה בעריכה אקדמית עברית" מסייעת לו לתעדף דיוק סמנטי על פני ניסוחים כלליים. הניסיון מלמד כי מודלים מגיבים טוב יותר להוראות המנוסחות כ"פרוטוקול תכנון אקדמי".14

## **אכיפת סכמות נתונים (Structured Outputs)**

הפיכת הפלט של Gemini לאמין ודטרמיניסטי היא תנאי הכרחי לפייפליין יציב. מצב "Structured Output" ב-Gemini API מאפשר לאכוף סכמת JSON Schema קשיחה, מה שמבטיח שהמודל יחזיר אובייקטים בפורמט צפוי מראש ללא צורך בניתוח טקסט חופשי (Parsing) שביר.

### **שימוש ב-Pydantic וסכימות JSON**

באמצעות ספריות כמו Pydantic בפייתון, ניתן להגדיר את מבנה המסמך האקדמי בצורה היררכית:

* header: כותרת הפרק או העמוד.  
* content\_blocks: מערך של אובייקטים המכילים טקסט או נוסחאות.  
* math\_equations: שדה ייעודי לנוסחאות LaTeX.

Gemini 2.5 ומודלים חדשים יותר תומכים בשמירה על סדר המפתחות כפי שהוגדר בסכמה, מה שמקל על עיבוד הנתונים בשלבים הבאים.16

| תכונת סכמה | תיאור ושימוש | יתרון למערכת |
| ----: | ----: | ----: |
| enum | הגדרת סט סגור של סוגי בלוקים (טקסט, נוסחה, טבלה) | מונע "הזיות" של סוגי נתונים חדשים 17 |
| description | הוספת הסבר לכל שדה בתוך הסכמה | הנחיה ישירה למודל על מהות המידע 17 |
| Optional | הגדרת שדות שעשויים לא להופיע (כמו כותרות משנה) | גמישות מבנית ללא שבירת ה-JSON 17 |
| response\_mime\_type | הגדרה ל-application/json | הבטחה טכנית שהפלט יהיה ניתן לניתוח תחבירי 18 |

### **מנגנוני תיקון עצמי (Auto-Healing JSON)**

למרות האכיפה של סכמות, מודלי שפה עלולים לייצר JSON שבור עקב תווים מיוחדים שלא עברו בריחה נכונה בתוך נוסחאות. מחקרים על "ארכיטקטורת Try-Heal-Retry" מציעים להשתמש בספריות כגון json-repair כשלב ביניים.19 ספרייה זו מסוגלת להוסיף מירכאות חסרות, לסגור סוגריים ולנקות טקסט מיותר מסביב ל-JSON בצורה אוטומטית.20 במידה וה-JSON עדיין לא תקין, ניתן להשתמש בספריית tenacity כדי לבצע ניסיון נוסף (Retry) מול ה-API עם הקשר השגיאה המדויק.19

## **חקר פתרונות רינדור לשילוב עברית ומתמטיקה**

השלב האחרון בפייפליין הוא הפיכת ה-JSON חזרה למסמך PDF מעוצב. בעוד ש-LaTeX (ובמיוחד XeLaTeX עם חבילת bidi) היה הסטנדרט במשך שנים, חלופות מודרניות מציעות יתרונות משמעותיים עבור פייפליינים אוטומטיים.

### **Typst: היורש המודרני של LaTeX**

Typst היא מערכת כתיבה חדשה הכתובה ב-Rust, המתוכננת להיות מהירה, מודולרית וניתנת לתכנות.22 בניגוד ל-LaTeX, שבו זמן הקומפילציה יכול לקחת דקות ארוכות עבור מסמכים מורכבים, Typst מבצעת קומפילציה בזמן של מילי-שניות.22 מבחני ביצועים מראים כי עבור מסמך של 500 עמודים, Typst מהירה פי 28 מ-pdflatex ופי עשרות מ-XeLaTeX.24

עבור פרויקטים בעברית, Typst מציעה תמיכה מובנית ב-RTL דרך פונקציית text(dir: rtl). בניגוד ל-LaTeX שבה נדרשת הגדרה מורכבת של חבילות כמו polyglossia שעלולות להתנגש עם חבילות אחרות, ב-Typst הטיפול בכיווניות הוא חלק מליבת המערכת.25 בנוסף, התחביר המתמטי של Typst נקי יותר ומזכיר Markdown, מה שמפחית את כמות ה-Backslashes שה-LLM נדרש לייצר.26

| מדד השוואה | Typst | XeLaTeX | HTML-to-PDF (WeasyPrint) |
| ----: | ----: | ----: | ----: |
| זמן קומפילציה (500 עמ') | 157ms | שניות/דקות רבות | 8.7s 24 |
| תמיכה ב-RTL | מובנית (Native) | דורשת חבילות חיצוניות | מבוססת CSS (dir="rtl") 25 |
| הודעות שגיאה | ברורות ומדויקות | קריפטיות וקשות לניפוי | תלוי במנוע הרינדור 22 |
| תשתית | קובץ בינארי בודד וקטן | התקנה של מספר ג'יגה-בייט | דורשת דפדפן או ספריות Python 25 |

### **מנועי HTML-to-PDF ושילוב KaTeX**

חלופה נוספת היא שימוש בטכנולוגיות אינטרנט. שימוש ב-HTML+CSS מאפשר שליטה גמישה מאוד בעיצוב RTL דרך direction: rtl; text-align: right. ניתן להשתמש בספריית KaTeX לרינדור המתמטיקה בתוך ה-HTML ואז להמיר את התוצאה ל-PDF באמצעות WeasyPrint או Playwright.24 עם זאת, WeasyPrint אינו מתמודד היטב עם מסמכים ארוכים מאוד וביצועיו פוחתים ככל שמספר העמודים גדל.24

## **שיטות הערכה ובדיקה (LLM Evals)**

כדי להבטיח שהפייפליין אינו נשבר בעדכוני מודל או שינויים בתבניות המסמכים, יש להטמיע מערך הערכה אוטומטי. מדדים מסורתיים כמו ROUGE או BLEU אינם מספיקים כאן, שכן הם מודדים דמיון טקסטואלי שטחי ואינם מסוגלים להעריך את התקינות הלוגית של נוסחה מתמטית או את העקביות של טקסט עברי הפוך.28

### **LLM-as-a-Judge**

השיטה המודרנית להערכה היא שימוש ב-LLM חזק אחר (למשל Gemini 1.5 Pro או Claude 3.5 Sonnet) בתפקיד "שופט".30 השופט מקבל את ה-PDF המקורי (כתמונה) ואת ה-JSON שהופק, ומדרג את התוצאה על פי קריטריונים מוגדרים:

1. **Recall (החזר)**: האם כל המידע מהמקור קיים ב-JSON?  
2. **דיוק מתמטי**: האם הנוסחאות ב-LaTeX זהות לוגית לנוסחאות בתמונה?  
3. **הזיות (Hallucinations)**: האם המודל המציא נתונים או הערות שאינם קיימים במקור?.28

נמצא כי שימוש בערכים התפלגותיים (Mean Judgment) במקום בציון בודד (Mode) משפר את המתאם בין הערכת ה-LLM לבין הערכה אנושית.31 בנוסף, שימוש ב-Multiple Agents (קבוצה של שופטים) עוזר לנטרל הטיות סובייקטיביות של מודל יחיד.30

### **בדיקות רגרסיה ויזואליות**

מעבר להערכת התוכן, יש לבצע בדיקות רגרסיה ויזואליות המשוות את ה-PDF הסופי ל-PDF המקורי. כיוון שסדר הבלוקים בעברית עלול להשתבש (למשל, פסקה שקופצת מעל כותרת עקב בעיות בכיווניות ה-OCR), כלים להשוואת פריסה מאפשרים לוודא שהמבנה הלוגי נשמר לאורך כל התהליך.7

## **סיכום ומסקנות אופרטיביות**

שיפור פייפליין ה-PDF-to-PDF עבור תכנים אקדמיים בעברית דורש התייחסות משולבת לרמת הראייה, הלוגיקה והרינדור. המעבר מחילוץ טקסט פשוט לניתוח פריסה מולטי-מודאלי הוא הצעד החשוב ביותר להבטחת איכות המידע. השימוש ב-MinerU לחילוץ נוסחאות וב-Typst לרינדור סופי מציע את השילוב הטוב ביותר בין דיוק למהירות.

המלצות מרכזיות ליישום:

* **בתחום העיבוד המקדים**: העדפת MinerU2.5-Pro על פני ספריות מסורתיות בזכות יכולות הניתוח הדו-שלביות שלו.  
* **בתחום ה-Prompting**: אכיפה של Double Backslashes ב-JSON והפרדה מוחלטת של טקסט עברי ממפרידי LaTeX.  
* **בתחום הרינדור**: מעבר ל-Typst כמנוע הרינדור המועדף בזכות המהירות והתמיכה המובנית ב-RTL.  
* **בתחום הבקרה**: הטמעת מערך "LLM-as-a-Judge" המבוסס על שופטים מרובים לניטור שוטף של הדיוק המתמטי והסמנטי.

המשך המחקר צריך להתמקד באופטימיזציה של עיצוב תווים (Character Shaping) בתוך ה-OCR עבור שפות RTL, שכן זהו עדיין צוואר הבקבוק המרכזי שבו טקסט עלול להופיע כהפוך או מקוטע עוד לפני שלב ה-LLM. שילוב של ספריות תיקון BiDi כחלק אינטגרלי מהפייפליין הוא פתרון הכרחי לטווח הקצר עד להופעת מודלי OCR בעלי הבנה מובנית עמוקה יותר בכיווניות שפות שאינן לטיניות.

#### **עבודות שצוטטו**

1. PDF Data Extraction Benchmark 2025: Comparing Docling ..., נרשמה גישה בתאריך אפריל 25, 2026, [https://procycons.com/en/blogs/pdf-data-extraction-benchmark/](https://procycons.com/en/blogs/pdf-data-extraction-benchmark/)  
2. I benchmarked 4 Python text extraction libraries (2025) \- DEV Community, נרשמה גישה בתאריך אפריל 25, 2026, [https://dev.to/nhirschfeld/i-benchmarked-4-python-text-extraction-libraries-2025-4e7j](https://dev.to/nhirschfeld/i-benchmarked-4-python-text-extraction-libraries-2025-4e7j)  
3. GitHub \- opendatalab/MinerU: Transforms complex documents like PDFs and Office docs into LLM-ready markdown/JSON for your Agentic workflows., נרשמה גישה בתאריך אפריל 25, 2026, [https://github.com/opendatalab/mineru](https://github.com/opendatalab/mineru)  
4. opendatalab/MinerU2.5-Pro-2604-1.2B \- Hugging Face, נרשמה גישה בתאריך אפריל 25, 2026, [https://huggingface.co/opendatalab/MinerU2.5-Pro-2604-1.2B](https://huggingface.co/opendatalab/MinerU2.5-Pro-2604-1.2B)  
5. MinerU2.5: Open-Source 1.2B Model for PDF Parsing Outperforms Gemini 2.5 Pro on Benchmarks, נרשמה גישה בתאריך אפריל 25, 2026, [https://neurohive.io/en/state-of-the-art/mineru2-5-open-source-1-2b-model-for-pdf-parsing-outperforms-gemini-2-5-pro-on-benchmarks/](https://neurohive.io/en/state-of-the-art/mineru2-5-open-source-1-2b-model-for-pdf-parsing-outperforms-gemini-2-5-pro-on-benchmarks/)  
6. GitHub \- datalab-to/marker: Convert PDF to markdown \+ JSON quickly with high accuracy, נרשמה גישה בתאריך אפריל 25, 2026, [https://github.com/datalab-to/marker](https://github.com/datalab-to/marker)  
7. Document Layout Analysis · UglyToad/PdfPig Wiki \- GitHub, נרשמה גישה בתאריך אפריל 25, 2026, [https://github.com/UglyToad/PdfPig/wiki/Document-Layout-Analysis](https://github.com/UglyToad/PdfPig/wiki/Document-Layout-Analysis)  
8. Daily Papers \- Hugging Face, נרשמה גישה בתאריך אפריל 25, 2026, [https://huggingface.co/papers?q=Document%20layout%20analysis](https://huggingface.co/papers?q=Document+layout+analysis)  
9. DocLayNet: A Large Human-Annotated Dataset for Document-Layout Analysis \- arXiv, נרשמה גישה בתאריך אפריל 25, 2026, [https://arxiv.org/abs/2206.01062](https://arxiv.org/abs/2206.01062)  
10. Document Layout Analysis with Graph-based Methods \- Prometeia, נרשמה גישה בתאריך אפריל 25, 2026, [https://prometeia.com/en/about-us/insights/article/document-layout-analysis-with-graphbased-methods-15929781](https://prometeia.com/en/about-us/insights/article/document-layout-analysis-with-graphbased-methods-15929781)  
11. Media resolution | Gemini API | Google AI for Developers, נרשמה גישה בתאריך אפריל 25, 2026, [https://ai.google.dev/gemini-api/docs/media-resolution](https://ai.google.dev/gemini-api/docs/media-resolution)  
12. OCR issues extracting math formulas with Document Intelligence \- Microsoft Learn, נרשמה גישה בתאריך אפריל 25, 2026, [https://learn.microsoft.com/en-au/answers/questions/2260900/ocr-issues-extracting-math-formulas-with-document](https://learn.microsoft.com/en-au/answers/questions/2260900/ocr-issues-extracting-math-formulas-with-document)  
13. The LaTeX answer will perform redundant repeated escaping ..., נרשמה גישה בתאריך אפריל 25, 2026, [https://support.google.com/gemini/thread/352359862/the-latex-answer-will-perform-redundant-repeated-escaping?hl=en](https://support.google.com/gemini/thread/352359862/the-latex-answer-will-perform-redundant-repeated-escaping?hl=en)  
14. Help with Math Notations (katex) & PDF parsing / handling : r/ClaudeCode \- Reddit, נרשמה גישה בתאריך אפריל 25, 2026, [https://www.reddit.com/r/ClaudeCode/comments/1sv0zjg/help\_with\_math\_notations\_katex\_pdf\_parsing/](https://www.reddit.com/r/ClaudeCode/comments/1sv0zjg/help_with_math_notations_katex_pdf_parsing/)  
15. gemini likes to write mathematical formulas into blocks of code rather than rendering them in latex \- Google Help, נרשמה גישה בתאריך אפריל 25, 2026, [https://support.google.com/gemini/thread/319061814/gemini-likes-to-write-mathematical-formulas-into-blocks-of-code-rather-than-rendering-them-in-latex?hl=en](https://support.google.com/gemini/thread/319061814/gemini-likes-to-write-mathematical-formulas-into-blocks-of-code-rather-than-rendering-them-in-latex?hl=en)  
16. Improving Structured Outputs in the Gemini API \- Google Blog, נרשמה גישה בתאריך אפריל 25, 2026, [https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-structured-outputs/](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-api-structured-outputs/)  
17. Structured outputs | Gemini API | Google AI for Developers, נרשמה גישה בתאריך אפריל 25, 2026, [https://ai.google.dev/gemini-api/docs/structured-output](https://ai.google.dev/gemini-api/docs/structured-output)  
18. How to handle Gemini's JSON output when it contains invalid LaTeX characters? \- Reddit, נרשמה גישה בתאריך אפריל 25, 2026, [https://www.reddit.com/r/GoogleGeminiAI/comments/1o20isw/how\_to\_handle\_geminis\_json\_output\_when\_it/](https://www.reddit.com/r/GoogleGeminiAI/comments/1o20isw/how_to_handle_geminis_json_output_when_it/)  
19. Building a Self-Healing Data Pipeline That Fixes Its Own Python Errors, נרשמה גישה בתאריך אפריל 25, 2026, [https://towardsdatascience.com/building-a-self-healing-data-pipeline-that-fixes-its-own-python-errors/](https://towardsdatascience.com/building-a-self-healing-data-pipeline-that-fixes-its-own-python-errors/)  
20. Tutorial on Using json\_repair in Python: Easily Fix Invalid JSON ..., נרשמה גישה בתאריך אפריל 25, 2026, [https://medium.com/@yanxingyang/tutorial-on-using-json-repair-in-python-easily-fix-invalid-json-returned-by-llm-8e43e6c01fa0](https://medium.com/@yanxingyang/tutorial-on-using-json-repair-in-python-easily-fix-invalid-json-returned-by-llm-8e43e6c01fa0)  
21. mangiucugna/json\_repair: Repair malformed JSON from LLMs, APIs, logs, and user input in Python. · GitHub, נרשמה גישה בתאריך אפריל 25, 2026, [https://github.com/mangiucugna/json\_repair](https://github.com/mangiucugna/json_repair)  
22. I Tried Typst (And Actually Loved It) \- Javad Ibrahimli, נרשמה גישה בתאריך אפריל 25, 2026, [https://javadibrahimli.github.io/blog/2026/i-tried-typst-and-actually-loved-it/](https://javadibrahimli.github.io/blog/2026/i-tried-typst-and-actually-loved-it/)  
23. A Tale about Typesetting with Typst vs. TeX \- Benjamin Hackl, נרשמה גישה בתאריך אפריל 25, 2026, [https://benjamin-hackl.at/blog/2024/07/typesetting-and-typst/](https://benjamin-hackl.at/blog/2024/07/typesetting-and-typst/)  
24. I benchmarked 6 PDF engines — the fastest is not the one I'd pick \- speedata news, נרשמה גישה בתאריך אפריל 25, 2026, [https://news.speedata.de/2026/02/10/typesetting-benchmark/](https://news.speedata.de/2026/02/10/typesetting-benchmark/)  
25. For LaTeX Users – Typst Documentation, נרשמה גישה בתאריך אפריל 25, 2026, [https://typst.app/docs/guides/for-latex-users/](https://typst.app/docs/guides/for-latex-users/)  
26. \[Debate\] \[2024\] What's stopping you from switching over to Typst? : r/LaTeX \- Reddit, נרשמה גישה בתאריך אפריל 25, 2026, [https://www.reddit.com/r/LaTeX/comments/1d5lw63/debate\_2024\_whats\_stopping\_you\_from\_switching/](https://www.reddit.com/r/LaTeX/comments/1d5lw63/debate_2024_whats_stopping_you_from_switching/)  
27. Typst with Pandoc: A Modern, Fast Alternative to (Xe)LaTeX for PDF Generation, נרשמה גישה בתאריך אפריל 25, 2026, [https://slhck.info/software/2025/10/25/typst-pdf-generation-xelatex-alternative.html](https://slhck.info/software/2025/10/25/typst-pdf-generation-xelatex-alternative.html)  
28. Evaluating Medical Text Summaries Using Automatic Evaluation Metrics and LLM-as-a-Judge Approach: A Pilot Study \- PMC, נרשמה גישה בתאריך אפריל 25, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC12786185/](https://pmc.ncbi.nlm.nih.gov/articles/PMC12786185/)  
29. Improving Automatic Evaluation of Large Language Models (LLMs) in Biomedical Relation Extraction via LLMs-as-the-Judge \- ACL Anthology, נרשמה גישה בתאריך אפריל 25, 2026, [https://aclanthology.org/2025.acl-long.1238.pdf](https://aclanthology.org/2025.acl-long.1238.pdf)  
30. LLM-as-a-Judge Approaches as Proxies for Mathematical Coherence in Narrative Extraction, נרשמה גישה בתאריך אפריל 25, 2026, [https://www.mdpi.com/2079-9292/14/13/2735](https://www.mdpi.com/2079-9292/14/13/2735)  
31. Improving LLM-as-a-Judge Inference with the Judgment Distribution \- arXiv, נרשמה גישה בתאריך אפריל 25, 2026, [https://arxiv.org/html/2503.03064v2](https://arxiv.org/html/2503.03064v2)  
32. PyMuPDF-Layout Performance on DocLayNet: A Comparative Evaluation | Medium, נרשמה גישה בתאריך אפריל 25, 2026, [https://medium.com/@pymupdf/pymupdf-layout-performance-on-doclaynet-a-comparative-evaluation-91d8f41d9f67](https://medium.com/@pymupdf/pymupdf-layout-performance-on-doclaynet-a-comparative-evaluation-91d8f41d9f67)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAXCAYAAAAyet74AAAA7ElEQVR4XuXRoYpCQRTG8bOgsOKCwgZd2GQQBJvYtNpMBgVfYTf7HhZBFkxisQqCxSaIZR/AoEUMNjUY3P2fOzM69z6B4Ac/HM89d2Y8ijxUXpBHDcnIs1sS6OEH31jgM9RB4uhjYNevmKDjN2ma2KNov+sVhpaug7xjiRFitvaGuaXrIC1c7afLBzbi7ag76E475O59UsYZXVfIYI0Ltp4j/tB2jSWcxHtTzCljHFBwxbqYI/QoF72r1qpeTSpixqI7a3ToUzGDdxMIondciXlBf90XZkj5TS4N/Iq5l/4b2fDjcHSo6WjxufMPwr0nO/SEKf8AAAAASUVORK5CYII=>