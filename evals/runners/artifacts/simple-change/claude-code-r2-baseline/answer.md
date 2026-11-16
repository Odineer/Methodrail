The button label now says "Create" instead of "Save". The only change is the returned string in `repo/src/button.js:2`, so behavior is otherwise the same.

The existing test in `src/button.test.js` already expected "Create", and it passes now (`npm test`: 1 passed, 0 failed).
