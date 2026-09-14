;;;; ==============================================================================
;;;; Symbolic Engineering Reasoning Engine
;;;; Language: Common Lisp (ANSI Standard)
;;;; ==============================================================================

(defpackage :symbolic-reasoner
  (:use :cl)
  (:export :unify
           :symbolic-diff
           :simplify
           :check-tolerance-stackup))

(in-package :symbolic-reasoner)

;;; ----------------------------------------------------------------------------
;;; 1. Symbolic Differentiation Engine
;;; ----------------------------------------------------------------------------
(defun symbolic-diff (expr var)
  "Differentiates symbolic expression EXPR with respect to VAR."
  (cond
    ((numberp expr) 0)
    ((eq expr var) 1)
    ((atom expr) 0)
    ((eq (car expr) '+)
     (list '+ (symbolic-diff (cadr expr) var) (symbolic-diff (caddr expr) var)))
    ((eq (car expr) '-)
     (list '- (symbolic-diff (cadr expr) var) (symbolic-diff (caddr expr) var)))
    ((eq (car expr) '*)
     (let ((u (cadr expr))
           (v (caddr expr)))
       (list '+ (list '* u (symbolic-diff v var))
                (list '* (symbolic-diff u var) v))))
    ((eq (car expr) '^)
     (let ((base (cadr expr))
           (power (caddr expr)))
       (if (numberp power)
           (list '* power (list '* (list '^ base (1- power)) (symbolic-diff base var)))
           (error "Non-constant power not supported in this profile"))))
    (t (error "Unsupported operator: ~A" (car expr)))))

;;; ----------------------------------------------------------------------------
;;; 2. Expression Simplification
;;; ----------------------------------------------------------------------------
(defun simplify (expr)
  "Applies algebraic reduction rules (e.g. (+ x 0) -> x, (* x 1) -> x, (* x 0) -> 0)."
  (if (atom expr)
      expr
      (let ((op (car expr))
            (left (simplify (cadr expr)))
            (right (simplify (caddr expr))))
        (cond
          ((and (eq op '+) (equal left 0)) right)
          ((and (eq op '+) (equal right 0)) left)
          ((and (eq op '*) (or (equal left 0) (equal right 0))) 0)
          ((and (eq op '*) (equal left 1)) right)
          ((and (eq op '*) (equal right 1)) left)
          ((and (numberp left) (numberp right))
           (case op
             ('+ (+ left right))
             ('- (- left right))
             ('* (* left right))
             ('^ (expt left right))
             (otherwise (list op left right))))
          (t (list op left right))))))

;;; ----------------------------------------------------------------------------
;;; 3. Mechanical Tolerance Stack-Up Evaluator
;;; ----------------------------------------------------------------------------
(defstruct dimension
  name
  nominal
  plus-tol
  minus-tol)

(defun rss-tolerance-stackup (dims)
  "Calculates Root-Sum-Square (RSS) statistical tolerance stackup for an assembly."
  (let ((total-nominal (reduce #'+ (mapcar #'dimension-nominal dims)))
        (sum-sq-var (reduce #'+ (mapcar (lambda (d)
                                          (let ((max-t (max (dimension-plus-tol d) (dimension-minus-tol d))))
                                            (* max-t max-t)))
                                        dims))))
    (values total-nominal (sqrt sum-sq-var))))
