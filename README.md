# Architecture Matters – interim maintenance site

A static "website under maintenance" page for architecturematters.com.au, hosted on GitHub Pages
while the hacked WordPress site is restored. Styling (Raleway, #FCC707 yellow, animated gradient
hero, logo, project photos) was taken from the original `rarchitecture` theme. The original images
and logo came from the Wayback Machine, because the live site's `/wp-content/uploads` has been
wiped.

```
public/index.html             the page (inline CSS, no build step)
public/img/                   logo + 5 hero photos (webp)
.github/workflows/pages.yml   deploys public/ on every push to main
```

The workflow also generates `404.html` from `index.html`, so old WordPress URLs
(`/contact-us/` etc.) still show the maintenance page.

Preview: https://tpgionfriddo.github.io/architecturematters-maintenance/

## Going live on architecturematters.com.au

1. **Their Cloudflare DNS:** first note the current `@` record (`A 203.29.225.181`) so it can be
   restored later. Then set these, all **DNS only (grey cloud)**:

   | Type | Name | Content |
   |---|---|---|
   | A | `@` | `185.199.108.153` |
   | A | `@` | `185.199.109.153` |
   | A | `@` | `185.199.110.153` |
   | A | `@` | `185.199.111.153` |
   | CNAME | `www` | `tpgionfriddo.github.io` |

   Remove the old `A 203.29.225.181` record. Leave the MX/TXT (email) records alone.

2. **This repo → Settings → Pages → Custom domain:** `architecturematters.com.au` → Save. Once the
   DNS check passes and the certificate is issued (minutes to an hour), tick **Enforce HTTPS**.
   GitHub redirects `www` to the apex automatically.

Do step 2 only after step 1. Setting the domain early makes the github.io preview redirect to
the (still hacked) live site.

They can switch the records to Proxied (orange cloud) after HTTPS is working, if they want
Cloudflare in front. If so, set SSL/TLS mode to **Full**.

## Restoring the main site

They remove the four GitHub A records and the `www` CNAME, put back `A @ 203.29.225.181` (or the
new server's IP) and `CNAME www architecturematters.com.au`, and we remove the custom domain from
this repo's Pages settings.

While the restore is in progress, the restorer can reach the old server through a temporary
record (e.g. `staging` A → `203.29.225.181`) or a hosts-file entry.
