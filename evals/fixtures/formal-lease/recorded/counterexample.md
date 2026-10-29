# Constructed counterexample

Label: constructed counterexample. This file is not an execution of TLC or any installed verifier.

Promise: a protected use cannot proceed for two simultaneously valid holders.

1. beginClaim(a) sets intent to a. Mapped model action: BeginClaim.
2. finishClaim(a) succeeds because intent is a. holders = [a]. Mapped model action: FinishClaim.
3. beginClaim(b) sets intent to b even though a still holds the lease. Mapped model action: BeginClaim.
4. finishClaim(b) succeeds because intent is b, without checking that holders was empty. holders = [a, b]. Mapped model action: FinishClaim.
5. use(a) returns true. Mapped model action: Use.
6. use(b) returns true. Mapped model action: Use.

Harm: two valid owners can both run the protected operation.
Trace length: 4 model actions before the broken uses. This recording does not claim a shortest path.
