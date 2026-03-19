// Intelligent formula generation based on step content.
// The formula field must contain equations only, with no prose labels.

function lines(...equations: string[]): string {
  return equations.map((equation) => `\\[${equation}\\]`).join("\n");
}

export function generateIntelligentFormula(step: any, stepIndex: number): string {
  const desc = (step.description || "").toLowerCase();
  const title = (step.title || "").toLowerCase();
  const hint = (step.hint || "").toLowerCase();
  const combined = `${desc} ${title} ${hint}`;

  if (combined.match(/\b(force|newton|mass.*acceleration|f\s*=\s*ma|weight)\b/i)) {
    return lines(
      "F = ma",
      "W = mg",
      "g = 9.8\\,\\text{m/s}^2"
    );
  }

  if (combined.match(/\b(equilibrium|static|balance|sum.*force.*zero|moment)\b/i)) {
    return lines(
      "\\sum F_x = 0",
      "\\sum F_y = 0",
      "\\sum M = 0"
    );
  }

  if (combined.match(/\b(friction|slide|static friction|kinetic|\\mu|coefficient)\b/i)) {
    return lines(
      "f_s \\leq \\mu_s N",
      "f_{s,\\max} = \\mu_s N",
      "f_k = \\mu_k N"
    );
  }

  if (combined.match(/\b(incline|slope|ramp|parallel|perpendicular|component)\b/i)) {
    return lines(
      "W_{\\parallel} = mg\\sin\\theta",
      "W_{\\perp} = mg\\cos\\theta",
      "N = W_{\\perp}"
    );
  }

  if (combined.match(/\b(velocity|acceleration|motion|kinematic|distance|position|displacement)\b/i)) {
    return lines(
      "v = v_0 + at",
      "x = x_0 + v_0 t + \\frac{1}{2}at^2",
      "v^2 = v_0^2 + 2a(x - x_0)"
    );
  }

  if (combined.match(/\b(energy|kinetic|potential|work|conservation.*energy)\b/i)) {
    return lines(
      "KE = \\frac{1}{2}mv^2",
      "PE = mgh",
      "W = Fd\\cos\\theta",
      "E_{\\text{total}} = KE + PE"
    );
  }

  if (combined.match(/\b(momentum|collision|impulse|conservation.*momentum)\b/i)) {
    return lines(
      "p = mv",
      "J = \\Delta p = F\\Delta t",
      "m_1 v_1 + m_2 v_2 = m_1 v_1' + m_2 v_2'"
    );
  }

  if (combined.match(/\b(circular|centripetal|angular|rotation|radius)\b/i)) {
    return lines(
      "a_c = \\frac{v^2}{r}",
      "F_c = \\frac{mv^2}{r}",
      "\\omega = \\frac{v}{r}",
      "v = r\\omega"
    );
  }

  if (combined.match(/\b(torque|lever|pivot|rotation.*axis)\b/i)) {
    return lines(
      "\\tau = rF\\sin\\theta",
      "\\sum \\tau = I\\alpha",
      "L = I\\omega"
    );
  }

  if (combined.match(/\b(circuit|resistor|current|voltage|ohm|resistance|kvl|kcl)\b/i)) {
    return lines(
      "V = IR",
      "P = IV = I^2R = \\frac{V^2}{R}",
      "\\sum V_{\\text{loop}} = 0",
      "\\sum I_{\\text{node}} = 0"
    );
  }

  if (combined.match(/\b(capacitor|charge|electric field|dielectric)\b/i)) {
    return lines(
      "Q = CV",
      "E = \\frac{1}{2}CV^2",
      "C = \\frac{\\varepsilon_0 A}{d}"
    );
  }

  if (combined.match(/\b(magnetic|field|flux|induction|faraday)\b/i)) {
    return lines(
      "F = qvB\\sin\\theta",
      "\\Phi = BA\\cos\\theta",
      "\\mathcal{E} = -\\frac{d\\Phi}{dt}"
    );
  }

  if (combined.match(/\b(wave|frequency|wavelength|period|oscillation)\b/i)) {
    return lines(
      "v = f\\lambda",
      "T = \\frac{1}{f}",
      "\\omega = 2\\pi f",
      "k = \\frac{2\\pi}{\\lambda}"
    );
  }

  if (combined.match(/\b(projectile|trajectory|launch|parabolic|throw)\b/i)) {
    return lines(
      "x = v_0\\cos\\theta \\cdot t",
      "y = v_0\\sin\\theta \\cdot t - \\frac{1}{2}gt^2",
      "v_x = v_0\\cos\\theta",
      "v_y = v_0\\sin\\theta - gt"
    );
  }

  if (combined.match(/\b(triangle|pythagorean|angle|sine|cosine|tangent|trig)\b/i)) {
    return lines(
      "a^2 + b^2 = c^2",
      "\\sin\\theta = \\frac{\\text{opp}}{\\text{hyp}}",
      "\\cos\\theta = \\frac{\\text{adj}}{\\text{hyp}}",
      "\\tan\\theta = \\frac{\\text{opp}}{\\text{adj}}"
    );
  }

  if (combined.match(/\b(circle|area|circumference|diameter|sector)\b/i)) {
    return lines(
      "A = \\pi r^2",
      "C = 2\\pi r = \\pi d",
      "A_{\\text{sector}} = \\frac{1}{2}r^2\\theta",
      "s = r\\theta"
    );
  }

  if (combined.match(/\b(volume|sphere|cylinder|cone|surface area)\b/i)) {
    return lines(
      "V_{\\text{sphere}} = \\frac{4}{3}\\pi r^3",
      "V_{\\text{cylinder}} = \\pi r^2 h",
      "V_{\\text{cone}} = \\frac{1}{3}\\pi r^2 h",
      "A_{\\text{sphere}} = 4\\pi r^2"
    );
  }

  if (combined.match(/\b(vector|component|magnitude|direction|dot product|cross product)\b/i)) {
    return lines(
      "|\\vec{v}| = \\sqrt{v_x^2 + v_y^2 + v_z^2}",
      "\\vec{a} \\cdot \\vec{b} = ab\\cos\\theta",
      "|\\vec{a} \\times \\vec{b}| = ab\\sin\\theta"
    );
  }

  if (combined.match(/\b(quadratic|solve.*equation|root|parabola)\b/i)) {
    return lines(
      "ax^2 + bx + c = 0",
      "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
      "\\Delta = b^2 - 4ac"
    );
  }

  if (combined.match(/\b(linear|slope|line|y.*=.*mx)\b/i)) {
    return lines(
      "y = mx + b",
      "m = \\frac{y_2 - y_1}{x_2 - x_1}",
      "y - y_1 = m(x - x_1)"
    );
  }

  if (combined.match(/\b(system.*equation|simultaneous|substitution|elimination)\b/i)) {
    return lines(
      "a_1 x + b_1 y = c_1",
      "a_2 x + b_2 y = c_2"
    );
  }

  if (combined.match(/\b(derivative|rate of change|tangent|differentiate)\b/i)) {
    return lines(
      "\\frac{d}{dx}(x^n) = nx^{n-1}",
      "\\frac{d}{dx}(e^x) = e^x",
      "\\frac{d}{dx}(\\sin x) = \\cos x",
      "\\frac{d}{dx}(\\ln x) = \\frac{1}{x}"
    );
  }

  if (combined.match(/\b(integral|area under|antiderivative|integrate)\b/i)) {
    return lines(
      "\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C",
      "\\int e^x\\,dx = e^x + C",
      "\\int \\sin x\\,dx = -\\cos x + C",
      "\\int \\frac{1}{x}\\,dx = \\ln|x| + C"
    );
  }

  if (combined.match(/\b(heat|temperature|thermal|gas law|entropy)\b/i)) {
    return lines(
      "Q = mc\\Delta T",
      "PV = nRT",
      "\\Delta U = Q - W",
      "W = P\\Delta V"
    );
  }

  if (combined.match(/\b(pressure|fluid|density|buoyancy|flow)\b/i)) {
    return lines(
      "P = \\frac{F}{A}",
      "P = \\rho gh",
      "F_b = \\rho Vg",
      "A_1 v_1 = A_2 v_2"
    );
  }

  if (combined.match(/\b(lens|mirror|focal|image|refraction|reflection)\b/i)) {
    return lines(
      "\\frac{1}{f} = \\frac{1}{d_o} + \\frac{1}{d_i}",
      "m = -\\frac{d_i}{d_o} = \\frac{h_i}{h_o}",
      "n_1\\sin\\theta_1 = n_2\\sin\\theta_2"
    );
  }

  if (combined.match(/\b(probability|statistics|mean|variance|distribution)\b/i)) {
    return lines(
      "P(A \\cup B) = P(A) + P(B) - P(A \\cap B)",
      "\\mu = \\frac{\\sum x_i}{n}",
      "\\sigma^2 = \\frac{\\sum (x_i - \\mu)^2}{n}"
    );
  }

  if (stepIndex === 0 || title.match(/\b(identify|analyze|determine|understand|draw|sketch)\b/i)) {
    return lines(
      "\\text{Known values} = \\{\\cdots\\}",
      "\\text{Unknown quantity} = \\{\\cdots\\}",
      "\\text{Governing equation(s)} = \\{\\cdots\\}"
    );
  }

  if (title.match(/\b(set.*up|write|establish|formulate)\b/i)) {
    return lines(
      "\\text{governing equation}",
      "\\text{substitute known values}",
      "\\text{simplify algebraically}"
    );
  }

  if (title.match(/\b(calculate|compute|solve|find|obtain)\b/i)) {
    return lines(
      "\\text{unknown} = \\text{partially simplified expression}",
      "\\text{units} = \\text{consistent}"
    );
  }

  if (title.match(/\b(verify|check|validate|confirm)\b/i)) {
    return lines(
      "\\text{units are consistent}",
      "\\text{result is physically reasonable}"
    );
  }

  return lines(
    "\\text{relevant governing equation}",
    "\\text{substitute known values}",
    "\\text{leave final arithmetic for the student}"
  );
}
