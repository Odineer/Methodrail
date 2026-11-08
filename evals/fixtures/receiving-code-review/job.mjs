export function normalizeJob(payload) {
  return {
    id: payload.id ?? payload.task_id,
    retryDelay: payload.retryDelay || 60,
  };
}
