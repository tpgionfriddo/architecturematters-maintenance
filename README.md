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

The Worker runs in **our** Cloudflare account on a throwaway domain (`example-throwaway.com`
below). Architecture Matters keeps their own Cloudflare account and just points their records
at us. A plain CNAME between two Cloudflare accounts is blocked (error 1014). **Cloudflare for
SaaS** is what makes it work, and it's free for up to 100 hostnames.

### Our side (throwaway zone)

1. Add the throwaway domain to our Cloudflare account (Free plan) and wait for it to be Active.
2. **SSL/TLS → Custom Hostnames → Enable Cloudflare for SaaS.**
3. DNS: add the fallback origin and the target the client will point at:
   | Type | Name | Content | Proxy |
   |---|---|---|---|
   | AAAA | `proxy-fallback` | `100::` | Proxied |
   | CNAME | `am` | `proxy-fallback.example-throwaway.com` | Proxied |
4. **Custom Hostnames → Fallback Origin:** `proxy-fallback.example-throwaway.com` and wait for **Active**.
5. **Add Custom Hostname** twice: `architecturematters.com.au` and `www.architecturematters.com.au`
   (certificate validation: TXT, see below).
6. Put the real throwaway domain into `routes` in `wrangler.jsonc` (`*/*`), then `npm run deploy`.
   Check it: `https://am.example-throwaway.com` should show the page.

### Their side (architecturematters.com.au DNS)

**Before cutover (optional, avoids a gap while certificates are issued):** for each custom
hostname, the dashboard shows TXT records (`_cf-custom-hostname…` and `_acme-challenge…`). They
add these, and we wait until both Hostname status and Certificate status are **Active**.

**Cutover:** they change the two existing records:

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `@` | `am.example-throwaway.com` | Proxied |
| CNAME | `www` | `am.example-throwaway.com` | Proxied |

The `@` record is currently an A record → `203.29.225.181`. **Note that IP down** so it can be
restored later. Cloudflare allows a CNAME at the apex (it gets flattened). Proxied records give
the documented "orange-to-orange" (O2O) setup. Leave the MX/TXT records alone.

Verify: `curl -I https://architecturematters.com.au/` → `HTTP/2 503` with `retry-after`, and
`www` → 301 to the apex.

**While restoring WordPress:** the restorer can reach the old server through a temporary record
on their side (e.g. `staging` A → `203.29.225.181`) or a hosts-file entry.

## SEO note

Pages return **503 + Retry-After**, which tells Google the outage is temporary so rankings
are kept. If the interim site will be up for more than about a week, set
`MAINTENANCE_STATUS` to `"200"` in `wrangler.jsonc` and redeploy. A long-running 503 can
get pages dropped from the index.

## Restoring the main site

They set `@` back to `A 203.29.225.181` (or the new server's IP) and `www` back to
`CNAME architecturematters.com.au`. Then we delete the two custom hostnames and can drop the
throwaway zone.
