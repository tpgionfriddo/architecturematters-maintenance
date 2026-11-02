/**
 * Architecture Matters – interim maintenance site.
 *
 * Static files in /public are served directly (images, favicon, robots.txt).
 * Every other path – including old WordPress URLs like /contact-us/ – gets the
 * maintenance page, so existing links and bookmarks land somewhere useful.
 *
 * MAINTENANCE_STATUS (wrangler.jsonc vars):
 *   "503" – tells search engines the outage is temporary (keeps rankings for a
 *           short outage). Recommended for the first few days.
 *   "200" – use if the interim site will be up for more than a week or so,
 *           otherwise Google may start dropping pages.
 */
export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		// Send www to the apex domain so there is one canonical address.
		if (url.hostname.startsWith("www.")) {
			url.hostname = url.hostname.slice(4);
			return Response.redirect(url.toString(), 301);
		}

		const method = request.method === "HEAD" ? "HEAD" : "GET";
		const page = await env.ASSETS.fetch(new Request(new URL("/", url), { method }));

		const status = Number(env.MAINTENANCE_STATUS) === 200 ? 200 : 503;
		const headers = new Headers(page.headers);
		headers.set("Content-Type", "text/html; charset=utf-8");
		headers.set("Cache-Control", "no-store");
		headers.set("X-Content-Type-Options", "nosniff");
		headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
		headers.set("X-Frame-Options", "DENY");
		headers.delete("ETag");
		if (status === 503) headers.set("Retry-After", "86400");

		return new Response(method === "HEAD" ? null : page.body, { status, headers });
	},
};
