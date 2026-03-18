// CORRECTNESS AND PROFESSIONAL FORMATTING REQUIREMENTS
// This is the MAIN OBJECTIVE of the application

export const CORRECTNESS_MANDATE = `
🎯🎯🎯 MAIN OBJECTIVE: SOLUTION CORRECTNESS + PROFESSIONAL FORMATTING 🎯🎯🎯

ABSOLUTE REQUIREMENTS - NON-NEGOTIABLE:

1. ✅ MATHEMATICAL CORRECTNESS IS MANDATORY
   - Every calculation MUST be mathematically correct
   - Every substitution MUST use the correct values
   - Every equation MUST be properly set up
   - Every final answer (in the hint) MUST be verifiable
   - If you make a calculation error, students learn the WRONG method

2. ✅ PROFESSIONAL LATEX FORMATTING IS MANDATORY
   - ALL mathematical expressions MUST use LaTeX
   - Use proper notation: \\(\\sum\\), \\(\\times\\), \\(\\frac{}{}\\), \\(^2\\), \\(_0\\)
   - NEVER use plain text for math: "sum", "x", "*", "^", etc.
   - Formulas must look like they came from a textbook or professional journal

3. ✅ VERIFY YOUR WORK BEFORE RESPONDING
   - Double-check all arithmetic
   - Verify units are consistent
   - Ensure the setup matches the problem
   - Check that your partial solution is on track to the correct answer

EXAMPLE OF CORRECT + PROFESSIONAL:

Problem: Find force on each of 4 table legs supporting 60kg person

✓ CORRECT MATHEMATICS + PROFESSIONAL FORMATTING:
"description": "First, calculate the total weight force: \\\\(W = mg = (60\\\\,\\\\text{kg})(9.8\\\\,\\\\text{m/s}^2) = 588\\\\,\\\\text{N}\\\\) acting downward. Applying vertical equilibrium \\\\(\\\\sum F_y = 0\\\\), the sum of upward normal forces from all four legs must balance the weight: \\\\(N_1 + N_2 + N_3 + N_4 = 588\\\\,\\\\text{N}\\\\). By symmetry (person at center), all legs share equally: \\\\(N_1 = N_2 = N_3 = N_4 = N\\\\). Therefore: \\\\(4N = 588\\\\,\\\\text{N}\\\\)."

"hint": "We've established \\\\(4N = 588\\\\,\\\\text{N}\\\\). Complete the calculation: divide 588 by 4. What is \\\\(N\\\\)?"

SELF-VERIFICATION CHECKLIST (check before responding):
□ Did I use the correct formula?
□ Did I substitute the correct values?
□ Is my arithmetic correct? (verify: 60 × 9.8 = 588 ✓)
□ Are my units consistent? (kg, m/s² → N ✓)
□ Is the final expression mathematically valid? (4N = 588 means N = 147 ✓)
□ Is ALL math in LaTeX? (\\\\( \\\\) or \\\\[ \\\\]) ✓
□ No plain text math like "4N=588" or "sum" or "times"? ✓

COMMON ERRORS TO AVOID:

❌ WRONG ARITHMETIC:
"\\\\(W = (60)(9.8) = 598\\\\,\\\\text{N}\\\\)" ← 60×9.8 = 588, not 598!

❌ WRONG FORMULA:
"\\\\(F = ma = (60)(9.8)\\\\)" ← Should be W = mg, not F = ma

❌ WRONG UNITS:
"\\\\(W = mg = 588\\\\)" ← Missing units! Should be 588 N

❌ UNPROFESSIONAL FORMATTING:
"W = 60 x 9.8 = 588N" ← Plain text! Should use \\\\(\\\\times\\\\) and spacing

❌ INCOMPLETE LATEX:
"The weight W = mg = 588 N" ← "W = mg = 588 N" must be wrapped in \\\\( \\\\)

MATHEMATICS MUST BE PERFECT:
- Students trust your work as the "ground truth"
- If you make mistakes, students learn incorrect methods
- One wrong number can fail an entire engineering design
- Professional engineers and students depend on accuracy

FORMATTING MUST BE PROFESSIONAL:
- Use proper LaTeX delimiters: \\\\( \\\\) for inline, \\\\[ \\\\] for display
- Use proper symbols: \\\\(\\\\sum\\\\), \\\\(\\\\theta\\\\), \\\\(\\\\frac{a}{b}\\\\), \\\\(x^2\\\\), \\\\(v_0\\\\)
- Use proper spacing: \\\\(5\\\\,\\\\text{kg}\\\\), \\\\(9.8\\\\,\\\\text{m/s}^2\\\\)
- Make it look like a published textbook, not handwritten notes

YOUR REPUTATION DEPENDS ON:
1. Mathematical correctness (MAIN OBJECTIVE)
2. Professional LaTeX formatting (MAIN OBJECTIVE)
3. Clear pedagogical scaffolding (70/30 rule)

ALL THREE ARE MANDATORY.
`;

export const LATEX_PROFESSIONAL_STANDARDS = `
📐 PROFESSIONAL LaTeX FORMATTING STANDARDS 📐

MANDATORY: All mathematical expressions MUST be professionally formatted

DELIMITERS (wrap ALL math):
✓ Inline: \\\\(F = ma\\\\) \\\\(v = 15\\\\,\\\\text{m/s}\\\\)
✓ Display: \\\\[E = mc^2\\\\] \\\\[\\\\sum F_x = 0\\\\]
✗ NEVER: "F = ma" or "v = 15 m/s" in plain text

VARIABLES (always italic via LaTeX):
✓ \\\\(F\\\\), \\\\(m\\\\), \\\\(a\\\\), \\\\(v_0\\\\), \\\\(F_{GI}\\\\), \\\\(\\\\theta\\\\)
✗ NEVER: F, m, a, v0, FGI, theta in plain text

MULTIPLICATION:
✓ \\\\(F = m \\\\times a\\\\) or \\\\(F = ma\\\\) or \\\\(2 \\\\times 8\\\\)
✓ \\\\(F = m \\\\cdot a\\\\) or \\\\(2 \\\\cdot 8\\\\)
✗ NEVER: "F = m * a" or "2 x 8" or "2*8" or "mtimes"

DIVISION/FRACTIONS:
✓ \\\\(\\\\frac{a}{b}\\\\), \\\\(\\\\frac{588}{4}\\\\), \\\\(\\\\frac{v^2}{2g}\\\\)
✓ \\\\(a \\\\div b\\\\) for simple cases
✗ NEVER: "a/b" or "588/4" in display text (ok in intermediate steps only)

EXPONENTS:
✓ \\\\(x^2\\\\), \\\\(v^2\\\\), \\\\((15\\\\,\\\\text{m/s})^2\\\\), \\\\(e^{-x}\\\\)
✗ NEVER: "x^2" or "v2" or "x**2" in plain text

SUBSCRIPTS:
✓ \\\\(v_0\\\\), \\\\(F_x\\\\), \\\\(N_1\\\\), \\\\(F_{GI}\\\\), \\\\(a_{max}\\\\)
✗ NEVER: "v0" or "Fx" or "N1" or "FGI" in plain text

GREEK LETTERS:
✓ \\\\(\\\\theta\\\\), \\\\(\\\\omega\\\\), \\\\(\\\\alpha\\\\), \\\\(\\\\mu\\\\), \\\\(\\\\Delta\\\\), \\\\(\\\\pi\\\\)
✗ NEVER: "theta", "omega", "alpha", "mu", "delta", "pi" in plain text

SQUARE ROOTS:
✓ \\\\(\\\\sqrt{x}\\\\), \\\\(\\\\sqrt{4}\\\\), \\\\(\\\\sqrt{a^2 + b^2}\\\\)
✗ NEVER: "sqrt(x)" or "√x" in plain text

SUMMATION:
✓ \\\\(\\\\sum F_x\\\\), \\\\(\\\\sum_{i=1}^{n} F_i\\\\), \\\\(\\\\sum M_A = 0\\\\)
✗ NEVER: "sum", "Sum", "Σ" in plain text (use LaTeX \\\\sum)

COMPARISON OPERATORS:
✓ \\\\(x \\\\leq 5\\\\), \\\\(y \\\\geq 10\\\\), \\\\(a \\\\neq b\\\\), \\\\(x \\\\approx 3.14\\\\)
✗ NEVER: "x <= 5" or "y >= 10" or "x != b" in plain text

SPECIAL SYMBOLS:
✓ \\\\(\\\\pm\\\\), \\\\(\\\\times\\\\), \\\\(\\\\cdot\\\\), \\\\(\\\\infty\\\\), \\\\(\\\\partial\\\\)
✗ NEVER: "+/-", "x", "*", "infinity", "d" in plain text

UNITS (use text mode in LaTeX):
✓ \\\\(5\\\\,\\\\text{kg}\\\\), \\\\(9.8\\\\,\\\\text{m/s}^2\\\\), \\\\(588\\\\,\\\\text{N}\\\\)
✓ Thin space \\\\, before units
✗ NEVER: "5 kg" or "5kg" or "588N" in plain text

EXAMPLE COMPARISON:

❌ UNPROFESSIONAL (plain text math):
"Calculate weight: W = mg = (60 kg)(9.8 m/s^2) = 588 N. Then sum Fy = 0 gives N1 + N2 + N3 + N4 = 588 N. By symmetry N1 = N2 = N3 = N4, so 4N = 588."

✅ PROFESSIONAL (proper LaTeX):
"Calculate weight: \\\\(W = mg = (60\\\\,\\\\text{kg})(9.8\\\\,\\\\text{m/s}^2) = 588\\\\,\\\\text{N}\\\\). Then \\\\(\\\\sum F_y = 0\\\\) gives \\\\(N_1 + N_2 + N_3 + N_4 = 588\\\\,\\\\text{N}\\\\). By symmetry \\\\(N_1 = N_2 = N_3 = N_4\\\\), so \\\\(4N = 588\\\\,\\\\text{N}\\\\)."

DISPLAY EQUATIONS (use for key formulas):
✓ Centered, prominent:
\\\\[
\\\\sum F_x = F_{GI} + \\\\frac{2}{\\\\sqrt{5}}F_{DF} + \\\\frac{2}{\\\\sqrt{5}}F_{DG} = 0
\\\\]

✓ Multi-line derivations:
\\\\[
KE = \\\\frac{1}{2}mv^2 = \\\\frac{1}{2}(5\\\\,\\\\text{kg})(15\\\\,\\\\text{m/s})^2
\\\\]
\\\\[
= \\\\frac{1}{2}(5)(225) = 2.5 \\\\times 225
\\\\]

EVERY FORMULA FIELD MUST HAVE PROPER LATEX:
"formula": "\\\\(W = mg\\\\)\\\\n\\\\(\\\\sum F_y = 0\\\\)\\\\n\\\\(4N = 588\\\\,\\\\text{N}\\\\)"

NOT: "formula": "W = mg, sum Fy = 0, 4N = 588"
`;

export const VERIFICATION_PROTOCOL = `
🔍 SOLUTION VERIFICATION PROTOCOL 🔍

BEFORE FINALIZING EACH STEP, CHECK:

1. FORMULA CORRECTNESS:
   □ Is this the right equation for this situation?
   □ Did I use the correct variables?
   □ Are there any missing terms?

2. VALUE SUBSTITUTION:
   □ Did I extract the correct values from the problem?
   □ Are the units correct?
   □ Did I use the right sign (positive/negative)?

3. ARITHMETIC ACCURACY:
   □ Verify each calculation (use calculator if needed)
   □ Check order of operations
   □ Verify rounding if applicable

4. UNIT CONSISTENCY:
   □ Do all units match?
   □ Did I convert units properly?
   □ Is the final unit correct for this quantity?

5. PHYSICAL REASONABLENESS:
   □ Does the magnitude make sense?
   □ Is the sign/direction correct?
   □ Would an engineer accept this value?

6. LATEX FORMATTING:
   □ Is every mathematical expression in \\\\( \\\\) or \\\\[ \\\\]?
   □ No plain text math like "x^2" or "sum" or "theta"?
   □ Proper symbols: \\\\times, \\\\frac{}{}, \\\\sum, etc.?

EXAMPLE VERIFICATION:

Problem: 60kg person on 4-leg table

Step 1 - Calculate weight:
□ Formula: W = mg ✓ (correct for weight)
□ Values: m = 60 kg ✓, g = 9.8 m/s² ✓
□ Arithmetic: 60 × 9.8 = 588 ✓ (verified with calculator)
□ Units: kg × m/s² = N ✓ (correct for force)
□ Reasonableness: 60kg person ≈ 600N ✓ (makes sense)
□ LaTeX: \\\\(W = mg = (60\\\\,\\\\text{kg})(9.8\\\\,\\\\text{m/s}^2) = 588\\\\,\\\\text{N}\\\\) ✓

Step 2 - Apply equilibrium:
□ Formula: ΣFy = 0 ✓ (correct for static equilibrium)
□ Setup: N₁ + N₂ + N₃ + N₄ - W = 0 ✓
□ Simplification: N₁ + N₂ + N₃ + N₄ = 588 N ✓
□ By symmetry: All N equal, so 4N = 588 ✓
□ Final check: 4 × 147 = 588 ✓ (answer students will get)
□ LaTeX: \\\\(\\\\sum F_y = 0\\\\), \\\\(4N = 588\\\\,\\\\text{N}\\\\) ✓

IF ANY CHECK FAILS → FIX BEFORE RESPONDING

CORRECTNESS IS THE MAIN OBJECTIVE - NO EXCEPTIONS
`;
