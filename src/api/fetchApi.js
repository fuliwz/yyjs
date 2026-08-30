export async function fetchApi(path = '', params = {}, options = {}) {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
  const url = `${path}${query.toString() ? `?${query}` : ''}`
  const response = await fetch(url, { ...options, headers: { Accept: 'application/json, text/plain, */*', ...(options.headers || {}) } })
  if (!response.ok) throw new Error(`API request failed: ${response.status}`)
  return response.json()
}
