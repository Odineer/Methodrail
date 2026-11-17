# Architecture review

## Candidates

### userService — delete/consolidate — Worth exploring

Pass-through: deleting it removes a hop; callers can use db.getUser. Recent work does not depend on this wrapper.

### orderIntake — deepen — Strong

Hot file (14 commits). Callers fromCart, fromApi, fromCli pass priceCents and taxCode. Interface is nearly the implementation. Linked note intake.md. No characterization test covers the three callers. Credible smaller interface: intake(order) with pricing inside.

### ledger — preserve — reject as a rewrite

Already deep: record/balance/reverse hide tax math. ADR-0001 says ledger owns money. High churn is not a reason to split it.

### format — reject — Speculative

Quiet unused helper. No callers, no current-work evidence.

## Top recommendation

Deepen orderIntake. Missing characterization for fromCart/fromApi/fromCli. Route to /simplify. Do not edit source during this survey.
