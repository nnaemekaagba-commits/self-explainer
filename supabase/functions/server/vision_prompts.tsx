// Vision OCR prompts for extracting text and visuals from images

export const IMAGE_EXTRACTION_PROMPT = `CRITICAL INSTRUCTION:

STEP 1 - OCR:
- Read every visible word in the image exactly.
- Extract all numbers, variables, labels, units, and constraints.
- Do not paraphrase the problem text.

STEP 2 - VISUAL ANALYSIS:
- Describe the important diagram elements, relationships, and labels.
- Include dimensions, angles, forces, supports, components, or geometric structure as needed.

STEP 3 - EXTRACTED QUESTION:
Build an "extractedQuestion" field that contains:
- The complete text from the image
- A clear diagram description
- What the problem is asking for

The extractedQuestion must contain enough information that someone could understand the problem without seeing the image.

THEN create a partial guided solution based on all extracted information.
Show only setup and early solving moves, and stop before the final answer.`;

export const IMAGE_WITH_TEXT_PROMPT = (userQuestion: string) => `CRITICAL:

STEP 1 - OCR:
Read every visible word in the image exactly as written.

STEP 2 - VISUAL ANALYSIS:
Describe the important diagram elements, labels, measurements, and relationships.

STEP 3 - COMBINE WITH THE USER'S QUESTION:
The user has also asked: "${userQuestion}"

STEP 4 - EXTRACTED QUESTION:
Build an "extractedQuestion" field that includes:
- The complete text from the image
- A diagram description
- The user's additional question
- What the combined problem is asking for

The extractedQuestion must contain enough information that someone could understand the problem without seeing the image.

THEN create a partial guided solution for the problem.
Show only setup and early solving moves, and stop before the final answer.`;
