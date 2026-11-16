The button label now says "Create" instead of "Save". I changed the string returned by `buttonLabel()` in `repo/src/button.js:2` and nothing else, so behavior is the same.

The existing test in `src/button.test.js` already expected "Create", so it would have failed before this change. It passes now (`npm test`: 1 passed, 0 failed).
