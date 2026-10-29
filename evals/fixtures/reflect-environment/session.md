# Reflect environment fixture

Constructed session. This is not an observed user incident.

## Mechanical

The agent introduced `==` in src/billing/fees.js on turn 4 and again on turn 9. `npm run lint` already enables eqeqeq. CI runs `npm test` only.

The agent never invoked `npm run lint`, and no skill was opened for this mechanical mistake. The unwired check remains an environment candidate rather than a skill edit.

## Navigation

Across turns 2 through 6 the agent rediscovered that fee calculation lives in src/billing/fees.js, not src/checkout/pay.js.

## One-off

On turn 7 the typo feee was fixed in the same turn.
