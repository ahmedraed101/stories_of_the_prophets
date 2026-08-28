const STORAGE_LEARNER_NAME = 'stories-prophets:learner-name'

export function storedLearnerName(): string {
  try {
    return localStorage.getItem(STORAGE_LEARNER_NAME)?.trim() ?? ''
  } catch {
    return ''
  }
}

export function saveLearnerName(name: string): void {
  const trimmed = name.trim()
  try {
    if (trimmed) {
      localStorage.setItem(STORAGE_LEARNER_NAME, trimmed)
    } else {
      localStorage.removeItem(STORAGE_LEARNER_NAME)
    }
  } catch {
    // Session-only when storage is unavailable.
  }
}
