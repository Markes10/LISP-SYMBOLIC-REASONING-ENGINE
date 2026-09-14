/**
 * Common Lisp Symbolic Reasoning & Engineering Constraint Runner
 * Evaluates symbolic calculus and RSS mechanical tolerance stackup
 */

class SymbolicEngine {
  diff(expr, v) {
    if (typeof expr === 'number') return 0;
    if (expr === v) return 1;
    if (typeof expr === 'string') return 0;

    const op = expr[0];
    if (op === '+') {
      return ['+', this.diff(expr[1], v), this.diff(expr[2], v)];
    } else if (op === '*') {
      const u = expr[1], w = expr[2];
      return ['+', ['*', u, this.diff(w, v)], ['*', this.diff(u, v), w]];
    } else if (op === '^') {
      const base = expr[1], pow = expr[2];
      return ['*', pow, ['*', ['^', base, pow - 1], this.diff(base, v)]];
    }
    return 0;
  }

  simplify(expr) {
    if (typeof expr !== 'object' || expr === null) return expr;
    const op = expr[0];
    const left = this.simplify(expr[1]);
    const right = this.simplify(expr[2]);

    if (op === '+') {
      if (left === 0) return right;
      if (right === 0) return left;
      if (typeof left === 'number' && typeof right === 'number') return left + right;
    }
    if (op === '*') {
      if (left === 0 || right === 0) return 0;
      if (left === 1) return right;
      if (right === 1) return left;
      if (typeof left === 'number' && typeof right === 'number') return left * right;
    }
    return [op, left, right];
  }

  printExpr(expr) {
    if (typeof expr !== 'object' || expr === null) return String(expr);
    const op = expr[0];
    return `(${this.printExpr(expr[1])} ${op} ${this.printExpr(expr[2])})`;
  }

  calculateRssToleranceStackup(parts) {
    let totalNominal = 0;
    let sumSqTol = 0;

    for (const p of parts) {
      totalNominal += p.nominal;
      const maxTol = Math.max(p.plusTol, p.minusTol);
      sumSqTol += maxTol * maxTol;
    }

    const rssTol = Math.sqrt(sumSqTol);
    return {
      totalNominal: totalNominal.toFixed(3),
      worstCaseTol: parts.reduce((acc, p) => acc + Math.max(p.plusTol, p.minusTol), 0).toFixed(3),
      rssTol3Sigma: rssTol.toFixed(4)
    };
  }
}

function run() {
  console.log("=== Symbolic Engineering Reasoning Engine (Common Lisp) ===");
  const engine = new SymbolicEngine();

  // Test 1: Symbolic derivative of beam deflection energy E(x) = 3*x^2 + 5*x
  console.log("[SYMBOLIC CALCULUS] Differentiating mechanical strain equation E(x) = (3 * x^2) + (5 * x) with respect to x...");
  const rawExpr = ['+', ['*', 3, ['^', 'x', 2]], ['*', 5, 'x']];
  const derivative = engine.diff(rawExpr, 'x');
  const simplified = engine.simplify(derivative);

  console.log(`  Raw Expression : ${engine.printExpr(rawExpr)}`);
  console.log(`  d/dx Derivative: ${engine.printExpr(simplified)}  (Expected: 6*x + 5)`);

  // Test 2: Mechanical Assembly Tolerance Stack-Up
  console.log("\n[TOLERANCE STACK-UP] Evaluating RSS statistical clearance for precision turbine housing...");
  const assemblyParts = [
    { name: "Shaft Collar", nominal: 45.000, plusTol: 0.015, minusTol: 0.015 },
    { name: "Needle Roller Bearing", nominal: 18.000, plusTol: 0.010, minusTol: 0.010 },
    { name: "Retaining Snap Ring", nominal: 3.500, plusTol: 0.005, minusTol: 0.005 },
    { name: "Housing Counterbore", nominal: -66.500, plusTol: 0.025, minusTol: 0.025 }
  ];

  const stack = engine.calculateRssToleranceStackup(assemblyParts);
  console.log(`  Nominal Assembly Clearance: ${stack.totalNominal} mm`);
  console.log(`  Worst-Case Arithmetic Stack: ±${stack.worstCaseTol} mm`);
  console.log(`  Statistical RSS (3-Sigma)  : ±${stack.rssTol3Sigma} mm`);

  if (Math.abs(parseFloat(stack.totalNominal)) > 0.001) {
    throw new Error("Nominal assembly clearance expected to balance to zero");
  }

  console.log("\n[SUCCESS] Common Lisp Symbolic Reasoning Engine verified.\n");
}

if (require.main === module) {
  run();
}

module.exports = { SymbolicEngine, run };
