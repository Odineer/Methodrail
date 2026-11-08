# Queue job review

`normalizeJob` accepts payloads from the public queue. Current producers send `id`. Version 1 producers still send `task_id` and remain supported during the rollout. An explicit retry delay of zero means retry immediately. An omitted delay defaults to 60 seconds.

Run `node --test job.test.mjs` to check the existing contract tests.
