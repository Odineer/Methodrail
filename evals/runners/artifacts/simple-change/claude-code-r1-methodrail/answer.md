The button label now says "Create" instead of "Save". The only change is the string returned by `buttonLabel()` in `repo/src/button.js:2`, so behavior is otherwise the same.

The existing test in `src/button.test.js` already expected "Create". `npm test` now passes (1 of 1). "Save" appeared nowhere else in the repo, so nothing else needed updating.
