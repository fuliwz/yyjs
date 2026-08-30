const memoryCache = new Map()
const pending = new Map()
const DEFAULT_TTL = 60_000
const MAX_CACHE = 120

function buildUrl(path, params = {}) {
  const url = new URL(path, window.location.href)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, value)
  }
  return url.toString()
}

function touch(key, value) {
  memoryCache.delete(key)
  memoryCache.set(key, { time: Date.now(), value })
  while (memoryCache.size > MAX_CACHE) memoryCache.delete(memoryCache.keys().next().value)
}

export async function fetchApi(path = '', params = {}, options = {}) {
  const url = buildUrl(path, params)
  const key = `${options.method || 'GET'} ${url}`
  const ttl = Number.isFinite(options.ttl) ? Math.max(0, options.ttl) : DEFAULT_TTL
  const cached = memoryCache.get(key)
  if (!options.noCache && cached && Date.now() - cached.time < ttl) return cached.value
  if (pending.has(key)) return pending.get(key)

  const headers = new Headers(options.headers || {})
  headers.set('Accept', 'application/json, text/plain, */*')
  if (!headers.has('Cache-Control')) headers.set('Cache-Control', 'max-age=60')

  const requestOptions = { ...options, headers }
  delete requestOptions.ttl
  delete requestOptions.noCache

  const task = fetch(url, requestOptions).then(async response => {
    if (!response.ok) throw new Error(`API request failed: ${response.status}`)
    const data = await response.json()
    if (!options.noCache) touch(key, data)
    return data
  }).catch(error => {
    if (cached) return cached.value
    throw error
  }).finally(() => pending.delete(key))

  pending.set(key, task)
  return task
}

export function clearFetchCache() {
  memoryCache.clear()
  pending.clear()
}
