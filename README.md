# Architecture Matters – interim maintenance site

A static "website under maintenance" page for architecturematters.com.au, served from a
Cloudflare Worker while the hacked WordPress site is restored. Styling (Raleway, #FCC707
yellow, animated gradient hero, logo, project photos) was taken from the original
`rarchitecture` theme. The original images and logo came from the Wayback Machine, because
the live site's `/wp-content/uploads` has been wiped.

```
public/index.html   the page (inline CSS, no build step)
public/img/         logo + 5 hero photos (webp)
src/index.js        serves the page for every URL, adds 503/Retry-After + security headers
wrangler.jsonc      Worker config
```

## Develop / deploy

```sh
npm install
npm run dev        # http://localhost:8787
npx wrangler login
npm run deploy     # -> https://architecturematters-maintenance.<subdomain>.workers.dev
```

## Going live on the real domain

The zone is in Architecture Matters' own Cloudflare account, so the Worker must be deployed
**into that account** (a Worker can't attach to a zone in another account).

1. **Get access:** they invite you under Manage Account → Members (Administrator, or a role
   that includes Workers + Zone/DNS edit). Or they create an API token from the
   "Edit Cloudflare Workers" template, scoped to their account and zone, and you use
   `CLOUDFLARE_API_TOKEN=... npm run deploy`.
2. **Check DNS:** in their dashboard, open DNS for architecturematters.com.au. The `@` (apex) and
   `www` records must be **Proxied** (orange cloud). If `www` doesn't exist, add
   `A www 192.0.2.1` (proxied). This is a dummy IP, because the Worker answers before any
   request reaches it.
3. **Deploy:** set `account_id` if needed, uncomment `routes` in `wrangler.jsonc`, then
   `npx wrangler login && npm run deploy`.
4. **Verify:** `curl -I https://architecturematters.com.au/` should show `HTTP/2 503` and
   `retry-after`.

Email (MX/TXT records) is unaffected.

**While restoring WordPress:** the routes catch all traffic, including `/wp-admin`. Whoever
restores the site can use a temporary hostname (e.g. a proxied `staging.` record pointing at
the server) or a hosts-file entry pointing at the origin IP.

## SEO note

Pages return **503 + Retry-After**, which tells Google the outage is temporary so rankings
are kept. If the interim site will be up for more than about a week, set
`MAINTENANCE_STATUS` to `"200"` in `wrangler.jsonc` and redeploy. A long-running 503 can
get pages dropped from the index.

## Restoring the main site

Re-comment the `routes` and redeploy, or delete the routes under Workers → architecturematters-maintenance →
Settings → Domains & Routes. Traffic goes straight back to whatever the DNS records point at.
If WordPress moves to a new server, update the apex/www records to its IP.
