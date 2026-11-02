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

**Option A – zone already on Cloudflare (or moved there):** uncomment the `routes` block in
`wrangler.jsonc` and run `npm run deploy`. Cloudflare creates the DNS records and certificate,
replacing the existing apex/www records that point at the hacked server.
(Or: dashboard → Workers → architecturematters-maintenance → Settings → Domains & Routes → Add custom domain.)

**Option B – DNS hosted elsewhere:** Workers custom domains need the zone on Cloudflare. Either
move the nameservers to Cloudflare (free plan is fine) and then use Option A. Pointing a CNAME
at `*.workers.dev` won't work.

`www.` gets a 301 redirect to the apex.

## SEO note

Pages return **503 + Retry-After**, which tells Google the outage is temporary so rankings
are kept. If the interim site will be up for more than about a week, set
`MAINTENANCE_STATUS` to `"200"` in `wrangler.jsonc` and redeploy. A long-running 503 can
get pages dropped from the index.

## Restoring the main site

Remove the custom domain/route from this Worker (or delete the Worker) and point DNS back at
the restored WordPress host.
