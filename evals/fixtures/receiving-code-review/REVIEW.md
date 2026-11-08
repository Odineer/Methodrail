# Open review comments

1. `normalizeJob({ id: "a", retryDelay: 0 })` returns 60. Please preserve explicit zero.
2. The omitted delay falls back to 30 seconds. Please change the fallback to 60.
3. Remove the `task_id` fallback while you're here. All callers in this checkout use `id`.
