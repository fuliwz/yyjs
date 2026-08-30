import { fetchApi } from './fetchApi.js'

const API_BASE = String(import.meta.env.VITE_API_BASE || '').trim().replace(/\/$/, '')
const endpoint = API_BASE ? `${API_BASE}/api.php/provide/vod/` : '/api.php/provide/vod/'
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
  return new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== '').sort(([a], [b]) => a.localeCompare(b))).toString()
}
function payload(root) {
  const data = root?.data
  if (data && typeof data === 'object' && !Array.isArray(data)) return data
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
  cache.delete(key); cache.set(key, entry)
  while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value)
}

export function normalizeVod(v = {}) {
  return { id:v.vod_id, title:v.vod_name||'未命名内容', poster:v.vod_pic||v.vod_pic_thumb||v.vod_pic_slide||'', year:v.vod_year||'', area:v.vod_area||'', typeId:v.type_id||'', typeName:v.type_name||v.vod_class||'', score:v.vod_score||'', remarks:v.vod_remarks||v.vod_blurb||'', duration:v.vod_duration||'', views:v.vod_hits||v.vod_hits_day||0, updateTime:v.vod_time||'', actor:v.vod_actor||'', director:v.vod_director||'', content:v.vod_content||v.vod_blurb||'', playFrom:v.vod_play_from||'', playUrl:v.vod_play_url||'', raw:v }
}

export function parsePlaySources(item) {
  if (!item) return []
  const names=String(item.playFrom||'').split('$$$').filter(Boolean), rawSources=String(item.playUrl||'').split('$$$').filter(Boolean), count=Math.max(names.length,rawSources.length), sources=[]
  for(let i=0;i<count;i+=1){const raw=rawSources[i]||'',name=safeText(names[i]||`线路 ${i+1}`,80),episodes=raw.split('#').slice(0,300).map((entry,index)=>{const parts=entry.trim().split('$'),label=safeText(parts.length>1?parts[0]:`第${String(index+1).padStart(2,'0')}集`,80),url=(parts.length>1?parts.slice(1).join('$'):parts[0]).trim();return{label,url}}).filter(ep=>/^https?:\/\//i.test(ep.url)&&ep.url.length<=4096);if(episodes.length)sources.push({name,episodes})}
  return sources
}

async function request(params = {}) {
  const key=cacheKey(params),now=Date.now(),cached=cache.get(key),ttl=params.ids?DETAIL_TTL:TTL
  if(cached&&now-cached.time<ttl){touchCache(key,cached);return cached.value}
  if(pending.has(key)) return pending.get(key)
  const task=fetchApi(endpoint,params).then(root=>{const result={data:payload(root)};touchCache(key,{time:Date.now(),value:result});return result}).catch(error=>{if(cached){touchCache(key,cached);return cached.value}throw error}).finally(()=>pending.delete(key))
  pending.set(key,task);return task
}

export async function getClasses(){const result=await request({ac:'list',pg:1,pagesize:100});return Array.isArray(result.data?.class)?result.data.class.slice(0,100):[]}
export async function getVideos({page=1,limit=DEFAULT_LIMIT,typeId,keyword,sort}={}){const pg=safeInt(page,1,1,MAX_PAGE),size=safeInt(limit,DEFAULT_LIMIT,1,MAX_LIMIT),type=safeText(typeId,32),wd=safeText(keyword,MAX_KEYWORD),order=['hits','time','score'].includes(String(sort))?String(sort):'',result=await request({ac:'detail',pg,limit:size,t:type,wd,sort:order}),upstreamList=Array.isArray(result.data?.list)?result.data.list:[],list=upstreamList.slice(0,size).map(normalizeVod),rawPageCount=result.data?.pagecount??result.data?.page_count,rawTotal=result.data?.total;return{list,page:safeInt(result.data?.page,pg,1,MAX_PAGE),pageCount:safeInt(rawPageCount,list.length?pg:1,0,MAX_PAGE),total:safeInt(rawTotal,0,0,Number.MAX_SAFE_INTEGER)}}
export const getLatestVideos=(page=1,limit=DEFAULT_LIMIT)=>getVideos({page,limit})
export const getHotVideos=(page=1,limit=DEFAULT_LIMIT)=>getVideos({page,limit,sort:'hits'})
export const getCategoryVideos=(typeId,page=1,limit=DEFAULT_LIMIT)=>getVideos({typeId,page,limit})
export const searchVideos=(keyword,page=1,limit=DEFAULT_LIMIT)=>getVideos({keyword,page,limit})
export async function getDetail(id){const safe=safeId(id);if(!safe)return null;const result=await request({ac:'detail',ids:safe}),item=Array.isArray(result.data?.list)?result.data.list[0]:null;return item?normalizeVod(item):null}
export async function getRelatedVideos(item,limit=12){if(!item)return[];const size=safeInt(limit,12,1,20),byType=item.typeId?await getCategoryVideos(item.typeId,1,size+2).catch(()=>({list:[]})):{list:[]};let list=byType.list.filter(v=>String(v.id)!==String(item.id));if(list.length<size){const hot=await getHotVideos(1,size+4).catch(()=>({list:[]})),seen=new Set(list.map(v=>String(v.id)));for(const v of hot.list)if(String(v.id)!==String(item.id)&&!seen.has(String(v.id))){list.push(v);seen.add(String(v.id))}}return list.slice(0,size)}
export const clearCache=()=>{cache.clear();pending.clear()}
