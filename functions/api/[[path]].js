const UPSTREAM_PREFIX = '/api.php/provide/vod'

export async function onRequest() {
  return Response.json({ code: 410, msg: 'API proxy disabled in yyjs; configure VITE_API_BASE for direct browser fetch.' }, { status: 410 })
}
