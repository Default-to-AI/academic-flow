export function createAttemptLog({ attempt, maxAttempts, timestamp, status }) {
  return `[Attempt ${attempt}/${maxAttempts}] | [${timestamp}] | [${status}]`
}

export function nowIso() {
  return new Date().toISOString()
}
