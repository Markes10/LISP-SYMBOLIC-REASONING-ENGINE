#!/usr/bin/env bash
# Execute Common Lisp symbolic reasoning engine via SBCL
set -e

echo "=== Common Lisp Symbolic Reasoning Engine Execution ==="

if command -v sbcl &> /dev/null; then
    sbcl --noinform --non-interactive --load src/symbolic_reasoner.lisp --eval "(format t \"[LISP] Proof and algebraic differentiation complete.~%\")" --quit
else
    echo "[INFO] SBCL not detected. Running self-contained Lisp VM simulation..."
    node runner/run.js
fi
