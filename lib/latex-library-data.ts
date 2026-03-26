export type LibraryItem = {
  id: string;
  label: string;
  /** Raw LaTeX to insert (no delimiters for inline-style snippets). */
  latex: string;
};

export type LibraryCategory = {
  id: string;
  title: string;
  items: LibraryItem[];
};

export type LibrarySubject = {
  id: string;
  title: string;
  categories: LibraryCategory[];
};

export const LATEX_LIBRARY: LibrarySubject[] = [
  {
    id: "general",
    title: "General",
    categories: [
      {
        id: "greek",
        title: "Greek letters",
        items: [
          { id: "g-a", label: "α alpha", latex: "\\alpha" },
          { id: "g-b", label: "β beta", latex: "\\beta" },
          { id: "g-g", label: "γ gamma", latex: "\\gamma" },
          { id: "g-d", label: "δ delta", latex: "\\delta" },
          { id: "g-D", label: "Δ Delta", latex: "\\Delta" },
          { id: "g-e", label: "ε varepsilon", latex: "\\varepsilon" },
          { id: "g-t", label: "θ theta", latex: "\\theta" },
          { id: "g-l", label: "λ lambda", latex: "\\lambda" },
          { id: "g-m", label: "μ mu", latex: "\\mu" },
          { id: "g-p", label: "π pi", latex: "\\pi" },
          { id: "g-s", label: "σ sigma", latex: "\\sigma" },
          { id: "g-S", label: "Σ Sigma", latex: "\\Sigma" },
          { id: "g-o", label: "ω omega", latex: "\\omega" },
          { id: "g-O", label: "Ω Omega", latex: "\\Omega" },
        ],
      },
      {
        id: "ops",
        title: "Common symbols",
        items: [
          { id: "o-pm", label: "± plus-minus", latex: "\\pm" },
          { id: "o-cd", label: "· dot", latex: "\\cdot" },
          { id: "o-times", label: "× times", latex: "\\times" },
          { id: "o-div", label: "÷ div", latex: "\\div" },
          { id: "o-infty", label: "∞ infinity", latex: "\\infty" },
          { id: "o-partial", label: "∂ partial", latex: "\\partial" },
          { id: "o-nabla", label: "∇ nabla", latex: "\\nabla" },
          { id: "o-sqrt", label: "√ square root", latex: "\\sqrt{x}" },
          { id: "o-sum", label: "Σ summation", latex: "\\sum_{i=1}^{n}" },
          { id: "o-prod", label: "Π product", latex: "\\prod_{i=1}^{n}" },
          { id: "o-int", label: "∫ integral", latex: "\\int_a^b" },
          { id: "o-iint", label: "∬ double integral", latex: "\\iint_D" },
        ],
      },
      {
        id: "eq-general",
        title: "Equation templates",
        items: [
          {
            id: "ge-frac",
            label: "Fraction",
            latex: "\\frac{a}{b}",
          },
          {
            id: "ge-align",
            label: "Aligned equations",
            latex: "\\begin{align}\n  x &= y \\\\\n  a &= b\n\\end{align}",
          },
          {
            id: "ge-cases",
            label: "Piecewise (cases)",
            latex:
              "f(x) = \\begin{cases}\n  0 & x < 0 \\\\\n  1 & x \\geq 0\n\\end{cases}",
          },
        ],
      },
    ],
  },
  {
    id: "calculus",
    title: "Calculus",
    categories: [
      {
        id: "calc-sym",
        title: "Symbols",
        items: [
          { id: "c-lim", label: "Limit", latex: "\\lim_{x \\to a}" },
          { id: "c-deriv", label: "Derivative (Leibniz)", latex: "\\frac{d}{dx}" },
          {
            id: "c-pderiv",
            label: "Partial derivative",
            latex: "\\frac{\\partial}{\\partial x}",
          },
          { id: "c-intdef", label: "Definite integral", latex: "\\int_a^b f(x)\\,dx" },
          { id: "c-oint", label: "Contour integral", latex: "\\oint_C" },
        ],
      },
      {
        id: "calc-eq",
        title: "Equations",
        items: [
          {
            id: "ce-ftc",
            label: "Fundamental theorem",
            latex: "\\int_a^b f'(x)\\,dx = f(b) - f(a)",
          },
          {
            id: "ce-taylor",
            label: "Taylor series",
            latex:
              "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n",
          },
          {
            id: "ce-lhop",
            label: "L'Hôpital form",
            latex: "\\lim_{x\\to a} \\frac{f(x)}{g(x)}",
          },
        ],
      },
    ],
  },
  {
    id: "linear",
    title: "Linear algebra",
    categories: [
      {
        id: "la-sym",
        title: "Symbols",
        items: [
          {
            id: "la-mat",
            label: "2×2 matrix",
            latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
          },
          {
            id: "la-vec",
            label: "Vector",
            latex: "\\begin{pmatrix} x \\\\ y \\end{pmatrix}",
          },
          { id: "la-det", label: "Determinant", latex: "\\det(A)" },
          { id: "la-tr", label: "Trace", latex: "\\mathrm{tr}(A)" },
          { id: "la-ip", label: "Inner product", latex: "\\langle u, v \\rangle" },
        ],
      },
      {
        id: "la-eq",
        title: "Equations",
        items: [
          {
            id: "lae-axb",
            label: "Linear system",
            latex: "A\\mathbf{x} = \\mathbf{b}",
          },
          {
            id: "lae-eig",
            label: "Eigenvalue equation",
            latex: "A\\mathbf{v} = \\lambda \\mathbf{v}",
          },
        ],
      },
    ],
  },
  {
    id: "physics",
    title: "Physics",
    categories: [
      {
        id: "ph-sym",
        title: "Symbols",
        items: [
          { id: "p-vec", label: "Vector arrow", latex: "\\vec{F}" },
          { id: "p-hat", label: "Unit vector", latex: "\\hat{\\imath}" },
          { id: "p-hbar", label: "ℏ hbar", latex: "\\hbar" },
          { id: "p-approx", label: "Approximately", latex: "\\approx" },
        ],
      },
      {
        id: "ph-eq",
        title: "Equations",
        items: [
          {
            id: "pe-newton",
            label: "Newton's second law",
            latex: "\\vec{F} = m\\vec{a}",
          },
          {
            id: "pe-energy",
            label: "Kinetic energy",
            latex: "K = \\frac{1}{2}mv^2",
          },
          {
            id: "pe-sch",
            label: "Schrödinger (time-independent)",
            latex:
              "-\\frac{\\hbar^2}{2m}\\frac{d^2\\psi}{dx^2} + V\\psi = E\\psi",
          },
          {
            id: "pe-maxwell",
            label: "Maxwell–Faraday",
            latex: "\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}",
          },
        ],
      },
    ],
  },
  {
    id: "statistics",
    title: "Statistics",
    categories: [
      {
        id: "st-sym",
        title: "Symbols",
        items: [
          { id: "s-mean", label: "Sample mean", latex: "\\bar{x}" },
          { id: "s-var", label: "Variance", latex: "s^2" },
          { id: "s-E", label: "Expectation", latex: "\\mathbb{E}[X]" },
          { id: "s-P", label: "Probability", latex: "\\mathbb{P}(A)" },
          { id: "s-N", label: "Normal", latex: "\\mathcal{N}(\\mu, \\sigma^2)" },
        ],
      },
      {
        id: "st-eq",
        title: "Equations",
        items: [
          {
            id: "se-norm",
            label: "Normal PDF",
            latex:
              "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}",
          },
          {
            id: "se-ci",
            label: "Confidence interval",
            latex: "\\bar{x} \\pm z_{\\alpha/2} \\frac{\\sigma}{\\sqrt{n}}",
          },
          {
            id: "se-bayes",
            label: "Bayes' theorem",
            latex:
              "\\mathbb{P}(A\\mid B) = \\frac{\\mathbb{P}(B\\mid A)\\mathbb{P}(A)}{\\mathbb{P}(B)}",
          },
        ],
      },
    ],
  },
];

export const LATEX_MIME = "application/x-latex-snippet";
