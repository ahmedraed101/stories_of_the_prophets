import type { Collection, ItemProgress, ProgressState } from '../types/content'

const storageKey = (collectionId: string) =>
  `stories-prophets:progress:${collectionId}`

function emptyState(collectionId: string): ProgressState {
  return { collectionId, items: {} }
}

export function loadProgress(collectionId: string): ProgressState {
  try {
    const raw = localStorage.getItem(storageKey(collectionId))
    if (!raw) return emptyState(collectionId)
    const parsed = JSON.parse(raw) as ProgressState
    if (parsed.collectionId !== collectionId) return emptyState(collectionId)
    return parsed
  } catch {
    return emptyState(collectionId)
  }
}

export function saveProgress(state: ProgressState): void {
  localStorage.setItem(storageKey(state.collectionId), JSON.stringify(state))
}

export function getItemProgress(
  state: ProgressState,
  itemId: string,
): ItemProgress {
  return state.items[itemId] ?? { completed: false }
}

export function markOpened(state: ProgressState, itemId: string): ProgressState {
  const prev = getItemProgress(state, itemId)
  const next: ProgressState = {
    ...state,
    items: {
      ...state.items,
      [itemId]: {
        ...prev,
        lastOpenedAt: new Date().toISOString(),
      },
    },
  }
  saveProgress(next)
  return next
}

export function setCompleted(
  state: ProgressState,
  itemId: string,
  completed: boolean,
): ProgressState {
  const prev = getItemProgress(state, itemId)
  const next: ProgressState = {
    ...state,
    items: {
      ...state.items,
      [itemId]: {
        ...prev,
        completed,
        lastOpenedAt: prev.lastOpenedAt ?? new Date().toISOString(),
      },
    },
  }
  saveProgress(next)
  return next
}

export function flattenItems(collection: Collection) {
  return collection.sections.flatMap((s) =>
    s.items.map((item) => ({ sectionId: s.id, item })),
  )
}

export function progressStats(collection: Collection, state: ProgressState) {
  const items = flattenItems(collection)
  const total = items.length
  const completed = items.filter(
    ({ item }) => getItemProgress(state, item.id).completed,
  ).length
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { total, completed, percent }
}

export function clearProgress(collectionId: string): void {
  try {
    localStorage.removeItem(storageKey(collectionId))
  } catch {
    // Ignore storage errors.
  }
}

export function findNeighbors(collection: Collection, itemId: string) {
  const items = flattenItems(collection)
  const index = items.findIndex(({ item }) => item.id === itemId)
  if (index < 0) return { prev: null, next: null, index: -1, total: items.length }
  return {
    prev: index > 0 ? items[index - 1].item : null,
    next: index < items.length - 1 ? items[index + 1].item : null,
    index,
    total: items.length,
  }
}
