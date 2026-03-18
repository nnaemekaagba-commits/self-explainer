// Vision OCR prompts for extracting text and visuals from images

export const IMAGE_EXTRACTION_PROMPT = `CRITICAL INSTRUCTION - YOUR #1 PRIORITY

FIRST: Perform OCR (Optical Character Recognition) on this image. READ EVERY SINGLE WORD OF TEXT visible in the image.

MANDATORY: The image contains TEXT that you MUST read and transcribe EXACTLY. This is your PRIMARY task.

===============================================================================

STEP 1 - OPTICAL CHARACTER RECOGNITION (OCR) - HIGHEST PRIORITY:
===============================================================================

YOU MUST:
- Read and transcribe ALL written text from the image - WORD FOR WORD
- Include EVERY sentence, paragraph, question, and instruction shown
- Extract ALL numbers, variables, units, and constraints mentioned in the text
- Copy the text EXACTLY as it appears - do not paraphrase, summarize, or interpret
- If there are multiple paragraphs or sections, extract ALL of them in order
- Include any questions being asked (e.g., "Determine...", "Calculate...", "Find...")

Examples of text to extract:
- "A 60 kg person stands at the center of a rectangular table..."
- "The beam is subjected to a distributed load of 5 kN/m..."
- "Determine the maximum allowable value of mass m if the tension..."
- "Calculate the reaction forces at supports A and B..."
- "The circuit contains a 12V battery and three resistors..."

===============================================================================

STEP 2 - ANALYZE VISUAL/DIAGRAM ELEMENTS:
===============================================================================

After reading all text, describe the diagram/visual:
- Structural elements (beams, trusses, members, supports, pins, rockers, hinges)
- Circuit elements (resistors, capacitors, voltage sources, current sources)
- Mechanical components (masses, pulleys, springs, dampers, forces)
- Geometric figures (triangles, rectangles, angles, dimensions)
- Measurements and dimensions shown (3 m, 45°, 5 kN, etc.)
- Force arrows, load distributions, moment directions
- Support types and boundary conditions
- Labels on diagram elements (points A, B, C; members AB, BC, CD; etc.)

===============================================================================

STEP 3 - CREATE THE "extractedQuestion" FIELD IN YOUR JSON:
===============================================================================

Your "extractedQuestion" field MUST contain:

**[COMPLETE TEXT FROM IMAGE - TRANSCRIBED WORD-FOR-WORD]**

[If there's text in the image, paste it here EXACTLY as written. Do NOT skip this.]

**Diagram/Visual Description:**
[Detailed description of the diagram, including all structural elements, dimensions, forces, supports, labels, and geometric configuration]

**What to Find:**
[What the problem is asking you to calculate or determine]

===============================================================================

CRITICAL REQUIREMENT
The extractedQuestion field must be so complete that a student reading ONLY that field (without seeing the original image) has 100% of the information needed to solve the problem.

===============================================================================

Then create a complete guided solution based on all extracted information.`;

export const IMAGE_WITH_TEXT_PROMPT = (userQuestion: string) => `CRITICAL: READ ALL TEXT FROM THIS IMAGE

STEP 1 - PERFORM OCR (Optical Character Recognition):
Read and transcribe EVERY word of text visible in this image EXACTLY as written.
- Extract ALL sentences, paragraphs, numbers, variables, units, and constraints
- Do NOT paraphrase - copy the text WORD-FOR-WORD
- Include everything: problem statements, questions, instructions, given data

STEP 2 - ANALYZE THE VISUAL/DIAGRAM:
Describe all visual elements in detail:
- Structural/circuit/mechanical components shown
- All dimensions, measurements, angles, and labels
- Forces, loads, supports, boundary conditions
- Geometric configuration and spatial relationships

STEP 3 - INTEGRATE WITH USER'S ADDITIONAL QUESTION:
The user has also asked: "${userQuestion}"

Combine the extracted text from the image with the user's question to form the complete problem.

STEP 4 - CREATE "extractedQuestion" FIELD:
Your "extractedQuestion" must include:

**[COMPLETE TEXT FROM IMAGE - TRANSCRIBED EXACTLY]**

[Paste all text from the image here word-for-word]

**Diagram Description:**
[Detailed description of all visual elements]

**User's Additional Question:**
"${userQuestion}"

**What to Find:**
[Combined: what the image asks + what the user asks]

===============================================================================
The extractedQuestion must be so complete that someone reading it without the image has ALL the information to solve the problem.
===============================================================================

Then create a guided solution for the complete problem.`;