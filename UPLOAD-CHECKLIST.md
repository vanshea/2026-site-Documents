# Pre-upload checklist

- [ ] Review the mobile hero clipping at a 390px viewport with production fonts. Decide whether to authorize a responsive fix.
- [ ] Decide whether to provide 1200×630 Open Graph images for pages that currently use the portrait headshot.
- [ ] Confirm DNS and host aliases for `vanshea.com`, `www.vanshea.com`, and `humanagencydesign.com`; verify the production canonical redirects to `https://vanshea.com`.
- [ ] Confirm the host honors `.htaccess` and has `mod_rewrite`, `mod_headers`, `mod_deflate`, and `mod_expires` enabled. Test the scheme/host redirects, Contact legacy redirect, route aliases, cache/compression headers, and 404 handling on the host.
- [ ] Verify the PHP version, database connection, and WordPress permalinks for `/blog/`. The blog is preserved, but its runtime was not tested in the static preview.
- [ ] Take a fresh remote backup of the current hosting web root before uploading.
- [ ] Upload the contents of the prepared local `/livesite/` folder to the hosting web root, preserving the WordPress `/blog/` and legacy `/lab/` routes.
- [ ] Check all 16 sitemap URLs, the four AI Design iframe prototypes, images, favicon/manifest, `/robots.txt`, `/sitemap.xml`, and the custom 404 page on the host.
- [ ] Run Lighthouse (SEO, Performance, Accessibility, Best Practices) on every sitemap route after the host is available; this environment did not have Lighthouse installed.
- [ ] Verify representative Open Graph previews in the target social platforms and submit `https://vanshea.com/sitemap.xml` in Google Search Console.
- [ ] Confirm no build paths or private QA artifacts are publicly served.

No upload or deployment has been performed.
