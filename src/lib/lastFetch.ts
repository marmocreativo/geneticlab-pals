const LAST_FETCH_KEY = 'app_last_fetch'

export function updateLastFetch() {
  localStorage.setItem(LAST_FETCH_KEY, new Date().toISOString())
}

export function getLastFetch(): string | null {
  return localStorage.getItem(LAST_FETCH_KEY)
}