import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const endpoint = `${API_BASE}/api.php/provide/vod/`
const api = axios.create({ baseURL: endpoint, timeout: 12000, maxContentLength: 8 * 1024 * 1024 })
const cache = new Map()
const pending = new Map()
const TTL = 60_000
const DETAIL_TTL = 300_000
const MAX_CACHE = 120
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 48
const MAX_PAGE = 100000
const MAX_KEYWORD = 100

function cacheKey(params = {}) {
  const query = Object.entries(params).filter(([, value]) => value !== undefined && value !== '').sort(([a], [b]) => a.localeCompare(b))
  return new URLSearchParams(query).toString()
}
function payload(response) {
  const root = response?.data
  if (root?.data && typeof root.data === 'object' && !Array.isArray(root.data)) return root.data
  return root || {}
}
function safeInt(value, fallback, min, max) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.trunc(n))) : fallback
}
function safeText(value, max = MAX_KEYWORD) { return String(value ?? '').trim().slice(0, max) }
function safeId(value) {
  const id = safeText(value, 64)
  return /^[A-Za-z0-9_-]+$/.test(id) ? id : ''
}
function touchCache(key, entry) {
  cache.delete(key)
  cache.set(key, entry)
  while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value)
}

export function normalizeVod(v = {}) {
  return {
    id: v.vod_id,
    title: v.vod_name || '未命名内容',
    poster: v.vod_pic || v.vod_pic_thumb || v.vod_pic_slide || '',
    year: v.vod_year || '', area: v.vod_area || '', typeId: v.type_id || '', typeName: v.type_name || v.vod_class || '',
    score: v.vod_score || '', remarks: v.vod_remarks || v.vod_blurb || '', duration: v.vod_duration || '',
    views: v.vod_hits || v.vod_hits_day || 0, updateTime: v.vod_time || '', actor: v.vod_actor || '', director: v.vod_director || '',
    content: v.vod_content || v.vod_blurb || '', playFrom: v.vod_play_from || '', playUrl: v.vod_play_url || '', raw: v
  }
}

export function parsePlaySources(item) {
  if (!item) return []
  const names = String(item.playFrom || '').split('$$$').filter(Boolean)
  const rawSources = String(item.playUrl || '').split('$$$').filter(Boolean)
  const count = Math.max(names.length, rawSources.length)
  const sources = []
  for (let i = 0; i < count; i += 1) {
    const raw = rawSources[i] || ''
    const name = safeText(names[i] || `线路 ${i + 1}`, 80)
    const episodes = raw.split('#').slice(0, 300).map((entry, index) => {
      const parts = entry.trim().split('$')
      const label = safeText(parts.length > 1 ? parts[0] : `第${String(index + 1).padStart(2, '0')}集`, 80)
      const url = (parts.length > 1 ? parts.slice(1).join('$') : parts[0]).trim()
      return { label, url }
    }).filter(ep => /^https?:\/\//i.test(ep.url) && ep.url.length <= 4096)
    if (episodes.length) sources.push({ name, episodes })
  }
  return sources
}

async function request(params = {}) {
  const k = cacheKey(params)
  const now = Date.now()
  const cached = cache.get(k)
  const ttl = params.ids ? DETAIL_TTL : TTL
  if (cached && now - cached.time < ttl) {
    touchCache(k, cached)
    return cached.value
  }
  if (pending.has(k)) return pending.get(k)
  const task = api.get('', { params }).then(response => {
    const result = { response, data: payload(response) }
    touchCache(k, { time: Date.now(), value: result })
    return result
  }).catch(error => {
    if (cached) {
      touchCache(k, cached)
      return cached.value
    }
    throw error
  }).finally(() => pending.delete(k))
  pending.set(k, task)
  return task
}

export async function getClasses() {
  const result = await request({ ac: 'list', pg: 1, pagesize: 100 })
  return Array.isArray(result.data?.class) ? result.data.class.slice(0, 100) : []
}

export async function getVideos({ page = 1, limit = DEFAULT_LIMIT, typeId, keyword, sort } = {}) {
  const pg = safeInt(page, 1, 1, MAX_PAGE)
  const size = safeInt(limit, DEFAULT_LIMIT, 1, MAX_LIMIT)
  const type = safeText(typeId, 32)
  const wd = safeText(keyword, MAX_KEYWORD)
  const order = ['hits', 'time', 'score'].includes(String(sort)) ? String(sort) : ''
  const result = await request({ ac: 'detail', pg, limit: size, t: type, wd, sort: order })
  const upstreamList = Array.isArray(result.data?.list) ? result.data.list : []
  const list = upstreamList.slice(0, size).map(normalizeVod)
  const rawPageCount = result.data?.pagecount ?? result.data?.page_count
  const rawTotal = result.data?.total
  return {
    list,
    page: safeInt(result.data?.page, pg, 1, MAX_PAGE),
    pageCount: safeInt(rawPageCount, list.length ? pg : 1, 0, MAX_PAGE),
    total: safeInt(rawTotal, 0, 0, Number.MAX_SAFE_INTEGER)
  }
}

export const getLatestVideos = (page = 1, limit = DEFAULT_LIMIT) => getVideos({ page, limit })
export const getHotVideos = (page = 1, limit = DEFAULT_LIMIT) => getVideos({ page, limit, sort: 'hits' })
export const getCategoryVideos = (typeId, page = 1, limit = DEFAULT_LIMIT) => getVideos({ typeId, page, limit })
export const searchVideos = (keyword, page = 1, limit = DEFAULT_LIMIT) => getVideos({ keyword, page, limit })

export async function getDetail(id) {
  const safe = safeId(id)
  if (!safe) return null
  const result = await request({ ac: 'detail', ids: safe })
  const item = Array.isArray(result.data?.list) ? result.data.list[0] : null
  return item ? normalizeVod(item) : null
}

export async function getRelatedVideos(item, limit = 12) {
  if (!item) return []
  const size = safeInt(limit, 12, 1, 20)
  const byType = item.typeId ? await getCategoryVideos(item.typeId, 1, size + 2).catch(() => ({ list: [] })) : { list: [] }
  let list = byType.list.filter(v => String(v.id) !== String(item.id))
  if (list.length < size) {
    const hot = await getHotVideos(1, size + 4).catch(() => ({ list: [] }))
    const seen = new Set(list.map(v => String(v.id)))
    for (const v of hot.list) {
      if (String(v.id) !== String(item.id) && !seen.has(String(v.id))) { list.push(v); seen.add(String(v.id)) }
    }
  }
  return list.slice(0, size)
}

export const clearCache = () => { cache.clear(); pending.clear() }
