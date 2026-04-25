# Computational Architectures for Document Pre-processing and Mathematical Notation Recognition in Scientific PDF Intelligence

Computational Architectures for Document Pre-processing and Mathematical Notation Recognition in Scientific PDF Intelligence

The transition of scientific and technical documentation from physical archives to machine-interpretable knowledge bases represents a fundamental challenge in the field of document intelligence. At the core of this challenge lies the Portable Document Format (PDF), a medium designed for visual fidelity across heterogeneous hardware rather than semantic accessibility or structured data extraction.[1, 2] The inherent complexity of technical documents, characterized by multi-column layouts, dense mathematical expressions, and non-standard character encodings, necessitates a sophisticated multi-stage pre-processing and vision pipeline.[3, 4] This report provides an exhaustive analysis of the state-of-the-art methodologies governing document pre-processing, layout analysis, and mathematical expression recognition (MER), with a specific focus on the integration of these elements into modern retrieval-augmented generation (RAG) frameworks.

Foundations of Document Image Pre-processing and Vision

Document image pre-processing serves as the critical entry point for any high-fidelity extraction system, particularly when dealing with scanned or degraded technical documents.[5, 6] While deep learning (DL) has pushed the limits of digital image processing, traditional computer vision (CV) techniques remain essential as foundational components that enhance the signal-to-noise ratio before neural architectures are invoked.[7, 8] The relationship between classical CV and modern DL is increasingly symbiotic, where handcrafted feature descriptors like SIFT or SURF are complemented or replaced by automated feature learning through convolutional and transformer-based backbones.[7, 9]

## Advanced Binarization and Adaptive Thresholding Strategies

Binarization is the foundational process of reducing the color space of a document image to binary values, thereby isolating the textual and symbolic foreground from the background.[5, 10] Traditional global thresholding methods, most notably Otsu's algorithm, function by maximizing the between-class variance of foreground and background pixels.[11, 12] However, global methods frequently fail in the presence of uneven illumination, stains, or bleed-through, which are common in historical scientific archives and low-quality scans.[10, 11]

To address these degradations, local binarization algorithms calculate a unique threshold for each pixel based on its surrounding neighborhood.[10, 11] These methodologies have seen significant refinement in 2024 and 2025, with hybrid approaches integrating local statistics into neural refinement loops.[6, 10]

The emergence of the "Text in the Dark" pipeline illustrates the modern shift toward AI-powered enhancement, utilizing super-resolution and deep denoising networks to reconstruct legible text from blurred or low-light images, which can improve subsequent OCR accuracy by up to 30%.[6] These pipelines increasingly utilize decision tree ensembles and machine learning models to leverage classical local thresholding algorithms alongside image statistics, achieving F-measures as high as 95.8% on challenging datasets like DIBCO.[10]

## Geometric Correction and Denoising Networks

Beyond contrast enhancement, the geometric alignment of a document is paramount for the success of layout analysis models.[5, 13] Skew correction and perspective transformation address tilt and distortion introduced during scanning or smartphone capture.[5, 14] Even a few degrees of rotation can cause catastrophic failures in line segmentation and reading order prediction, as OCR engines are typically optimized for horizontal text alignment.[5, 15]

Denoising techniques have evolved from simple Gaussian blurs to bilateral filtering, which preserves sharp edges while smoothing uniform background regions.[14] This is particularly critical in technical documents where the edges of mathematical symbols—such as the fine lines of a fraction bar or the curves of a radical symbol—contain the primary semantic information.[14, 16] Recent state-of-the-art models employ morphological operations for border cleaning and noise removal, ensuring that artifacts do not mimic small punctuation or mathematical subscripts.[11]

Document Layout Analysis and Multimodal Understanding

Document Layout Analysis (DLA) is the process of identifying and categorizing the structural regions of a document page, such as titles, headers, paragraphs, tables, and formulas.[17, 18, 19] The field has transitioned from "unimodal" methods—which rely solely on visual features—to "multimodal" frameworks that integrate visual, textual, and spatial layout data.[20, 21]

## The LayoutLM Family and Unified Transformers

The standard for high-performance document understanding has been set by the LayoutLM series of models.[21, 22, 23] LayoutLMv1 established the importance of incorporating 2D positional embeddings to represent the spatial coordinates of text tokens.[22, 23] LayoutLMv2 and LayoutXLM extended this by modeling the interaction between text, layout, and image patches within a single Transformer architecture.[23]

The current frontier is defined by LayoutLMv3, which employs a unified single-stack Transformer to encode text tokens, image patches, and 2D bounding boxes.[21] Its pre-training regimen includes Masked Language Modeling (MLM), Masked Image Modeling (MIM), and a novel Word-Patch Alignment (WPA) objective.[21] This alignment ensures that the model can effectively correlate a specific word (e.g., "Equation") with its corresponding visual region (e.g., a mathematical block).[21]

## Emergent DLA Architectures: HybriDLA and GraphDoc

As documents become more complex, traditional single-pass object detection models struggle with the extreme variability in layout counts and arrangements.[24] HybriDLA addresses this by combining diffusion and autoregressive decoding.[24] The diffusion component iteratively refines bounding-box hypotheses, while the autoregressive component provides semantic awareness, allowing the system to handle dense scientific pages with dozens of interlocking elements.[24]

Furthermore, the introduction of Graph-based Document Structure Analysis (gDSA), exemplified by the GraphDoc dataset and models, moves beyond simple region detection to capture the nuanced logical and hierarchical relations between instances.[25] By representing a document as a graph, these systems can explicitly model parent-child relationships (e.g., a table and its caption) and sequential reading orders, which are often lost in standard bounding-box-based DLA.[25, 26]

Mathematical Expression Recognition (MER) in Scientific PDFs

Mathematical expressions are perhaps the most semantically dense components of scientific documents, yet they remain the most difficult to parse due to their two-dimensional structure.[4, 27, 28] Unlike linear text, mathematical notation conveys meaning through spatial positioning, including superscripts, subscripts, fractions, and nested operators.[27, 29]

## Detection Strategies: Inline vs. Displayed Formulas

The detection phase, known as Mathematical Expression Detection (MED), distinguishes between "isolated" (displayed) formulas and "embedded" (inline) formulas.[30, 31] Isolated formulas are typically easier to locate due to their distinct layout features, such as centering, increased vertical spacing, and consistent alignment.[30, 31, 32] Embedded formulas present a significant challenge as they are integrated into text lines and often differ only subtly from ordinary text, such as through the use of italics for variables.[31, 32]

Current MED systems leverage three primary categories of features:

Character-based: Utilizing OCR engines to identify unrecognized symbols or font style changes.[4, 31]

Image-based: Employing semantic segmentation and object detection (e.g., YOLO, SSD) to locate formula regions directly from pixels.[17, 32, 33]

Layout-based: Analyzing line height, spacing, and baseline offsets provided by the PDF's typesetting information.[4, 31]

State-of-the-art models like Dolphin-v2 and PP-DocLayout have expanded their detection categories to include dedicated types for displayed formulas, inline math, and chemical structures, achieving mAP@0.5 scores exceeding 90%.[17, 34]

## Recognition Paradigms: Sequence-based vs. Structure-aware

Once localized, the Mathematical Expression Recognition (MER) task involves transcribing the visual arrangement into a machine-readable format, typically LaTeX.[35, 36] Two paradigms dominate this field:

Sequence-based Decoding: These models, including UniMERNet and Nougat, utilize an encoder-decoder Transformer architecture to generate LaTeX tokens autoregressively.[22, 28, 36] UniMERNet improves upon traditional models by incorporating Fine-Grained Embedding (FGE) and Convolutional Enhancement (CE) in the encoder, allowing it to better capture the spatial relationships of small symbols like subscripts.[16]

Structure-aware/Tree-based Decoding: Recognizing that LaTeX possesses an inherent tree structure, models like TAMER (Tree-Aware Transformer) and Uni-MuMER integrate structured spatial reasoning.[27, 37, 38] By jointly optimizing for sequence and tree-structure prediction, these models ensure grammatical correctness and better handle complex, multi-layered expressions.[27, 39]

## Benchmarking MER: The Character Difference Metric (CDM)

Traditional metrics like BLEU and Edit Distance have proven inadequate for evaluating MER because semantically identical formulas can have multiple valid LaTeX representations (e.g., x+y vs. y+x or \frac{1}{2} vs. 1/2).[35, 40] To address this, the Character Difference Metric (CDM) was developed, which renders the predicted LaTeX back into an image and performs character-level matching in the visual space.[40, 41] This image-level evaluation aligns more closely with human judgment and provides a fairer comparison across diverse models.[40]

PDF-Specific Challenges: Encodings, Fonts, and Accessibility

The PDF format presents unique technical challenges that are absent in pure image-based documents.[1, 42] These challenges stem from the format's flexibility, which allows for various methods of character encoding and font embedding.[43, 44]

## Character Encoding and Font Embedding Failures

A significant proportion of PDFs utilize non-standard character encoding or "subsetted" fonts, where only the characters actually used in the document are included in the embedded font file.[43, 44] If a font is not embedded, the system rendering the PDF must substitute it with a similar local font, which can alter text shape and spacing, confusing OCR engines.[13]

Common encoding issues include:

Symbolic/CID Fonts: These may lack a known CMap, leading to "gibberish" output during direct text extraction.[44, 45]

Ligatures: Characters like 'fi' or 'fl' are often stored as a single glyph, which must be deconstructed during parsing.[42]

Mathematical Greek Symbols: Symbols like \vartheta (theta) are frequently misrecognized as the digit '9' or the letter 'O' if the font mapping is incorrect.[46]

To resolve these, modern parsers like those in the Sensible or PyMuPDF ecosystems employ heuristics to detect "gibberish" text and fallback to vision-based OCR when the internal PDF text stream is unreliable.[42, 45]

## The Challenge of Math Accessibility

For scientific documents, accessibility is often tied to the presence of MathML (Mathematical Markup Language).[47] The PDF/UA-2 specification requires embedding MathML as an associated file attribute of the <Formula> tag.[47] However, standard authoring tools like Adobe Acrobat Pro currently lack the ability to automatically generate this complex internal structure, leading to a reliance on third-party conversion tools that translate PDFs into structured HTML/MathML formats.[47]

Integration into Retrieval-Augmented Generation (RAG) Pipelines

The ultimate application of document pre-processing in the current AI landscape is the population of RAG systems.[2, 48] RAG enables Large Language Models (LLMs) to reason over vast repositories of scientific literature, but its success is contingent upon the accuracy of the initial parsing and the preservation of logical context.[2, 49, 50]

## Semantic Chunking and Contextual Retrieval

Standard fixed-length chunking strategies frequently fragment mathematical proofs or tables, leading to retrieval failures.[49, 50, 51] "Contextual Retrieval" address this by prepending a high-level document context to each chunk during the embedding phase.[50, 52] For technical documents, "semantic chunking" is preferred, which splits content at logical boundaries like section headers or the conclusion of a proof.[49, 51]

In the context of mathematical textbooks (e.g., Olympiad-style problems), researchers have found that keeping problem-solution pairs within a single chunk is essential for maintaining the contextual integrity of the reasoning chain.[49] By converting visual formula data directly into LaTeX before chunking, systems can maintain the structural relationships between mathematical objects across the RAG database.[49, 53]

## Embedding Models for Mathematical Content

Selecting an appropriate embedding model is a critical design choice for mathematical RAG.[54, 55] General-purpose embedding models may fail to capture the semantic equivalence between different notations of the same formula.[54, 56]

The "Confident RAG" method represents a significant advancement, where the system generates multiple responses using different embedding models and selects the one with the highest confidence score.[54, 55] This approach has demonstrated average accuracy improvements of approximately 10% over vanilla RAG configurations.[54, 55]

Evaluation of Parser Performance and Benchmarks

The field relies on benchmark datasets to drive innovation in layout analysis and content extraction.[20, 58] While early datasets like PubLayNet were sourced primarily from medical journals, modern benchmarks like DocLayNet provide a much broader diversity of layouts, including financial reports, legal documents, and government tenders.[20, 58, 59]

A key development in 2024 is the move toward synthetic PDF generation for benchmarking.[29, 35, 61] By generating PDFs with precise, known LaTeX ground truth, researchers can systematically control layout complexity and formula density, allowing for a reproducible evaluation of parser quality that is not limited by human annotation errors.[29, 35]

Future Directions: Towards End-to-End Multimodal Parsing

The trajectory of document pre-processing suggests a move away from fragmented, multi-stage pipelines toward unified, end-to-end vision-language models (VLMs).[62, 63] Models such as Nougat and Dolphin-v2 represent the first generation of systems that attempt to "read" a page image directly into a structured markup language like Markdown or LaTeX.[22, 62]

Future research is expected to focus on:

Efficiency and Speed: Developing "tiny" VLMs that can perform high-fidelity parsing without the massive computational requirements of models like GPT-4o.[1, 22]

Robustness to Visual Degradation: Enhancing models to handle fuzzy scans, watermarks, and colorful backgrounds through specialized pre-training.[6, 63]

Agentic RAG: Moving beyond static retrieval to autonomous agents that can iteratively refine their search and reasoning processes based on retrieved document segments.[26, 54]

Global Multimodality: Extending high-precision DLA and MER to CJK (Chinese, Japanese, Korean) and Arabic scripts, which present unique structural and linguistic challenges.[23, 64, 65]

In conclusion, the pre-processing of technical PDFs requires a sophisticated blend of classical computer vision and modern deep learning.[7, 66] By addressing the foundational issues of binarization, skew, and character encoding, and by leveraging multimodal Transformers for layout and formula recognition, the field is moving toward a future where the unstructured data of scientific archives becomes fully accessible to the next generation of artificial intelligence.[2, 21, 67]


--------------------------------------------------------------------------------

1 Introduction - arXiv, https://arxiv.org/html/2505.01435v1

RAG-Anything: All-in-One RAG Framework - arXiv, https://arxiv.org/html/2510.12323v1

Document Parsing Unveiled: Techniques, Challenges, and Prospects for Structured Information Extraction - arXiv, https://arxiv.org/html/2410.21169v1

A Math Formula Extraction and Evaluation Framework for PDF Documents - cs.rit.edu, https://www.cs.rit.edu/~rlaz/files/ICDAR2021_MathSeer_Pipeline.pdf

OCR Preprocessing: How to Improve Your OCR Data Extraction Outcome - DocuClipper, https://www.docuclipper.com/blog/ocr-preprocessing/

Enhancing OCR Accuracy in Low-Quality Scans - Sparkco, https://sparkco.ai/blog/enhancing-ocr-accuracy-in-low-quality-scans

Deep Learning vs. Traditional Computer Vision - arXiv, https://arxiv.org/pdf/1910.13796

Improving the Quality of Optical Character Recognition (OCR) Based on Neural Network with the Image Enhancement Process, https://ejurnal.umbima.ac.id/index.php/scientific/article/download/334/178

A Comprehensive Survey of Deep Learning Approaches in Image Processing - MDPI, https://www.mdpi.com/1424-8220/25/2/531

State-of-the-Art Document Image Binarization Using a Decision Tree Ensemble Trained on Classic Local Binarization Algorithms and Image Statistics - MDPI, https://www.mdpi.com/2076-3417/15/15/8374

Analysis of Image Preprocessing and Binarization Methods for OCR-Based Detection and Classification of Electronic Integrated Circuit Labeling - MDPI, https://www.mdpi.com/2079-9292/12/11/2449

A Comprehensive Review on Document Image Binarization - ResearchGate, https://www.researchgate.net/publication/391231515_A_Comprehensive_Review_on_Document_Image_Binarization

Why Your OCR Results Differ: The Hidden Role of Embedded Fonts in PDFs - Medium, https://medium.com/@hlealpablo/why-your-ocr-results-differ-the-hidden-role-of-embedded-fonts-in-pdfs-ec38c9447d1f

Image Pre-Processing Techniques for OCR | by Tech for Humans | Medium, https://medium.com/@TechforHumans/image-pre-processing-techniques-for-ocr-d231586c1230

image processing to improve tesseract OCR accuracy - Stack Overflow, https://stackoverflow.com/questions/9480013/image-processing-to-improve-tesseract-ocr-accuracy

[Literature Review] UniMERNet: A Universal Network for Real-World Mathematical Expression Recognition - Moonlight, https://www.themoonlight.io/en/review/unimernet-a-universal-network-for-real-world-mathematical-expression-recognition

PP-DocLayout: A Unified Document Layout Detection Model to Accelerate Large-Scale Data Construction - arXiv, https://arxiv.org/html/2503.17213v1

Layout Analysis of Document Images - LatinX in AI (LXAI) Research, https://research.latinxinai.org/papers/cvpr/2023/pdf/Nina_Hirata.pdf

Document Parsing Unveiled: Techniques, Challenges, and Prospects for Structured Data Extraction - arXiv, https://arxiv.org/html/2410.21169v5

Daily Papers - Hugging Face, https://huggingface.co/papers?q=Document%20layout%20analysis

LayoutLMv3: Unified Multimodal Document AI - Emergent Mind, https://www.emergentmind.com/topics/layoutlmv3

Accelerating End-to-End PDF to Markdown Conversion through Assisted Generation - arXiv, https://arxiv.org/html/2512.18122v1

Comparative Analysis of AI OCR Models for PDF to Structured Text | IntuitionLabs, https://intuitionlabs.ai/articles/ai-ocr-models-pdf-structured-text-comparison

HybriDLA: Hybrid Generation for Document Layout Analysis, https://ojs.aaai.org/index.php/AAAI/article/view/37308/41270

GRAPH-BASED DOCUMENT STRUCTURE ANALYSIS - ICLR Proceedings, https://proceedings.iclr.cc/paper_files/paper/2025/file/cf3d7d8e79703fe947deffb587a83639-Paper-Conference.pdf

Rag Anything summary by windsurf - GitHub Gist, https://gist.github.com/pradhyumna85/63482b25c84baa0a3dcc77e87bda3c45

arXiv:2408.08578v2 [cs.CV] 11 Dec 2024, https://arxiv.org/pdf/2408.08578

UniMERNet: A Universal Network for Real-World Mathematical Expression Recognition, https://arxiv.org/html/2404.15254v2

Benchmarking Document Parsers on Mathematical Formula Extraction from PDFs - arXiv, https://arxiv.org/html/2512.09874v1

Mathematical Formula Detection in PDFs | PDF | Support Vector Machine - Scribd, https://www.scribd.com/document/971203747/3

ScanSSD: Scanning Single Shot Detector for Mathematical Formulas in PDF Document Images - arXiv, https://arxiv.org/pdf/2003.08005

Detecting In-line Mathematical Expressions in Scientific Documents | Request PDF, https://www.researchgate.net/publication/319437392_Detecting_In-line_Mathematical_Expressions_in_Scientific_Documents

DocFusion: A Unified Framework for Document Parsing Tasks - ACL Anthology, https://aclanthology.org/2025.findings-acl.393.pdf

Dolphin-v2: Universal Document Parsing via Scalable Anchor Prompting - arXiv, https://arxiv.org/html/2602.05384v1

Benchmarking Document Parsers on Mathematical Formula Extraction from PDFs - arXiv, https://arxiv.org/pdf/2512.09874

UniMERNet: A Universal Network for Real-World Mathematical Expression Recognition, https://arxiv.org/html/2404.15254v1

TAMER: Tree-Aware Transformer for Handwritten Mathematical Expression Recognition - AAAI Publications, https://ojs.aaai.org/index.php/AAAI/article/view/33190/35345

Uni-MuMER: Unified Multi-Task Fine-Tuning of Vision-Language Model for Handwritten Mathematical Expression Recognition - arXiv, https://arxiv.org/html/2505.23566v3

NeurIPS Poster Uni-MuMER: Unified Multi-Task Fine-Tuning of Vision-Language Model for Handwritten Mathematical Expression Recognition, https://neurips.cc/virtual/2025/poster/116052

CVPR Poster Image Over Text: Transforming Formula Recognition Evaluation with Character Detection Matching, https://cvpr.thecvf.com/virtual/2025/poster/33494

RAG systems: Best practices to master evaluation for accurate and reliable AI., https://cloud.google.com/blog/products/ai-machine-learning/optimizing-rag-retrieval

Solving direct text extraction from PDFs | Sensible Blog, https://www.sensible.so/blog/solving-direct-text-extraction-from-pdfs

Non-Standard Encoding, https://docshield.tungstenautomation.com/NuancePDF/en_US/1.1.0_nv1v1ntpys/help/Non-Standard_Encoding.htm

Handling embedded and non-embedded fonts in PDF & PDF/A documents - PDF Tools, https://www.pdf-tools.com/pdf-knowledge/embedded-non-embedded-fonts-pdf-to-pdfa/

How to handle character encoding issues when extracting text from PDF files using Langchain document loaders? - Latenode Official Community, https://community.latenode.com/t/how-to-handle-character-encoding-issues-when-extracting-text-from-pdf-files-using-langchain-document-loaders/39114

OCR issues extracting math formulas with Document Intelligence - Microsoft Learn, https://learn.microsoft.com/en-ie/answers/questions/2260900/ocr-issues-extracting-math-formulas-with-document

Math Accessibility Guide | Center for Innovation in Teaching & Learning - CITL, https://citl.illinois.edu/math-accessibility-guide

How to Use AI to Summarize Long PDF Technical Reports - MindStudio, https://www.mindstudio.ai/blog/ai-summarize-long-pdf-technical-reports

LemmaHead: RAG Assisted Proof Generation Using Large Language Models - arXiv, https://arxiv.org/html/2501.15797v3

Contextual Chunking for RAG: Solving Context Loss and Anaphoric Reference Problems | by Vishal Mysore | Medium, https://medium.com/@visrow/contextual-chunking-for-rag-solving-context-loss-and-anaphoric-reference-problems-ae45d3c21480

Improving RAG accuracy: 10 techniques that actually work - Redis, https://redis.io/blog/10-techniques-to-improve-rag-accuracy/

Understanding Context and Contextual Retrieval in RAG | Towards Data Science, https://towardsdatascience.com/understanding-context-and-contextual-retrieval-in-rag/

GitHub - HKUDS/RAG-Anything: "RAG-Anything: All-in-One RAG Framework", https://github.com/HKUDS/RAG-Anything

Confident RAG: Enhancing the Performance of LLMs for Mathematics Question Answering through Multi-Embedding and Confidence Scoring - arXiv, https://arxiv.org/html/2507.17442v3

Each to Their Own: Exploring the Optimal Embedding in RAG - arXiv, https://arxiv.org/html/2507.17442v1

MathNet: A Global Multimodal Benchmark for Mathematical Reasoning and Retrieval, https://openreview.net/forum?id=zPvdG1Va5Q

NLP & LLMs for Physics Research The Complete Practical Guide - The Science Atlas, https://thescienceatlas.com/nlp-llms-for-physics-research/

A Comparative Study of PDF Parsing Tools Across Diverse Document Categories - arXiv, https://arxiv.org/pdf/2410.09871

A Comparative Study of PDF Parsing Tools Across Diverse Document Categories - arXiv, https://arxiv.org/html/2410.09871v1

DocLayNet: A Large Human-Annotated Dataset for Document-Layout Segmentation | CoLab, https://colab.ws/articles/10.1145%2F3534678.3539043

Improving Document Layout Analysis Using Synthetic Data Generation and Convolutional Models - MDPI, https://www.mdpi.com/2076-3417/16/6/3089

Dolphin: Document Image Parsing via Heterogeneous Anchor Prompting - arXiv, https://arxiv.org/html/2505.14059v1

CVPR Poster OmniDocBench: Benchmarking Diverse PDF Document Parsing with Comprehensive Annotations, https://cvpr.thecvf.com/virtual/2025/poster/34400

Domain-Specific Adaptation of Vision-Language Models for Arabic OCR - ResearchGate, https://www.researchgate.net/publication/402958054_Domain-Specific_Adaptation_of_Vision-Language_Models_for_Arabic_OCR

opendatalab/UniMERNet: UniMERNet: A Universal ... - GitHub, https://github.com/opendatalab/unimernet

Survey and Performance Analysis of Deep Learning Based Object Detection in Challenging Environments - MDPI, https://www.mdpi.com/1424-8220/21/15/5116

From RAG to Context - A 2025 year-end review of RAG - RAGFlow, https://ragflow.io/blog/rag-review-2025-from-rag-to-context
