// Intelligent formula generation based on step content
// Provides contextual mathematical scaffolding when AI fails to include formulas
//
// INTEGRATION: This function is called automatically in /supabase/functions/server/index.tsx
// when the AI's response is missing formulas in any step. It analyzes the step's
// description, title, and hint to provide relevant equations that support student learning.
//
// UPDATED: Now integrated with partial solution approach - formulas support the engineering
// thinking prompts and help students complete the work started in the description field.

export function generateIntelligentFormula(step: any, stepIndex: number): string {
  const desc = (step.description || "").toLowerCase();
  const title = (step.title || "").toLowerCase();
  const hint = (step.hint || "").toLowerCase();
  const combined = desc + " " + title + " " + hint;
  
  // Physics - Forces and Newton's Laws
  if (combined.match(/\b(force|newton|mass.*acceleration|f\s*=\s*ma)\b/i)) {
    return "\\(F = ma\\)\\n\\(W = mg\\)\\n\\(g = 9.8\\,\\text{m/s}^2\\)\\nNewton's second law and gravitational force";
  }
  
  // Equilibrium/Static Analysis
  if (combined.match(/\b(equilibrium|static|balance|sum.*force.*zero)\b/i)) {
    return "\\(\\sum F_x = 0\\)\\n\\(\\sum F_y = 0\\)\\n\\(\\sum \\tau = 0\\)\\nEquilibrium conditions for static systems";
  }
  
  // Friction
  if (combined.match(/\b(friction|slide|static friction|kinetic|\\mu|coefficient)\b/i)) {
    return "\\(f_s \\leq \\mu_s N\\)\\n\\(f_{s,\\text{max}} = \\mu_s N\\)\\n\\(f_k = \\mu_k N\\)\\nwhere \\(\\mu_s\\) is static friction coefficient, \\(\\mu_k\\) is kinetic friction coefficient, and \\(N\\) is normal force";
  }
  
  // Inclined Plane
  if (combined.match(/\b(incline|slope|ramp|parallel|perpendicular|component)\b/i)) {
    return "\\(W_{\\parallel} = W\\sin\\theta = mg\\sin\\theta\\)\\n\\(W_{\\perp} = W\\cos\\theta = mg\\cos\\theta\\)\\n\\(N = W_{\\perp}\\)\\nForce components on inclined plane";
  }
  
  // Kinematics/Motion
  if (combined.match(/\b(velocity|acceleration|motion|kinematic|distance|position|displacement)\b/i)) {
    return "\\(v = v_0 + at\\)\\n\\(x = x_0 + v_0t + \\frac{1}{2}at^2\\)\\n\\(v^2 = v_0^2 + 2a(x - x_0)\\)\\nKinematic equations for constant acceleration";
  }
  
  // Energy
  if (combined.match(/\b(energy|kinetic|potential|work|conservation.*energy)\b/i)) {
    return "\\(KE = \\frac{1}{2}mv^2\\)\\n\\(PE = mgh\\)\\n\\(W = Fd\\cos\\theta\\)\\n\\(E_{\\text{total}} = KE + PE = \\text{constant}\\)\\nEnergy and work-energy theorem";
  }
  
  // Momentum
  if (combined.match(/\b(momentum|collision|impulse|conservation.*momentum)\b/i)) {
    return "\\(p = mv\\)\\n\\(J = \\Delta p = F\\Delta t\\)\\n\\(m_1v_1 + m_2v_2 = m_1v_1' + m_2v_2'\\)\\nMomentum and impulse";
  }
  
  // Circular Motion
  if (combined.match(/\b(circular|centripetal|angular|rotation|radius)\b/i)) {
    return "\\(a_c = \\frac{v^2}{r}\\)\\n\\(F_c = \\frac{mv^2}{r}\\)\\n\\(\\omega = \\frac{v}{r}\\)\\n\\(v = r\\omega\\)\\nCircular motion equations";
  }
  
  // Torque and Rotation
  if (combined.match(/\b(torque|lever|moment|pivot|rotation.*axis)\b/i)) {
    return "\\(\\tau = rF\\sin\\theta\\)\\n\\(\\sum \\tau = I\\alpha\\)\\n\\(L = I\\omega\\)\\nTorque and rotational motion";
  }
  
  // Electricity - Circuits
  if (combined.match(/\b(circuit|resistor|current|voltage|ohm|resistance)\b/i)) {
    return "\\(V = IR\\) (Ohm's Law)\\n\\(P = IV = I^2R = \\frac{V^2}{R}\\)\\n\\(R_{\\text{series}} = R_1 + R_2 + ...\\)\\n\\(\\frac{1}{R_{\\text{parallel}}} = \\frac{1}{R_1} + \\frac{1}{R_2} + ...\\)";
  }
  
  // Electricity - Capacitors
  if (combined.match(/\b(capacitor|charge|electric field|dielectric)\b/i)) {
    return "\\(Q = CV\\)\\n\\(E = \\frac{1}{2}CV^2 = \\frac{1}{2}QV\\)\\n\\(C = \\frac{\\epsilon_0 A}{d}\\)\\nCapacitance equations";
  }
  
  // Electromagnetism
  if (combined.match(/\b(magnetic|field|flux|induction|faraday)\b/i)) {
    return "\\(F = qvB\\sin\\theta\\)\\n\\(\\Phi = BA\\cos\\theta\\)\\n\\(\\mathcal{E} = -\\frac{d\\Phi}{dt}\\)\\nElectromagnetic relationships";
  }
  
  // Waves
  if (combined.match(/\b(wave|frequency|wavelength|period|oscillation)\b/i)) {
    return "\\(v = f\\lambda\\)\\n\\(T = \\frac{1}{f}\\)\\n\\(\\omega = 2\\pi f\\)\\n\\(k = \\frac{2\\pi}{\\lambda}\\)\\nWave relationships";
  }
  
  // Projectile Motion
  if (combined.match(/\b(projectile|trajectory|launch|parabolic|throw)\b/i)) {
    return "\\(x = v_0\\cos\\theta \\cdot t\\)\\n\\(y = v_0\\sin\\theta \\cdot t - \\frac{1}{2}gt^2\\)\\n\\(v_x = v_0\\cos\\theta\\)\\n\\(v_y = v_0\\sin\\theta - gt\\)\\nProjectile motion";
  }
  
  // Geometry - Triangles
  if (combined.match(/\b(triangle|pythagorean|angle|sine|cosine|tangent|trig)\b/i)) {
    return "\\(a^2 + b^2 = c^2\\) (Pythagorean theorem)\\n\\(\\sin\\theta = \\frac{\\text{opp}}{\\text{hyp}}\\)\\n\\(\\cos\\theta = \\frac{\\text{adj}}{\\text{hyp}}\\)\\n\\(\\tan\\theta = \\frac{\\text{opp}}{\\text{adj}}\\)";
  }
  
  // Geometry - Circles/Areas
  if (combined.match(/\b(circle|area|circumference|radius|diameter|sector)\b/i)) {
    return "\\(A = \\pi r^2\\)\\n\\(C = 2\\pi r = \\pi d\\)\\n\\(A_{\\text{sector}} = \\frac{1}{2}r^2\\theta\\)\\n\\(s = r\\theta\\)\\nCircle geometry";
  }
  
  // Geometry - Volumes
  if (combined.match(/\b(volume|sphere|cylinder|cone|surface area)\b/i)) {
    return "\\(V_{\\text{sphere}} = \\frac{4}{3}\\pi r^3\\)\\n\\(V_{\\text{cylinder}} = \\pi r^2 h\\)\\n\\(V_{\\text{cone}} = \\frac{1}{3}\\pi r^2 h\\)\\n\\(A_{\\text{sphere}} = 4\\pi r^2\\)";
  }
  
  // Vectors
  if (combined.match(/\b(vector|component|magnitude|direction|dot product|cross product)\b/i)) {
    return "\\(|\\vec{v}| = \\sqrt{v_x^2 + v_y^2 + v_z^2}\\)\\n\\(\\vec{a} \\cdot \\vec{b} = ab\\cos\\theta\\)\\n\\(|\\vec{a} \\times \\vec{b}| = ab\\sin\\theta\\)\\nVector operations";
  }
  
  // Algebra - Quadratic
  if (combined.match(/\b(quadratic|solve.*equation|root|parabola)\b/i)) {
    return "\\(ax^2 + bx + c = 0\\)\\n\\(x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\)\\n\\(\\text{discriminant} = b^2 - 4ac\\)\\nQuadratic formula";
  }
  
  // Algebra - Linear
  if (combined.match(/\b(linear|slope|line|y.*=.*mx)\b/i)) {
    return "\\(y = mx + b\\)\\n\\(m = \\frac{y_2 - y_1}{x_2 - x_1}\\)\\n\\(y - y_1 = m(x - x_1)\\)\\nLinear equations";
  }
  
  // Algebra - Systems
  if (combined.match(/\b(system.*equation|simultaneous|substitution|elimination)\b/i)) {
    return "\\(a_1x + b_1y = c_1\\)\\n\\(a_2x + b_2y = c_2\\)\\nSolve by substitution, elimination, or matrix methods";
  }
  
  // Calculus - Derivatives
  if (combined.match(/\b(derivative|rate of change|slope|tangent|differentiate)\b/i)) {
    return "\\(\\frac{d}{dx}(x^n) = nx^{n-1}\\)\\n\\(\\frac{d}{dx}(e^x) = e^x\\)\\n\\(\\frac{d}{dx}(\\sin x) = \\cos x\\)\\n\\(\\frac{d}{dx}(\\ln x) = \\frac{1}{x}\\)";
  }
  
  // Calculus - Integrals
  if (combined.match(/\b(integral|area under|antiderivative|integrate)\b/i)) {
    return "\\(\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C\\)\\n\\(\\int e^x\\,dx = e^x + C\\)\\n\\(\\int \\sin x\\,dx = -\\cos x + C\\)\\n\\(\\int \\frac{1}{x}\\,dx = \\ln|x| + C\\)";
  }
  
  // Thermodynamics
  if (combined.match(/\b(heat|temperature|thermal|gas law|entropy)\b/i)) {
    return "\\(Q = mc\\Delta T\\)\\n\\(PV = nRT\\)\\n\\(\\Delta U = Q - W\\)\\n\\(W = P\\Delta V\\)\\nThermodynamics";
  }
  
  // Fluid Dynamics
  if (combined.match(/\b(pressure|fluid|density|buoyancy|flow)\b/i)) {
    return "\\(P = \\frac{F}{A}\\)\\n\\(P = \\rho gh\\)\\n\\(F_b = \\rho Vg\\)\\n\\(A_1v_1 = A_2v_2\\)\\nFluid mechanics";
  }
  
  // Optics
  if (combined.match(/\b(lens|mirror|focal|image|refraction|reflection)\b/i)) {
    return "\\(\\frac{1}{f} = \\frac{1}{d_o} + \\frac{1}{d_i}\\)\\n\\(m = -\\frac{d_i}{d_o} = \\frac{h_i}{h_o}\\)\\n\\(n_1\\sin\\theta_1 = n_2\\sin\\theta_2\\)\\nOptics equations";
  }
  
  // Probability/Statistics
  if (combined.match(/\b(probability|statistics|mean|variance|distribution)\b/i)) {
    return "\\(P(A \\cup B) = P(A) + P(B) - P(A \\cap B)\\)\\n\\(\\mu = \\frac{\\sum x_i}{n}\\)\\n\\(\\sigma^2 = \\frac{\\sum (x_i - \\mu)^2}{n}\\)";
  }
  
  // Step-based fallback if no keywords match
  if (stepIndex === 0 || title.match(/\b(identify|analyze|determine|understand|draw|sketch)\b/i)) {
    return "\\(\\text{Identify given values: } x_1, x_2, ...\\)\\n\\(\\text{Identify unknown: } y\\)\\n\\(\\text{List relevant principles and equations}\\)";
  } else if (title.match(/\b(set.*up|write|establish|formulate)\b/i)) {
    return "\\(\\text{Select appropriate governing equation(s)}\\)\\n\\(\\text{Substitute known values}\\)\\n\\(\\text{Simplify algebraically}\\)";
  } else if (title.match(/\b(calculate|compute|solve|find|obtain)\b/i)) {
    return "\\(\\text{Solve for the unknown variable}\\)\\n\\(\\text{Perform mathematical operations}\\)\\n\\(\\text{Check units and significant figures}\\)";
  } else if (title.match(/\b(verify|check|validate|confirm)\b/i)) {
    return "\\(\\text{Verify units are consistent}\\)\\n\\(\\text{Check if result is physically reasonable}\\)\\n\\(\\text{Compare with expected magnitudes}\\)";
  }
  
  // Generic fallback as last resort - still provide SOME mathematical structure
  return "\\(\\text{Step } " + (stepIndex + 1) + "\\text{ equation(s)}\\)\\n\\(\\text{Apply relevant mathematical principles}\\)\\n\\(\\text{Use systematic problem-solving}\\)";
}
