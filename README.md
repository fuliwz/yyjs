# yyjs

Vue site cloned from yyxvt and converted to direct browser fetch API access.

## API
Set the Vite environment variable `VITE_API_BASE` to an HTTPS Apple CMS API origin that permits CORS, for example:

`https://your-api.example.com`

The site then requests `/api.php/provide/vod/` directly from the browser. Pages Functions are not used for API access.

## Deploying to Cloudflare Pages
Build command: `npm run build`
Output directory: `dist`
Node.js: 20+

CORS is required on the upstream API because requests originate in the browser.
