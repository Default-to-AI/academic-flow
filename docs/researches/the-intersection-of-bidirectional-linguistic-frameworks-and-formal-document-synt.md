# The Intersection of Bidirectional Linguistic Frameworks and Formal Document Synthesis: A Technical Treatise on Prompt Engineering for RTL and LaTeX

The Intersection of Bidirectional Linguistic Frameworks and Formal Document Synthesis: A Technical Treatise on Prompt Engineering for RTL and LaTeX

The emergence of large language models (LLMs) has revolutionized the methodology of natural language processing, yet the application of these computational engines to the dual complexities of right-to-left (RTL) scripts and formal document preparation systems like LaTeX remains a landscape of significant friction. At the heart of this struggle lies the fundamental architectural disparity between the predominantly left-to-right (LTR) training corpora and the unique requirements of languages such as Hebrew, Arabic, and Persian, alongside the rigid, execution-oriented semantics of the LaTeX typesetting language.[1, 2, 3] Prompt engineering, therefore, evolves from a simple instructional task into a sophisticated discipline of structural alignment, designed to bridge the gap between human intentionality and the functional correctness of the generated output.[1, 4, 5]

The Computational Architecture of Bidirectional Scripts

The challenges associated with RTL languages in the context of LLMs begin at the most basic level of information processing: tokenization. Most modern models utilize variations of Byte Pair Encoding (BPE) or similar algorithms that have been optimized on massive English-centric datasets. When these tokenizers encounter Hebrew or Arabic, the resulting token-to-word ratio is often significantly higher than that of English, leading to an immediate reduction in effective context window length and an increase in computational latency.[6, 7] The mechanism of this disparity is not merely a matter of data volume but of morphological density; Hebrew and Arabic utilize complex systems of root-based word construction and clitics that standard tokenizers struggle to decompose efficiently.[6, 8]

## Tokenization Efficiency and Modeling Disparities

Research indicates that the latest iterations of models, specifically the GPT-4o and Gemini 1.5 families, have made substantial progress in optimizing their tokenizers for non-Latin scripts. By implementing more diverse training sets, these models have achieved reduction factors in token usage that directly impact the cost and speed of RTL text generation.[7, 9] The efficiency gain is critical for production environments where RTL support is not a peripheral requirement but a core necessity for hundreds of millions of users.[3, 10]

The broader implication of this efficiency is a tangible improvement in the model's ability to maintain long-range dependencies in RTL text. When a model can represent a complex Hebrew sentence in fewer tokens, the attention mechanism is less prone to "forgetting" the grammatical subject or the directional context established at the beginning of the paragraph.[7, 11] This is particularly relevant when generating scientific documents where the relationship between the textual description and the subsequent LaTeX code must remain mathematically and logically consistent.[2]

The Dialectal Prompting Paradigm in Arabic and Hebrew

The linguistic landscape of RTL languages is further complicated by diglossia—the coexistence of a formal standard language and informal regional dialects. In Arabic, the distinction between Modern Standard Arabic (MSA) and various dialects like Levantine, Gulf, or Maghrebi necessitates a nuanced prompting strategy that accounts for the specific cultural and emotional context of the task.[8] Research on subjective classification tasks demonstrates that models often perform better when the prompt is aligned with the target dialect, particularly after a process of instruction-tuning or fine-tuning.[8]

## Arabizi and Script Variation

An emerging trend in prompt engineering for RTL languages is the use of Arabizi—informal Arabic chat alphabet written in Latin characters and numerals. While traditional Arabic script remains the standard for formal documents, Arabizi has proven to be an effective bridge for models when dealing with code-mixed data or social media sentiment analysis.[8] The causal relationship between the prompt script and the model's accuracy is heavily dependent on the training data distribution; if a model was trained on large volumes of informal web data, an Arabizi prompt might yield higher subjective classification accuracy than a formal MSA prompt.[8]

The effectiveness of dialectal prompting is most evident in nuanced tasks like irony detection or emotion recognition. A religious invocation, common in Arabic dialects, might be misclassified as "sadness" by a model prompted in English or MSA due to a lack of cultural context, whereas a dialect-specific prompt correctly identifies the tone as "trust" or "hope".[8] This suggests that prompt engineering for RTL languages must move beyond mere translation and toward a model of cultural and script-specific alignment.[8]

Interface Rendering and the BiDi Algorithm

The most visible pain point for users of LLM interfaces in RTL contexts is the failure of the bidirectional (BiDi) algorithm during the rendering phase. Even if the underlying model generates the correct sequence of characters, the front-end application—be it a web interface, a desktop app, or a PDF viewer—often fails to display them in the correct visual order.[3, 12] This is particularly catastrophic in technical writing where Hebrew or Arabic text is mixed with English terms, code snippets, or mathematical formulas.[3, 10]

## The Mechanism of BiDi Failure

The Unicode BiDi algorithm determines the visual order of characters based on their directional properties. Punctuation marks, brackets, and numbers are "neutral" characters that take their direction from the surrounding text. When an English term like "Next.js" is inserted into a Hebrew sentence, the browser or renderer can become confused about where the paragraph ends and the embedded LTR segment begins.[3, 13] The result is a scrambled visual representation where periods appear on the wrong side, brackets are inverted, and the word order is jumbled.[3, 12]

Users have identified a set of common rendering errors that significantly degrade the usability of LLMs for RTL professionals:

Alignment Mismatch: Text forcing itself to align left-to-right despite being predominantly RTL.[12, 14]

Punctuation Displacement: Sentences ending with a period on the right side of an English word but visually appearing on the far left of the line.[3, 12]

Cursor Jump: When editing RTL text in an LLM input box, the cursor moves in an unintuitive direction relative to the arrow keys.[14]

Bracket Inversion: The BiDi algorithm often renders a closing parenthesis ) as an opening one ( if it follows an English word in an RTL sentence.[13, 15]

## Technical Fixes for Bidirectional Interfaces

Prompt engineering can only mitigate these issues to a certain extent; the underlying fix requires adjustments to the HTML and CSS of the interface. The standard recommendation is the implementation of dir="auto" on all message containers, which allows the browser to dynamically detect the direction of each paragraph based on the first strong directional character.[3, 14] Furthermore, the use of unicode-bidi: plaintext ensures that the direction is determined per paragraph, preventing a long English code block from forcing the entire Hebrew chat history into an LTR alignment.[3, 16]

These technical interventions are critical because they allow the human evaluator to accurately assess the quality of the model's output. Without them, a user might incorrectly assume the model has failed to generate a coherent response, when in fact the failure lies entirely within the rendering engine.[3, 10]

LaTeX Code Generation: The Semantic Gap

LaTeX serves as the gold standard for scientific document preparation, but its generation by LLMs reveals a fundamental "semantic gap" between the textual patterns found in training data and the actual execution semantics required for valid document compilation.[2, 4, 17] Models are exceptionally good at mimicking the look of LaTeX code, but they often fail at the functional level—generating code that looks plausible but contains syntax errors, unclosed environments, or missing packages.[2, 18]

## The TeXpert Benchmark and Error Distributions

The TeXpert benchmark was specifically designed to evaluate the capability of LLMs in generating accurate LaTeX code from natural language instructions. The results across both open-source and closed-source models highlight a significant accuracy drop-off as task complexity increases from "Simple" to "Hard".[2, 18]

Error analysis identifies logical errors as the dominant failure mode across all models. These errors involve a failure to satisfy all requirements of a natural language prompt, such as missing a specific table column or misplacing a figure caption.[2, 18] Logical errors are followed by formatting lapses—frequent mistakes in environment selection or the generation of malformed tables—and package errors, where the model fails to include or correctly configure essential LaTeX packages like biblatex or amsmath.[2, 18]

## Specific LaTeX Generation Challenges

One of the most frequent syntax errors in LaTeX generation occurs within tabular and mathematical environments. The tabular environment requires a precise number of alignment tabs & per row. LaTeX will generate the "Extra alignment tab has been changed to \cr" error if the model adds more columns than specified in the environment header.[19] Similarly, in mathematical environments like matrix or array, the number of columns is often limited by internal LaTeX counters, which the model may exceed without providing the necessary \setcounter{MaxMatrixCols}{n} command.[19]

The broader implication is that scale alone—increasing the number of parameters in a model—does not necessarily solve the problem of LaTeX generation. The scarcity of high-quality LaTeX examples in training datasets compared to Python or JavaScript means that even "frontier" models require explicit prompt engineering to maintain structural integrity.[2, 18]

Advanced Prompt Engineering Strategies for LaTeX

To elicit publication-ready LaTeX from an LLM, a systematic approach to prompting is required. This involves the use of expert personas, negative constraints, and iterative debugging loops.[20, 21]

## The LaTeX Specialist Persona and Negative Constraints

Assigning the model the persona of a "LaTeX Specialist with 10+ years of experience" acts as a cognitive anchor, focusing the model on professional typesetting standards rather than generic code generation.[20, 22] This persona is most effective when combined with a series of "negative constraints" designed to eliminate AI-typical conversational filler.[20, 23]

Effective prompt structures for high-quality LaTeX output often include:

Behavioral Commands: "No quotes," "no explanations," "no apologies," and "just answer".[20]

Standards Adherence: Instructions to use the align environment instead of the deprecated eqnarray, and to prefer \[... \] over double dollar signs for display math.[20]

Package Specification: Explicitly requiring the use of booktabs for tables, siunitx for consistent unit formatting, and microtype for better text justification.[20]

Non-Breaking Spaces: A directive to place a non-breaking space ~ between a citation command and the preceding word to avoid awkward line breaks in the final PDF.[20]

## Iterative Debugging and Functional Correctness

A single-shot prompt is rarely sufficient for complex scientific documents. Instead, an iterative process—often termed a "simulation-error localization-correction" loop—is recommended.[21, 24] In this workflow, the model's output is compiled, the compiler's error logs are captured, and these logs are fed back into the model as part of a new prompt to fix the identified bugs.[21, 24] This approach has been formalized in frameworks like CodeRL+, which explicitly align generated text with execution semantics through reinforcement learning.[4]

This iterative mechanism addresses the "semantic gap" by providing the model with the execution-based feedback it lacked during its pre-training phase.[4, 21]

Engine Selection and Language Management in Hebrew LaTeX

For users seeking to typeset Hebrew in LaTeX, the selection of the TeX engine and the language management package is a critical decision that dictates the stability and feature set of the document. As of 2025, the community consensus has moved toward specific configurations that leverage the strengths of modern Unicode-aware engines.[25, 26]

## XeLaTeX vs. LuaLaTeX for RTL Scripts

While XeLaTeX was long the standard for RTL support due to its integration with system fonts via the fontspec package, LuaLaTeX has emerged as a superior alternative for complex, multilingual documents.[26, 27, 28]

XeLaTeX: Mature and widely used for Hebrew. It handles system fonts natively but relies on complex patching for bidi support, which can be invasive and lead to conflicts with other packages.[25, 26]

LuaLaTeX: Now the recommended engine for RTL and multilingual tasks. It uses the HarfBuzz library for font shaping and supports a more robust implementation of the Unicode BiDi algorithm. It is actively developed and better suited for producing accessible documents.[25, 26, 28]

## Babel vs. Polyglossia: The Modern Choice

The competition between the babel and polyglossia packages is a recurring theme in RTL LaTeX. While polyglossia was originally built specifically for XeLaTeX, modern developments in babel (particularly for LuaLaTeX) have made it the preferred choice for most users.[26, 29]

For Hebrew users, babel with the bidi=basic option in LuaLaTeX provides a "clever" approach to RTL handling that avoids many of the hacks associated with older configurations.[26, 27] It allows for automatic font switching based on the script, meaning that if a paragraph contains Hebrew text, babel will automatically switch to the Hebrew font without the need for explicit \texthebrew{} tags.[26, 30]

Punctuation and Parentheses: The Inversion Bug

A persistent and frustrating issue in RTL LaTeX is the inversion of parentheses and brackets. This occurs because punctuation is treated as a neutral character by the BiDi algorithm, and in an LTR-dominant typesetting environment, the "closing" parenthesis of an RTL segment is often rendered as an "opening" one.[13, 15]

## Diagnosing the Problem

The inversion is most common when:

An RTL sentence ends with an English word followed by a parenthesis: הדוגמה (example).

Equation numbers in an RTL document are rendered in reverse: )1(.

List items in an enumerate environment show reversed labels: )א(.

## Prompting for Punctuation Correctness

To solve this through LaTeX configuration, the prompt should instruct the model to:

Include `` when defining the \hebrewfont via `fontspec`.[15, 31]

Use \setmainlanguage{hebrew} in polyglossia to ensure the language-specific bidi settings are activated.[31]

For LuaLaTeX and babel, use the command \babeladjust{bidi.mirroring=off} if manual mirroring is causing issues, or ensure that the document is compiled with version 25.5 or later, which contains specific fixes for parentheses inside boxes.[32]

A more systemic fix involves wrapping English terms in \textenglish{} or using the \foreignlanguage{english}{...} command, which explicitly tells the engine to switch the directionality context, thereby ensuring that the trailing parenthesis is treated correctly.[15, 27, 32]

Bibliography Management: BibLaTeX and Biber

Handling Hebrew and English sources in a single bibliography is one of the most complex tasks in LaTeX. It requires the use of the biblatex package with the biber backend, as the legacy BibTeX engine is incapable of correctly processing Unicode RTL characters.[33, 34]

## The Mechanism of Per-Language Strings

The fundamental challenge is ensuring that the bibliography strings (e.g., "editor," "volume," "pp.") are translated correctly based on the language of the individual entry. This is achieved by:

Assigning a langid field to each entry in the .bib file (e.g., langid={hebrew} or langid={english}).[33, 34]

Configuring biblatex with the autolang=other option, which forces the engine to switch the language context for each entry.[33, 34]

Manually defining strings for unsupported languages like Hebrew. Since biblatex often lacks a native hebrew.lbx file, users must use \DefineBibliographyStrings{hebrew}{...} to set the correct terms.[34]

Prompting for a bibliographic setup should emphasize the need for XeLaTeX or LuaLaTeX and the use of the biber backend to ensure that the RTL characters are not lost during the compilation process.[33, 35]

Model-Specific Capabilities in RTL and Scientific Reasoning

The performance of LLMs in RTL and LaTeX tasks is not uniform. The choice of model can significantly impact the quality of the reasoning and the correctness of the code.

## GPT-4o and the Multimodal Advantage

GPT-4o is characterized by its native multimodality and significantly improved tokenizer for RTL languages.[7, 9] It excels at quantitative prompts and mathematical precision, making it a strong choice for generating complex LaTeX equations and tables.[9, 11, 18] However, it can sometimes be prone to over-explaining technical code unless strictly bounded by prompts.[23]

## Claude 3.5 Sonnet and the Logic Frontier

Claude 3.5 Sonnet has emerged as a leader in graduate-level reasoning (GPQA) and agentic coding tasks (SWE-bench).[11, 36] It is often preferred for long-form document generation and complex reasoning over text due to its 200,000-token context window and lower hallucination rates.[9, 11] For LaTeX, it is particularly effective at maintaining long-range structural consistency, though it may occasionally struggle with the inclusion of rare packages.[2, 11]

## Gemini 1.5 Pro and Massive Context

Gemini 1.5 Pro's primary advantage is its massive context window (up to 10M tokens), which allows users to upload entire libraries of research papers or massive LaTeX projects for analysis and refinement.[7, 37] It is highly effective at cross-referencing information across multiple documents, which is essential for thesis preparation or large-scale book projects.[37]

The broader implication for prompt engineering is that while GPT-4o might be the better choice for a single, complex math derivation in LaTeX, Gemini 1.5 Pro is superior for ensuring that the references in Chapter 10 of a dissertation align with the citations in Chapter 1.[11, 37]

Security and Robustness in Prompt Engineering

As LLMs are integrated into production workflows for RTL and scientific content, the security of the prompt engineering process becomes a critical consideration. Prompt engineering is not just about utility; it is also a tool for defending against adversarial attacks that exploit the vulnerabilities of these models.[1]

## Defending Against Prompt Injection

In an RTL context, adversarial prompts can be hidden within complex scripts or code-mixed text to bypass standard safety filters. Robust prompt engineering includes the development of strategies to minimize these risks, such as the use of delimiters to clearly separate instructions from user-provided data, and the implementation of self-verification steps where the model critiques its own output for safety and accuracy.[1, 38, 39]

Key security-focused prompting techniques include:

Prompt Chaining: Breaking a task into smaller sub-tasks where the output of one model is sanitized or verified by another before proceeding.[1, 40]

Few-Shot Verification: Providing examples of "good" and "bad" outputs to establish clear boundaries for the model.[41, 42]

Role-Based Isolation: Assigning the model a very specific, narrow role (e.g., "typesetting engine") to reduce its ability to engage in off-task or malicious behavior.[1, 22]

The future outlook for AI security in the RTL domain involves the development of models that are natively aware of the cultural and linguistic nuances of these scripts, reducing the reliance on English-based safety layers.[6, 8]

Synthetic Data and the Future of RTL Modeling

One of the most promising applications of prompt engineering for RTL languages is the generation of high-quality synthetic data to train the next generation of models. For low-resource or culturally specific settings, LLMs can be prompted to generate thousands of multi-turn conversations across diverse topics and countries.[6]

## Reproducible Methodology for Data Generation

The methodology involves structured prompting of an instruction-tuned model (like Jais-13b-chat) and hyperparameter optimization to control the diversity and context of the generated data.[6] This synthetic data has been shown to effectively improve the conversational abilities of Arabic models, providing a scalable blueprint for dialogue systems where human-labeled data is scarce.[6, 8]

The broader implication is a move toward "self-improving" linguistic systems, where prompt engineering acts as the catalyst for generating the very data that will eventually make manual prompting less necessary. As models become more fluent in the structural requirements of LaTeX and the linguistic nuances of Hebrew and Arabic, the "semantic gap" will naturally begin to close.[4, 6, 24]

Implementation Strategy for High-Fidelity RTL LaTeX

For the professional researcher or engineer, the implementation of these findings into a functional workflow requires a multi-step approach that prioritizes stability and correctness.

## Step 1: Pre-Configuration and Engine Choice

Begin by ensuring that the TeX environment is configured for LuaLaTeX. This includes the installation of the HarfBuzz libraries and the selection of modern fonts that support the Script=Hebrew or Script=Arabic features. The fontspec package should be used to define the main and secondary fonts, ensuring that the script attributes are explicitly stated to prevent punctuation inversion.[26, 31, 43]

## Step 2: Structured Prompting for Document Skeleton

When generating the initial document skeleton, use a prompt that assigns a "LaTeX Expert" persona and specifies the package load order. Explicitly request the babel package with the bidi=basic option and the inclusion of the geometry, amsmath, and booktabs packages for structural integrity.[20, 26, 30]

## Step 3: Content Generation with Language Switching

For mixed-language content, instruct the LLM to use the \foreignlanguage{...}{...} or \begin{otherlanguage}{...}... \end{otherlanguage} commands. This is critical for maintaining correct BiDi rendering and ensuring that the internal LaTeX logic (like hyphenation and numbering) remains consistent with the target language.[27, 30]

## Step 4: Verification and Iteration

Once the code is generated, run it through a compiler and feed the results (both the PDF and the error log) back into the model. Use the "Analyze-Fix-Explain" workflow to refine the document until it is functionally correct and aesthetically compliant with publication standards.[20, 21, 24]

This strategy ensures that the unique challenges of RTL scripts and the rigid requirements of LaTeX are addressed through a combination of technical configuration and advanced prompt engineering.[2, 4, 26]

Synthesis of Qualitative Insights and Future Outlook

The convergence of LLMs, bidirectional scripts, and formal typesetting systems represents a milestone in the democratization of scientific communication. However, the path to a seamless "natural language to document" pipeline is not merely a matter of more data, but of smarter structural alignment.

The qualitative findings from this analysis suggest that the most successful implementations of RTL LaTeX are those that treat the model not as a simple translator, but as a sophisticated co-pilot that requires explicit boundaries and execution-based feedback.[4, 20, 21] The move toward "native-basic" prompting—where the model is interacted with in its target script and dialect—is essential for capturing the nuances of cultural context that English-translated prompts often miss.[8, 44]

As the field of prompt engineering matures, we can expect to see:

Automatic BiDi Mitigation: Interfaces that natively handle the Unicode BiDi algorithm, reducing the need for manual dir="auto" fixes.[3, 14]

Formal LaTeX Benchmarks: Standardized evaluation sets like TeXpert becoming as common as HumanEval for measuring model intelligence.[2]

RAG-Enhanced Typesetting: Models that dynamically retrieve the latest package documentation and university templates to ensure "zero-shot" functional correctness.[24, 45]

Culturally Aware Safety: Security frameworks that understand the nuances of RTL scripts, making models safer for a global audience.[1, 8]

The ultimate goal of this research is to empower the professional user to transcend the limitations of current technology, turning the "hassle" of RTL LaTeX into a streamlined, AI-assisted process that maintains the highest standards of scientific precision and linguistic integrity.[1, 2, 26] In this vision, prompt engineering serves as the foundational architecture for a truly global, multilingual scientific discourse.


--------------------------------------------------------------------------------

Unleashing the potential of prompt engineering for large language models - PMC, https://pmc.ncbi.nlm.nih.gov/articles/PMC12191768/

TeXpert: A Multi-Level Benchmark for Evaluating LaTeX Code Generation by LLMs - arXiv, https://arxiv.org/html/2506.16990v1

RTL (Right-to-Left) Support for Hebrew & Arabic in Claude Desktop / Cowork #38005, https://github.com/anthropics/claude-code/issues/38005

CodeRL+: Improving Code Generation via Reinforcement with Execution Semantics Alignment - arXiv, https://arxiv.org/html/2510.18471v1

Advanced Prompt Engineering Techniques in 2025 - Maxim AI, https://www.getmaxim.ai/articles/advanced-prompt-engineering-techniques-in-2025/

Fine-Tuning Arabic Large Language Models for improved multi-turn dialogue: A blueprint for synthetic data generation and benchmarking - PMC, https://pmc.ncbi.nlm.nih.gov/articles/PMC12900375/

GPT-4o vs. Gemini 1.5 Pro vs. Claude 3 Opus: Multimodal AI Model Comparison - Encord, https://encord.com/blog/gpt-4o-vs-gemini-vs-claude-3-opus/

Are Dialects Better Prompters? A Case Study on ... - ACL Anthology, https://aclanthology.org/2025.findings-acl.892.pdf

Claude 3.5 sonnet Vs GPT-4o: Key details and comparison - Pieces for Developers, https://pieces.app/blog/how-to-use-gpt-4o-gemini-1-5-pro-and-claude-3-5-sonnet-free

RTL Text support in Codex : r/OpenaiCodex - Reddit, https://www.reddit.com/r/OpenaiCodex/comments/1spzx7i/rtl_text_support_in_codex/

Claude 3.5 Sonnet vs GPT 4o: Model Comparison 2025 - Galileo AI, https://galileo.ai/blog/claude-3-5-sonnet-vs-gpt-4o-enterprise-ai-model-comparison

[Bug] Incorrect text rendering and alignment for RTL (Right-to-Left) languages · Issue #14578 · openai/codex - GitHub, https://github.com/openai/codex/issues/14578

How to solve BiDi bracket issues? - Stack Overflow, https://stackoverflow.com/questions/5801820/how-to-solve-bidi-bracket-issues

I found a temporary perfect RTL fix (Auto applied based on language) : r/Anytype - Reddit, https://www.reddit.com/r/Anytype/comments/1i0y3g3/i_found_a_temporary_perfect_rtl_fix_auto_applied/

bidi and reversed parentheses [closed] - LaTeX Stack Exchange, https://tex.stackexchange.com/questions/337067/bidi-and-reversed-parentheses

Claude RTL – Hebrew & Arabic Support - Firefox for Android extensions, https://addons.mozilla.org/en-US/firefox/addon/claude-rtl-hebrew-arabic/

TeXpert: A Multi-Level Benchmark for Evaluating LaTeX Code Generation by LLMs - arXiv, https://arxiv.org/abs/2506.16990

TeXpert: A Multi-Level Benchmark for Evaluating LaTeX Code Generation by - arXiv, https://arxiv.org/pdf/2506.16990?

Extra alignment tab has been changed to \cr - Overleaf, Online LaTeX Editor, https://www.overleaf.com/learn/latex/Errors/Extra_alignment_tab_has_been_changed_to_%5Ccr

LaTeX Specialist - abilzerian/LLM-Prompt-Library - GitHub, https://github.com/abilzerian/LLM-Prompt-Library/blob/main/prompts/programming/LaTeX_specialist.md

Understanding and Mitigating Errors of LLM-Generated RTL Code - arXiv, https://arxiv.org/html/2508.05266v2

Top 5 Prompt Engineering Techniques for LLMs in 2025 | by Neha Ummareddy | Medium, https://medium.com/@nehaummareddy/top-5-prompt-engineering-techniques-for-llms-in-2025-f114d4958b4d

The Ultimate Guide to Prompt Engineering in 2026 | Lakera – Protecting AI teams that disrupt the world., https://www.lakera.ai/blog/prompt-engineering-guide

Understanding and Mitigating Errors of LLM-Generated RTL Code * Corresponding author., https://arxiv.org/html/2508.05266v1

How to use greek, hebrew and aramaic in LaTeX on 2025? - TeX, https://tex.stackexchange.com/questions/741710/how-to-use-greek-hebrew-and-aramaic-in-latex-on-2025

LaTeX/Internationalization - Wikibooks, open books for an open world, https://en.wikibooks.org/wiki/LaTeX/Internationalization

Hebrew and the alternative between polyglossia and babel - TeX - LaTeX Stack Exchange, https://tex.stackexchange.com/questions/468906/hebrew-and-the-alternative-between-polyglossia-and-babel

polyglossia vs babel in lualatex for arabic support : r/LaTeX - Reddit, https://www.reddit.com/r/LaTeX/comments/1jb7eh1/polyglossia_vs_babel_in_lualatex_for_arabic/

Decide between Polyglossia and Babel for LuaLaTeX in 2019 - LaTeX Stack Exchange, https://tex.stackexchange.com/questions/482396/decide-between-polyglossia-and-babel-for-lualatex-in-2019

Babel or polyglossia for Hebrew and Arabic in XeLaTeX? - TeX - LaTeX Stack Exchange, https://tex.stackexchange.com/questions/353999/babel-or-polyglossia-for-hebrew-and-arabic-in-xelatex

bidi causes reversed parentheses in equation numbers - TeX - LaTeX Stack Exchange, https://tex.stackexchange.com/questions/178908/bidi-causes-reversed-parentheses-in-equation-numbers

reversed parentheses inside \hbox with babel bidi=basic - TeX - LaTeX Stack Exchange, https://tex.stackexchange.com/questions/737662/reversed-parentheses-inside-hbox-with-babel-bidi-basic

Mixing Hebrew and English bibliographies? - TeX - LaTeX Stack Exchange, https://tex.stackexchange.com/questions/293935/mixing-hebrew-and-english-bibliographies

Per-language bibliography strings don't work for me (biblatex/biber/polyglossia) - TeX, https://tex.stackexchange.com/questions/297505/per-language-bibliography-strings-dont-work-for-me-biblatex-biber-polyglossia

LaTeX examples — Hebrew - Overleaf, https://www.overleaf.com/latex/examples/tagged/hebrew

Comparison Analysis: Claude 3.5 Sonnet vs GPT-4o - Vellum, https://www.vellum.ai/blog/claude-3-5-sonnet-vs-gpt4o

Claude Sonnet 3.5, GPT-4o, o1, and Gemini 1.5 Pro compared for coding - Reddit, https://www.reddit.com/r/Anthropic/comments/1ho0gjn/claude_sonnet_35_gpt4o_o1_and_gemini_15_pro/

I Let the AI Engineer Its Own Prompt… and It Destroyed Every Manual Prompt I've Ever Written (Template Inside) : r/PromptEngineering - Reddit, https://www.reddit.com/r/PromptEngineering/comments/1s9ux9u/i_let_the_ai_engineer_its_own_prompt_and_it/

Papers | Prompt Engineering Guide, https://www.promptingguide.ai/papers

How to Optimize Prompting for Large Language Models in Clinical Research - PMC, https://pmc.ncbi.nlm.nih.gov/articles/PMC11444847/

Prompt engineering techniques: Top 6 for 2026 - K2view, https://www.k2view.com/blog/prompt-engineering-techniques/

Prompt Engineering Projects - AI Tinkerers, https://nyc.aitinkerers.org/technologies/prompt-engineering?page=2

Hebrew with XeTeX Example - Guy Rutenberg, https://www.guyrutenberg.com/2015/03/20/hebrew-with-xetex-example/

Multilingual Prompt Engineering in Large Language Models: A Survey Across NLP Tasks, https://arxiv.org/html/2505.11665v1

LaTeX templates and examples — Hebrew - Overleaf, https://www.overleaf.com/gallery/tagged/hebrew
