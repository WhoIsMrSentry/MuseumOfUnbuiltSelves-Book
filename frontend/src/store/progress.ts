// MARK: - LocalStorage Progress Store

const PROGRESS_KEY = 'mystory_reading_progress';

/**
 * Returns the entire hashmap of locally saved book progresses.
 */
function getRegistry(): Record<string, string> {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Failed to parse progress registry', error);
    return {};
  }
}

/**
 * Commits the registry to local storage.
 */
function saveRegistry(registry: Record<string, string>) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(registry));
  } catch (error) {
    console.error('Failed to save progress registry', error);
  }
}

/**
 * Saves the current page slug for a specific book.
 */
export function setProgress(bookSlug: string, pageSlug: string) {
  const registry = getRegistry();
  registry[bookSlug] = pageSlug;
  saveRegistry(registry);
}

/**
 * Retrieves the last read page slug for a specific book. Returns null if not started.
 */
export function getProgress(bookSlug: string): string | null {
  const registry = getRegistry();
  return registry[bookSlug] || null;
}

/**
 * Removes the progress for a specific book (usually when finished).
 */
export function clearProgress(bookSlug: string) {
  const registry = getRegistry();
  delete registry[bookSlug];
  saveRegistry(registry);
}
