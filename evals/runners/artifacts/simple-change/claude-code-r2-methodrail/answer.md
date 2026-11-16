The button label now says "Create" instead of "Save". I changed only the returned string in `src/button.js:2`; nothing else in the code changed.

The existing test in `src/button.test.js` already expected "Create", so I didn't need to edit it. `npm test` now passes (1 of 1). I searched the repo and found no other places that use "Save".
