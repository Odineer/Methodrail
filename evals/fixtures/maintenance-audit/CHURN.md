Recent work repeatedly edits src/billing/wrap.js and src/app.js.
src/app.js must pass through src/billing/wrap.js before it reaches src/billing/ledger.js.
src/billing/ledger.js is stable. It already validates amount, currency, and id.
src/quiet/format.js has no callers and no recent edits.
