# Release Inventory and Dependency Map

Generated 2026-09-28 from `/build/` before release changes. This records every source file and direct references from every HTML page; transitive public-page dependencies are traced from the current sitemap, homepage, and 404 route. Build and demo artifacts were preserved in place.

- Files: 353; HTML pages: 47; total source bytes: 149,662,411.
- Sitemap routes: 16.
- Files reachable from sitemap routes plus homepage and 404: 130 (static scan; dynamic/runtime references may add dependencies).

## Stack and serving

- `/build/README.md` says the preview is served at `http://localhost:3000/build/` and points to a static FTP bundle script.
- `package.json` identifies Node.js/Express for local/development serving and a `build:bundle` script. The live output is static HTML/CSS/JS and needs no Node build step on the host.
- The project also contains a WordPress tree under the existing `/livesite/blog/`; since public pages link to `/blog/`, that tree is retained as uncertain legacy content in the existing live backup pending host/PHP verification.

## Public routes from sitemap

- `https://vanshea.com/` → `index.html`
- `https://vanshea.com/work.html` → `work.html`
- `https://vanshea.com/experience.html` → `experience.html`
- `https://vanshea.com/case-studies/` → `case-studies/index.html`
- `https://vanshea.com/case-studies/capital-one-gesture-patent/` → `case-studies/capital-one-gesture-patent/index.html`
- `https://vanshea.com/case-studies/mt-bank-commercial-banking-transformation/` → `case-studies/mt-bank-commercial-banking-transformation/index.html`
- `https://vanshea.com/case-studies/nami-delaware-988-campaign/` → `case-studies/nami-delaware-988-campaign/index.html`
- `https://vanshea.com/case-studies/nyu-curriculum-alignment/` → `case-studies/nyu-curriculum-alignment/index.html`
- `https://vanshea.com/case-studies/vanguard-innovation-lab-integration/` → `case-studies/vanguard-innovation-lab-integration/index.html`
- `https://vanshea.com/aidesign/` → `aidesign/index.html`
- `https://vanshea.com/aidesign/experiments/` → `aidesign/experiments/index.html`
- `https://vanshea.com/aidesign/experiments/stock-performance-test/` → `aidesign/experiments/stock-performance-test/index.html`
- `https://vanshea.com/aidesign/share/contact.html` → `aidesign/share/contact.html`
- `https://vanshea.com/aidesign/share/meeting-coach.html` → `aidesign/share/meeting-coach.html`
- `https://vanshea.com/aidesign/share/partner.html` → `aidesign/share/partner.html`
- `https://vanshea.com/aidesign/share/self-care.html` → `aidesign/share/self-care.html`

## Classification key

- `REQUIRED`: in the transitive local dependency closure of sitemap routes, the homepage, or 404.
- `SUPPORT`: required hosting/indexing/error/favicon files, plus the root favicon set.
- `UNCERTAIN`: unreferenced or mislinked content that could still be an intended route or prototype; keep and report.
- `UNUSED`: build notes, reports, QA, test/demo routes, working scripts, source archives, or files without a live dependency. Preserve under `_archive/build/` before excluding from `/livesite/`.

## File map

| Class | File | Bytes | Type |
|---|---|---:|---|
| UNUSED | `.DS_Store` | 10,244 | unknown |
| SUPPORT | `.htaccess` | 344 | unknown |
| SUPPORT | `404.html` | 2,354 | text/html |
| UNUSED | `A11Y_REPORT.md` | 7,905 | md |
| UNUSED | `COPY_CHANGES.md` | 14,735 | md |
| UNUSED | `README.md` | 366 | md |
| UNUSED | `aidesign/.DS_Store` | 6,148 | unknown |
| REQUIRED | `aidesign/Contact Prototype (standalone).html` | 5,633 | text/html |
| REQUIRED | `aidesign/experiments/index.html` | 12,639 | text/html |
| REQUIRED | `aidesign/experiments/stock-performance-test/index.html` | 22,293 | text/html |
| REQUIRED | `aidesign/index.html` | 28,227 | text/html |
| UNUSED | `aidesign/index/index.html` | 27,754 | text/html |
| REQUIRED | `aidesign/meeting_coach.html` | 5,652 | text/html |
| UNCERTAIN | `aidesign/meeting_coach_demo.html` | 5,662 | text/html |
| REQUIRED | `aidesign/partner.html` | 5,539 | text/html |
| REQUIRED | `aidesign/partner_fullscreen.html` | 5,697 | text/html |
| REQUIRED | `aidesign/self_care.html` | 5,554 | text/html |
| REQUIRED | `aidesign/share/contact.html` | 5,670 | text/html |
| REQUIRED | `aidesign/share/meeting-coach.html` | 5,712 | text/html |
| REQUIRED | `aidesign/share/partner.html` | 5,676 | text/html |
| REQUIRED | `aidesign/share/self-care.html` | 5,695 | text/html |
| REQUIRED | `analytics.js` | 20,115 | text/javascript |
| SUPPORT | `android-chrome-192x192.png` | 2,907 | image/png |
| SUPPORT | `android-chrome-512x512.png` | 9,730 | image/png |
| SUPPORT | `apple-touch-icon.png` | 2,649 | image/png |
| UNUSED | `assets/.DS_Store` | 10,244 | unknown |
| REQUIRED | `assets/aidesign.css` | 26,309 | text/css |
| REQUIRED | `assets/aidesign.js` | 24,019 | text/javascript |
| UNUSED | `assets/aidesign/.DS_Store` | 6,148 | unknown |
| UNUSED | `assets/aidesign/New Folder With Items/contact-app-thumbnail.png` | 194,278 | image/png |
| UNUSED | `assets/aidesign/New Folder With Items/meeting-coach-app-thumbnail.png` | 201,194 | image/png |
| UNUSED | `assets/aidesign/New Folder With Items/partner-app-thumbnail.png` | 203,670 | image/png |
| UNUSED | `assets/aidesign/New Folder With Items/self-care-app-thumbnail.png` | 180,091 | image/png |
| REQUIRED | `assets/aidesign/contact-app-thumbnail.png` | 173,842 | image/png |
| REQUIRED | `assets/aidesign/contact-mobile-thumbnail.png` | 33,587 | image/png |
| UNCERTAIN | `assets/aidesign/contact-share.png` | 416,570 | image/png |
| UNCERTAIN | `assets/aidesign/contact-share.svg` | 3,153 | image/svg+xml |
| UNCERTAIN | `assets/aidesign/contacts-thumbnail.svg` | 6,113 | image/svg+xml |
| REQUIRED | `assets/aidesign/meeting-coach-app-thumbnail.png` | 177,972 | image/png |
| UNCERTAIN | `assets/aidesign/meeting-coach-app-thumbnail.svg` | 5,179 | image/svg+xml |
| REQUIRED | `assets/aidesign/meeting-coach-mobile-thumbnail.png` | 25,121 | image/png |
| UNCERTAIN | `assets/aidesign/meeting-coach-share.png` | 420,878 | image/png |
| UNCERTAIN | `assets/aidesign/meeting-coach-share.svg` | 2,980 | image/svg+xml |
| REQUIRED | `assets/aidesign/meeting-coach-thumbnail.png` | 14,739 | image/png |
| REQUIRED | `assets/aidesign/partner-app-thumbnail.png` | 182,423 | image/png |
| REQUIRED | `assets/aidesign/partner-mobile-thumbnail.png` | 26,147 | image/png |
| UNCERTAIN | `assets/aidesign/partner-share.png` | 767,472 | image/png |
| UNCERTAIN | `assets/aidesign/partner-thumbnail.svg` | 894 | image/svg+xml |
| REQUIRED | `assets/aidesign/prototypes/contact/index.html` | 9,504 | text/html |
| REQUIRED | `assets/aidesign/prototypes/contact/support.js` | 43,272 | text/javascript |
| REQUIRED | `assets/aidesign/prototypes/contact/vendor/react-dom.js` | 131,835 | text/javascript |
| REQUIRED | `assets/aidesign/prototypes/contact/vendor/react.js` | 10,751 | text/javascript |
| REQUIRED | `assets/aidesign/prototypes/meeting-coach/index.html` | 10,438 | text/html |
| REQUIRED | `assets/aidesign/prototypes/meeting-coach/support.js` | 43,272 | text/javascript |
| REQUIRED | `assets/aidesign/prototypes/meeting-coach/vendor/react-dom.js` | 131,835 | text/javascript |
| REQUIRED | `assets/aidesign/prototypes/meeting-coach/vendor/react.js` | 10,751 | text/javascript |
| REQUIRED | `assets/aidesign/prototypes/partner/index.html` | 8,631 | text/html |
| REQUIRED | `assets/aidesign/prototypes/partner/support.js` | 43,272 | text/javascript |
| REQUIRED | `assets/aidesign/prototypes/partner/vendor/react-dom.js` | 131,835 | text/javascript |
| REQUIRED | `assets/aidesign/prototypes/partner/vendor/react.js` | 10,751 | text/javascript |
| REQUIRED | `assets/aidesign/prototypes/self-care/index.html` | 9,141 | text/html |
| REQUIRED | `assets/aidesign/prototypes/self-care/support.js` | 43,272 | text/javascript |
| REQUIRED | `assets/aidesign/prototypes/self-care/vendor/react-dom.js` | 131,835 | text/javascript |
| REQUIRED | `assets/aidesign/prototypes/self-care/vendor/react.js` | 10,751 | text/javascript |
| REQUIRED | `assets/aidesign/self-care-app-thumbnail.png` | 167,768 | image/png |
| REQUIRED | `assets/aidesign/self-care-mobile-thumbnail.png` | 28,073 | image/png |
| UNCERTAIN | `assets/aidesign/self-care-share.png` | 463,068 | image/png |
| UNCERTAIN | `assets/aidesign/self-care-share.svg` | 2,737 | image/svg+xml |
| UNCERTAIN | `assets/aidesign/self-care-thumbnail.svg` | 4,173 | image/svg+xml |
| UNCERTAIN | `assets/capital-one-logo.png` | 56,331 | image/png |
| REQUIRED | `assets/capital-one-logo.svg` | 3,746 | image/svg+xml |
| REQUIRED | `assets/case-studies.css` | 13,123 | text/css |
| REQUIRED | `assets/case-studies.js` | 5,888 | text/javascript |
| REQUIRED | `assets/case-studies/nami-delaware-988-campaign/billboard-thumb.webp` | 61,486 | image/webp |
| UNCERTAIN | `assets/case-studies/nami-delaware-988-campaign/billboard.webp` | 262,544 | image/webp |
| REQUIRED | `assets/case-studies/nami-delaware-988-campaign/bus-shelter-thumb.webp` | 140,204 | image/webp |
| UNCERTAIN | `assets/case-studies/nami-delaware-988-campaign/bus-shelter.webp` | 358,838 | image/webp |
| UNCERTAIN | `assets/case-studies/nami-delaware-988-campaign/image-1-placeholder.svg` | 651 | image/svg+xml |
| UNCERTAIN | `assets/case-studies/nami-delaware-988-campaign/image-2-placeholder.svg` | 651 | image/svg+xml |
| UNCERTAIN | `assets/case-studies/nami-delaware-988-campaign/image-3-placeholder.svg` | 651 | image/svg+xml |
| UNCERTAIN | `assets/case-studies/nami-delaware-988-campaign/image-4-placeholder.svg` | 651 | image/svg+xml |
| UNCERTAIN | `assets/case-studies/nami-delaware-988-campaign/image-5-placeholder.svg` | 651 | image/svg+xml |
| REQUIRED | `assets/case-studies/nami-delaware-988-campaign/magazine-thumb.webp` | 128,564 | image/webp |
| UNCERTAIN | `assets/case-studies/nami-delaware-988-campaign/magazine.webp` | 561,446 | image/webp |
| REQUIRED | `assets/case-studies/nami-delaware-988-campaign/school-poster-thumb.webp` | 113,468 | image/webp |
| UNCERTAIN | `assets/case-studies/nami-delaware-988-campaign/school-poster.webp` | 307,944 | image/webp |
| REQUIRED | `assets/case-studies/nami-delaware-988-campaign/sms-thumb.webp` | 75,540 | image/webp |
| UNCERTAIN | `assets/case-studies/nami-delaware-988-campaign/sms.webp` | 227,976 | image/webp |
| REQUIRED | `assets/embeds/us20220261083a1.html` | 9,942 | text/html |
| REQUIRED | `assets/footer-animation-log.json` | 408 | application/json |
| UNCERTAIN | `assets/footer-art/all-04-footer.svg` | 30,623 | image/svg+xml |
| UNCERTAIN | `assets/footer-art/all-05-footer.svg` | 34,253 | image/svg+xml |
| UNCERTAIN | `assets/footer-art/all-06-footer.svg` | 29,501 | image/svg+xml |
| UNCERTAIN | `assets/footer-art/curve-stroke.svg` | 6,123 | image/svg+xml |
| UNCERTAIN | `assets/footer-art/site-footer-02_all-02.png` | 3,835,248 | image/png |
| UNCERTAIN | `assets/footer-art/site-footer-rev-sm.png` | 1,756,710 | image/png |
| UNCERTAIN | `assets/footer-art/site-footer-sm.png` | 2,448,491 | image/png |
| UNCERTAIN | `assets/footer-art/site-footer.png` | 18,722,140 | image/png |
| UNCERTAIN | `assets/fpo-large-atlas-1900x1600.svg` | 947 | image/svg+xml |
| UNCERTAIN | `assets/fpo-large-city-transit-1900x1600.svg` | 959 | image/svg+xml |
| UNCERTAIN | `assets/fpo-large-field-notes-1900x1600.svg` | 955 | image/svg+xml |
| UNCERTAIN | `assets/fpo-large-hollow-creek-1900x1600.svg` | 955 | image/svg+xml |
| UNCERTAIN | `assets/fpo-large-northline-1900x1600.svg` | 951 | image/svg+xml |
| UNCERTAIN | `assets/fpo-large-wren-1900x1600.svg` | 941 | image/svg+xml |
| UNCERTAIN | `assets/fpo-thumb-760x570.svg` | 775 | image/svg+xml |
| UNUSED | `assets/home-2027/README.md` | 2,393 | md |
| REQUIRED | `assets/home-2027/agency-home.css` | 24,398 | text/css |
| REQUIRED | `assets/home-2027/agency-home.js` | 8,505 | text/javascript |
| REQUIRED | `assets/home-2027/agency-site.css` | 6,550 | text/css |
| UNUSED | `assets/home-2027/apply-site-theme.py` | 5,692 | text/x-python |
| REQUIRED | `assets/home-2027/demos/aidesign--Contact Prototype (standalone).html` | 1,055,733 | text/html |
| REQUIRED | `assets/home-2027/demos/aidesign--meeting_coach.html` | 3,926 | text/html |
| UNCERTAIN | `assets/home-2027/demos/aidesign--meeting_coach_demo.html` | 119,062 | text/html |
| REQUIRED | `assets/home-2027/demos/aidesign--partner.html` | 152,929 | text/html |
| REQUIRED | `assets/home-2027/demos/aidesign--partner_fullscreen.html` | 2,560 | text/html |
| REQUIRED | `assets/home-2027/demos/aidesign--self_care.html` | 1,017,262 | text/html |
| REQUIRED | `assets/home-2027/demos/aidesign--share--contact.html` | 2,262 | text/html |
| REQUIRED | `assets/home-2027/demos/aidesign--share--meeting-coach.html` | 2,326 | text/html |
| REQUIRED | `assets/home-2027/demos/aidesign--share--partner.html` | 2,260 | text/html |
| REQUIRED | `assets/home-2027/demos/aidesign--share--self-care.html` | 2,282 | text/html |
| UNUSED | `assets/home-2027/demos/macos26-slider--index.html` | 5,237 | text/html |
| UNUSED | `assets/home-2027/demos/nft-prototype.html` | 3,341 | text/html |
| UNCERTAIN | `assets/home-2027/home.css` | 15,300 | text/css |
| UNCERTAIN | `assets/home-2027/home.js` | 2,212 | text/javascript |
| REQUIRED | `assets/home-2027/large-logo-horizontal.svg` | 3,819 | image/svg+xml |
| UNCERTAIN | `assets/home-2027/logomark-lite.svg` | 518 | image/svg+xml |
| UNCERTAIN | `assets/home-2027/logomark.svg` | 518 | image/svg+xml |
| UNUSED | `assets/home-2027/propagate-agency.py` | 3,524 | text/x-python |
| UNUSED | `assets/home-2027/render-homes.cjs` | 272 | cjs |
| UNCERTAIN | `assets/home-2027/selected-home.html` | 22,866 | text/html |
| UNCERTAIN | `assets/home-2027/site.css` | 8,086 | text/css |
| UNCERTAIN | `assets/home-2027/site.js` | 1,617 | text/javascript |
| REQUIRED | `assets/home-2027/van-shea-headshot-2027-small.jpg` | 38,678 | image/jpeg |
| REQUIRED | `assets/home-2027/van-shea-headshot-2027.png` | 6,884,445 | image/png |
| UNCERTAIN | `assets/home-2027/van-shea-portrait.webp` | 170,334 | image/webp |
| UNCERTAIN | `assets/home-2027/wave-05-morph.svg` | 185,423 | image/svg+xml |
| UNCERTAIN | `assets/home-2027/wave-05-static.svg` | 10,813 | image/svg+xml |
| UNCERTAIN | `assets/home-2027/wave-header-02.js` | 6,194 | text/javascript |
| UNCERTAIN | `assets/icons/android-chrome-192x192.png` | 4,822 | image/png |
| UNCERTAIN | `assets/icons/android-chrome-512x512.png` | 15,288 | image/png |
| REQUIRED | `assets/icons/apple-touch-icon.png` | 4,395 | image/png |
| UNCERTAIN | `assets/icons/fav.ico` | 2,467 | image/x-icon |
| UNCERTAIN | `assets/icons/fav32px.png` | 765 | image/png |
| REQUIRED | `assets/icons/favicon-16x16.png` | 441 | image/png |
| REQUIRED | `assets/icons/favicon-32x32.png` | 765 | image/png |
| UNCERTAIN | `assets/icons/favicon-48x48.png` | 1,207 | image/png |
| REQUIRED | `assets/icons/favicon.ico` | 2,467 | image/x-icon |
| REQUIRED | `assets/icons/favicon.svg` | 497 | image/svg+xml |
| REQUIRED | `assets/icons/site.webmanifest` | 411 | application/manifest+json |
| UNCERTAIN | `assets/sm_logo_hor_3x.png` | 10,865 | image/png |
| REQUIRED | `assets/videos/capital-one-samples.mp4` | 32,762,342 | video/mp4 |
| REQUIRED | `assets/videos/mt_movie.mp4` | 49,045,132 | video/mp4 |
| REQUIRED | `assets/videos/vanguard-samples.mp4` | 2,092,928 | video/mp4 |
| REQUIRED | `assets/vscimage/config.json` | 39,871 | application/json |
| UNCERTAIN | `assets/vscimage/generated/capital-one-gesture-patent-pdf-fullscreen-3200x1800.webp` | 139,946 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/capital-one-gesture-patent-pdf-large-1900x1600.webp` | 72,712 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/capital-one-gesture-patent-pdf-logo-240.png` | 13,769 | image/png |
| UNCERTAIN | `assets/vscimage/generated/capital-one-gesture-patent-pdf-thumb-760x570.webp` | 29,832 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/capital-one-gesture-patent-role-pdf-fullscreen-3200x1800.webp` | 164,564 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/capital-one-gesture-patent-role-pdf-large-1900x1600.webp` | 85,084 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/capital-one-gesture-patent-role-pdf-logo-240.png` | 15,003 | image/png |
| UNCERTAIN | `assets/vscimage/generated/capital-one-gesture-patent-role-pdf-thumb-760x570.webp` | 35,564 | image/webp |
| REQUIRED | `assets/vscimage/generated/capital-one-patent-diagram-fullscreen-3200x1800.webp` | 70,106 | image/webp |
| REQUIRED | `assets/vscimage/generated/capital-one-patent-diagram-large-1900x1600.webp` | 39,088 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/capital-one-patent-diagram-logo-240.png` | 13,261 | image/png |
| REQUIRED | `assets/vscimage/generated/capital-one-patent-diagram-thumb-760x570.webp` | 13,060 | image/webp |
| REQUIRED | `assets/vscimage/generated/capital-one-patent-figure-pdf-fullscreen-3200x1800.webp` | 187,356 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/capital-one-patent-figure-pdf-large-1900x1600.webp` | 81,924 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/capital-one-patent-figure-pdf-logo-240.png` | 41,614 | image/png |
| REQUIRED | `assets/vscimage/generated/capital-one-patent-figure-pdf-thumb-760x570.webp` | 28,424 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/case-studies-fullscreen-3200x1800.webp` | 325,544 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/case-studies-large-1900x1600.webp` | 184,340 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/case-studies-logo-240.png` | 97,504 | image/png |
| UNCERTAIN | `assets/vscimage/generated/case-studies-thumb-760x570.webp` | 29,314 | image/webp |
| REQUIRED | `assets/vscimage/generated/exchange-1440-v01-default-fullscreen-3200x1800.webp` | 242,540 | image/webp |
| REQUIRED | `assets/vscimage/generated/exchange-1440-v01-default-large-1900x1600.webp` | 198,022 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/exchange-1440-v01-default-logo-240.png` | 31,218 | image/png |
| REQUIRED | `assets/vscimage/generated/exchange-1440-v01-default-thumb-760x570.webp` | 55,120 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/large-web-portfolio-airdolly-large-1900x1600.webp` | 113,962 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/large-web-portfolio-airdolly-logo-240.png` | 30,906 | image/png |
| UNCERTAIN | `assets/vscimage/generated/large-web-portfolio-airdolly-thumb-760x570.webp` | 32,640 | image/webp |
| REQUIRED | `assets/vscimage/generated/large-web-portfolio-airdolly23200x1800-fullscreen-3200x1800.webp` | 88,202 | image/webp |
| REQUIRED | `assets/vscimage/generated/large-web-portfolio-airdolly23200x1800-large-1900x1600.webp` | 67,074 | image/webp |
| REQUIRED | `assets/vscimage/generated/large-web-portfolio-airdolly23200x1800-thumb-760x570.webp` | 16,396 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/large-web-portfolio-fluidx-wire-3200x1800-fullscreen-3200x1800.webp` | 281,224 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/large-web-portfolio-fluidx-wire-3200x1800-large-1900x1600.webp` | 117,590 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/large-web-portfolio-fluidx-wire-3200x1800-thumb-760x570.webp` | 32,174 | image/webp |
| REQUIRED | `assets/vscimage/generated/large-web-portfolio-fluidx3200x1800-fullscreen-3200x1800.webp` | 113,972 | image/webp |
| REQUIRED | `assets/vscimage/generated/large-web-portfolio-fluidx3200x1800-large-1900x1600.webp` | 74,420 | image/webp |
| REQUIRED | `assets/vscimage/generated/large-web-portfolio-fluidx3200x1800-thumb-760x570.webp` | 20,770 | image/webp |
| REQUIRED | `assets/vscimage/generated/large-web-portfolio-gore3200x1800-fullscreen-3200x1800.webp` | 157,074 | image/webp |
| REQUIRED | `assets/vscimage/generated/large-web-portfolio-gore3200x1800-large-1900x1600.webp` | 84,494 | image/webp |
| REQUIRED | `assets/vscimage/generated/large-web-portfolio-gore3200x1800-thumb-760x570.webp` | 22,546 | image/webp |
| REQUIRED | `assets/vscimage/generated/large-web-portfolio-greif-large-1900x1600.webp` | 51,466 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/large-web-portfolio-greif-logo-240.png` | 38,102 | image/png |
| REQUIRED | `assets/vscimage/generated/large-web-portfolio-greif-thumb-760x570.webp` | 13,292 | image/webp |
| REQUIRED | `assets/vscimage/generated/large-web-portfolio-greif3200x1800-fullscreen-3200x1800.webp` | 42,050 | image/webp |
| REQUIRED | `assets/vscimage/generated/large-web-portfolio-greif3200x1800-large-1900x1600.webp` | 28,146 | image/webp |
| REQUIRED | `assets/vscimage/generated/large-web-portfolio-greif3200x1800-thumb-760x570.webp` | 8,782 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/large-web-portfolio-linedraw-01-3200x1800-large-1900x1600.webp` | 139,450 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/large-web-portfolio-linedraw-01-3200x1800-thumb-760x570.webp` | 37,172 | image/webp |
| REQUIRED | `assets/vscimage/generated/m-t3200x1800-fullscreen-3200x1800.webp` | 42,694 | image/webp |
| REQUIRED | `assets/vscimage/generated/m-t3200x1800-large-1900x1600.webp` | 25,952 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/m-t3200x1800-logo-240.png` | 9,939 | image/png |
| REQUIRED | `assets/vscimage/generated/m-t3200x1800-thumb-760x570.webp` | 8,324 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-current-state-journey-pdf-fullscreen-3200x1800.webp` | 284,412 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-current-state-journey-pdf-large-1900x1600.webp` | 132,448 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-current-state-journey-pdf-logo-240.png` | 33,007 | image/png |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-current-state-journey-pdf-thumb-760x570.webp` | 35,424 | image/webp |
| REQUIRED | `assets/vscimage/generated/mt-bank-future-b2b-lending-board-fullscreen-3200x1800.webp` | 438,204 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-future-b2b-lending-board-large-1900x1600.webp` | 206,428 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-future-b2b-lending-board-logo-240.png` | 37,374 | image/png |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-future-b2b-lending-board-thumb-760x570.webp` | 46,358 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-future-blueprint-pdf-fullscreen-3200x1800.webp` | 209,698 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-future-blueprint-pdf-large-1900x1600.webp` | 109,058 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-future-blueprint-pdf-logo-240.png` | 20,071 | image/png |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-future-blueprint-pdf-thumb-760x570.webp` | 46,080 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-service-design-role-pdf-fullscreen-3200x1800.webp` | 127,946 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-service-design-role-pdf-large-1900x1600.webp` | 63,776 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-service-design-role-pdf-logo-240.png` | 14,377 | image/png |
| UNCERTAIN | `assets/vscimage/generated/mt-bank-service-design-role-pdf-thumb-760x570.webp` | 25,656 | image/webp |
| REQUIRED | `assets/vscimage/generated/nami-988-campaign-featured-thumb-1200x659.webp` | 196,868 | image/webp |
| REQUIRED | `assets/vscimage/generated/nami-988-campaign-fullscreen-1693x929.webp` | 377,002 | image/webp |
| REQUIRED | `assets/vscimage/generated/nami-988-campaign-large-1693x929.webp` | 375,744 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/nami-988-campaign-thumb-760x570.webp` | 115,206 | image/webp |
| REQUIRED | `assets/vscimage/generated/nyu-2000-1-2000x1000-fullscreen-3200x1800.webp` | 47,126 | image/webp |
| REQUIRED | `assets/vscimage/generated/nyu-2000-1-2000x1000-large-1900x1600.webp` | 33,040 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/nyu-2000-1-2000x1000-logo-240.png` | 9,540 | image/png |
| REQUIRED | `assets/vscimage/generated/nyu-2000-1-2000x1000-thumb-760x570.webp` | 8,606 | image/webp |
| REQUIRED | `assets/vscimage/generated/politico-fullscreen-3200x1800.webp` | 48,660 | image/webp |
| REQUIRED | `assets/vscimage/generated/politico-large-1900x1600.webp` | 30,148 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/politico-logo-240.png` | 10,996 | image/png |
| REQUIRED | `assets/vscimage/generated/politico-thumb-760x570.webp` | 7,558 | image/webp |
| REQUIRED | `assets/vscimage/generated/sketches-and-nfts-fullscreen-3200x1800.webp` | 472,632 | image/webp |
| REQUIRED | `assets/vscimage/generated/sketches-and-nfts-large-1900x1600.webp` | 386,150 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/sketches-and-nfts-logo-240.png` | 114,342 | image/png |
| REQUIRED | `assets/vscimage/generated/sketches-and-nfts-thumb-760x570.webp` | 90,384 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-credentials-reset-pdf-fullscreen-3200x1800.webp` | 94,970 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-credentials-reset-pdf-large-1900x1600.webp` | 51,424 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-credentials-reset-pdf-logo-240.png` | 9,534 | image/png |
| UNCERTAIN | `assets/vscimage/generated/vanguard-credentials-reset-pdf-thumb-760x570.webp` | 14,838 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-md1-fullscreen-3200x1800.webp` | 77,508 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-md1-large-1900x1600.webp` | 45,764 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-md1-logo-240.png` | 13,713 | image/png |
| UNCERTAIN | `assets/vscimage/generated/vanguard-md1-thumb-760x570.webp` | 16,170 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-md2-fullscreen-3200x1800.webp` | 37,800 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-md2-large-1900x1600.webp` | 22,030 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-md2-logo-240.png` | 6,733 | image/png |
| UNCERTAIN | `assets/vscimage/generated/vanguard-md2-thumb-760x570.webp` | 7,472 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-security-quick-solutions-pdf-fullscreen-3200x1800.webp` | 166,660 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-security-quick-solutions-pdf-large-1900x1600.webp` | 86,518 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-security-quick-solutions-pdf-logo-240.png` | 15,443 | image/png |
| UNCERTAIN | `assets/vscimage/generated/vanguard-security-quick-solutions-pdf-thumb-760x570.webp` | 32,182 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-security-roadmap-pdf-fullscreen-3200x1800.webp` | 217,248 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-security-roadmap-pdf-large-1900x1600.webp` | 104,576 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-security-roadmap-pdf-logo-240.png` | 22,528 | image/png |
| UNCERTAIN | `assets/vscimage/generated/vanguard-security-roadmap-pdf-thumb-760x570.webp` | 35,594 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-smart-home-voice-role-pdf-fullscreen-3200x1800.webp` | 186,002 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-smart-home-voice-role-pdf-large-1900x1600.webp` | 96,910 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-smart-home-voice-role-pdf-logo-240.png` | 15,937 | image/png |
| UNCERTAIN | `assets/vscimage/generated/vanguard-smart-home-voice-role-pdf-thumb-760x570.webp` | 38,820 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-smart-home-voice-strategy-pdf-fullscreen-3200x1800.webp` | 211,484 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-smart-home-voice-strategy-pdf-large-1900x1600.webp` | 110,546 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard-smart-home-voice-strategy-pdf-logo-240.png` | 17,767 | image/png |
| UNCERTAIN | `assets/vscimage/generated/vanguard-smart-home-voice-strategy-pdf-thumb-760x570.webp` | 45,176 | image/webp |
| REQUIRED | `assets/vscimage/generated/vanguard3200x1800-fullscreen-3200x1800.webp` | 35,296 | image/webp |
| REQUIRED | `assets/vscimage/generated/vanguard3200x1800-large-1900x1600.webp` | 26,086 | image/webp |
| UNCERTAIN | `assets/vscimage/generated/vanguard3200x1800-logo-240.png` | 3,597 | image/png |
| REQUIRED | `assets/vscimage/generated/vanguard3200x1800-thumb-760x570.webp` | 8,398 | image/webp |
| REQUIRED | `assets/web_logomark_240_dark.png` | 4,710 | image/png |
| UNCERTAIN | `assets/web_logomark_240_lite.png` | 24,535 | image/png |
| REQUIRED | `assets/web_logomark_240_white.png` | 4,620 | image/png |
| UNUSED | `case-studies/.DS_Store` | 8,196 | unknown |
| REQUIRED | `case-studies/capital-one-gesture-patent/index.html` | 14,644 | text/html |
| REQUIRED | `case-studies/index.html` | 14,549 | text/html |
| REQUIRED | `case-studies/mt-bank-commercial-banking-transformation/index.html` | 14,557 | text/html |
| REQUIRED | `case-studies/nami-delaware-988-campaign/index.html` | 22,244 | text/html |
| REQUIRED | `case-studies/nyu-curriculum-alignment/index.html` | 13,967 | text/html |
| REQUIRED | `case-studies/vanguard-innovation-lab-integration/index.html` | 14,193 | text/html |
| UNUSED | `design-qa.md` | 6,164 | md |
| REQUIRED | `experience.html` | 15,748 | text/html |
| UNCERTAIN | `fav.ico` | 2,675 | image/x-icon |
| UNCERTAIN | `fav32px.png` | 864 | image/png |
| SUPPORT | `favicon-16x16.png` | 494 | image/png |
| SUPPORT | `favicon-32x32.png` | 864 | image/png |
| SUPPORT | `favicon-48x48.png` | 1,263 | image/png |
| SUPPORT | `favicon.ico` | 2,675 | image/x-icon |
| SUPPORT | `favicon.svg` | 746 | image/svg+xml |
| UNUSED | `home-2.html` | 24,735 | text/html |
| UNUSED | `home-3.html` | 24,735 | text/html |
| UNUSED | `home.html` | 24,737 | text/html |
| REQUIRED | `index.html` | 27,381 | text/html |
| UNUSED | `macos26-slider/assets/wallpaper-aqua.svg` | 1,285 | image/svg+xml |
| UNUSED | `macos26-slider/assets/wallpaper-aurora.svg` | 1,309 | image/svg+xml |
| UNUSED | `macos26-slider/assets/wallpaper-ember.svg` | 1,287 | image/svg+xml |
| UNUSED | `macos26-slider/assets/wallpaper-graphite.svg` | 1,307 | image/svg+xml |
| UNUSED | `macos26-slider/index.html` | 5,625 | text/html |
| UNUSED | `macos26-slider/script.js` | 2,332 | text/javascript |
| UNUSED | `macos26-slider/styles.css` | 11,760 | text/css |
| UNCERTAIN | `nft-prototype.css` | 1,968 | text/css |
| UNUSED | `nft-prototype.html` | 5,629 | text/html |
| UNCERTAIN | `nft-prototype.js` | 24,420 | text/javascript |
| UNUSED | `qa/after-build-aidesign-index.png` | 144,145 | image/png |
| UNUSED | `qa/after-build-case-studies-index.png` | 252,521 | image/png |
| UNUSED | `qa/after-build-index.png` | 178,999 | image/png |
| UNUSED | `qa/after-build-work.png` | 107,951 | image/png |
| UNUSED | `qa/axe-after.json` | 30,286 | application/json |
| UNUSED | `qa/axe-before.json` | 46,790 | application/json |
| UNUSED | `qa/axe-dark.json` | 28,566 | application/json |
| UNUSED | `qa/axe-final.json` | 94,238 | application/json |
| UNUSED | `qa/axe-footer-wave.json` | 89,086 | application/json |
| UNUSED | `qa/before-build-aidesign-index.png` | 140,127 | image/png |
| UNUSED | `qa/before-build-case-studies-index.png` | 256,004 | image/png |
| UNUSED | `qa/before-build-index.png` | 173,878 | image/png |
| UNUSED | `qa/before-build-work.png` | 130,142 | image/png |
| UNUSED | `qa/dark-build-aidesign-index.png` | 144,145 | image/png |
| UNUSED | `qa/dark-build-case-studies-index.png` | 252,521 | image/png |
| UNUSED | `qa/dark-build-case-studies-nami-delaware-988-campaign-index.png` | 434,123 | image/png |
| UNUSED | `qa/dark-build-index.png` | 176,724 | image/png |
| UNUSED | `qa/dark-build-work.png` | 107,951 | image/png |
| UNUSED | `qa/final-build-aidesign-index.png` | 144,145 | image/png |
| UNUSED | `qa/final-build-case-studies-index.png` | 252,521 | image/png |
| UNUSED | `qa/final-build-case-studies-nami-delaware-988-campaign-index.png` | 434,123 | image/png |
| UNUSED | `qa/final-build-index.png` | 176,724 | image/png |
| UNUSED | `qa/final-build-work.png` | 107,951 | image/png |
| UNUSED | `qa/footer-wave-build-aidesign-index.png` | 169,072 | image/png |
| UNUSED | `qa/footer-wave-build-case-studies-index.png` | 281,020 | image/png |
| UNUSED | `qa/footer-wave-build-case-studies-nami-delaware-988-campaign-index.png` | 401,373 | image/png |
| UNUSED | `qa/footer-wave-build-index.png` | 128,687 | image/png |
| UNUSED | `qa/footer-wave-build-work.png` | 348,527 | image/png |
| UNUSED | `qa/home-2027/comparison.jpg` | 174,112 | image/jpeg |
| UNUSED | `qa/home-2027/desktop-first.jpg` | 62,254 | image/jpeg |
| UNUSED | `qa/home-2027/desktop-hero.jpg` | 60,938 | image/jpeg |
| UNUSED | `qa/home-2027/featured-work.jpg` | 179,231 | image/jpeg |
| UNUSED | `qa/home-2027/high-contrast.jpg` | 70,987 | image/jpeg |
| UNUSED | `qa/home-2027/mobile-hero.jpg` | 32,368 | image/jpeg |
| UNUSED | `qa/home-2027/mt-feature.jpg` | 127,636 | image/jpeg |
| UNUSED | `qa/home-2027/tinted-dark.jpg` | 67,443 | image/jpeg |
| UNUSED | `qa/normalize-shell.py` | 3,804 | text/x-python |
| UNUSED | `qa/run-axe.mjs` | 3,644 | text/javascript |
| UNUSED | `qa/run-smoke.mjs` | 3,983 | text/javascript |
| UNUSED | `qa/smoke.json` | 388 | application/json |
| SUPPORT | `robots.txt` | 64 | text/plain |
| REQUIRED | `script.js` | 58,426 | text/javascript |
| UNUSED | `seo/AUDIT.md` | 12,428 | md |
| UNUSED | `seo/REPORT.md` | 16,685 | md |
| SUPPORT | `site.webmanifest` | 397 | application/manifest+json |
| SUPPORT | `sitemap.xml` | 1,951 | application/xml |
| REQUIRED | `styles.css` | 73,943 | text/css |
| UNUSED | `vanshea-creative-blog-revised-1.4.1.zip` | 1,821,446 | application/zip |
| UNUSED | `vanshea-creative-blog-revised-1.4.2.zip` | 1,821,414 | application/zip |
| UNUSED | `vanshea-creative-blog-revised-1.4.4.zip` | 1,820,647 | application/zip |
| REQUIRED | `work.html` | 35,736 | text/html |

## Direct local references from every HTML page

### `404.html` (REQUIRED)
- `assets/home-2027/agency-site.css`
- `work.html`
### `aidesign/Contact Prototype (standalone).html` (REQUIRED)
- `aidesign/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/demos/aidesign--Contact Prototype (standalone).html`
- `assets/home-2027/large-logo-horizontal.svg`
- `case-studies/index.html`
- `experience.html`
- `work.html`
### `aidesign/experiments/index.html` (REQUIRED)
- `aidesign/experiments/stock-performance-test/index.html`
- `aidesign/index.html`
- `aidesign/meeting_coach.html`
- `aidesign/self_care.html`
- `analytics.js`
- `assets/aidesign.css`
- `assets/aidesign/meeting-coach-thumbnail.png`
- `assets/case-studies.css`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/icons/apple-touch-icon.png`
- `assets/icons/favicon-16x16.png`
- `assets/icons/favicon-32x32.png`
- `assets/icons/favicon.ico`
- `assets/icons/favicon.svg`
- `assets/icons/site.webmanifest`
- `case-studies/index.html`
- `experience.html`
- `script.js`
- `styles.css`
- `work.html`
### `aidesign/experiments/stock-performance-test/index.html` (REQUIRED)
- `aidesign/experiments/index.html`
- `aidesign/index.html`
- `analytics.js`
- `assets/aidesign.css`
- `assets/aidesign.js`
- `assets/case-studies.css`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/icons/apple-touch-icon.png`
- `assets/icons/favicon-16x16.png`
- `assets/icons/favicon-32x32.png`
- `assets/icons/favicon.ico`
- `assets/icons/favicon.svg`
- `assets/icons/site.webmanifest`
- `case-studies/index.html`
- `experience.html`
- `script.js`
- `styles.css`
- `work.html`
### `aidesign/index.html` (REQUIRED)
- `aidesign/Contact Prototype (standalone).html`
- `aidesign/index.html`
- `aidesign/meeting_coach.html`
- `aidesign/partner.html`
- `aidesign/partner_fullscreen.html`
- `aidesign/self_care.html`
- `analytics.js`
- `assets/aidesign.css`
- `assets/aidesign.js`
- `assets/aidesign/contact-app-thumbnail.png`
- `assets/aidesign/contact-mobile-thumbnail.png`
- `assets/aidesign/meeting-coach-app-thumbnail.png`
- `assets/aidesign/meeting-coach-mobile-thumbnail.png`
- `assets/aidesign/partner-app-thumbnail.png`
- `assets/aidesign/partner-mobile-thumbnail.png`
- `assets/aidesign/self-care-app-thumbnail.png`
- `assets/aidesign/self-care-mobile-thumbnail.png`
- `assets/case-studies.css`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/icons/apple-touch-icon.png`
- `assets/icons/favicon-16x16.png`
- `assets/icons/favicon-32x32.png`
- `assets/icons/favicon.ico`
- `assets/icons/favicon.svg`
- `assets/icons/site.webmanifest`
- `case-studies/index.html`
- `experience.html`
- `script.js`
- `styles.css`
- `work.html`
### `aidesign/index/index.html` (UNUSED or unlisted route)
- `aidesign/Contact Prototype (standalone).html`
- `aidesign/index.html`
- `aidesign/meeting_coach.html`
- `aidesign/partner.html`
- `aidesign/partner_fullscreen.html`
- `aidesign/self_care.html`
- `analytics.js`
- `assets/aidesign.css`
- `assets/aidesign.js`
- `assets/aidesign/contact-app-thumbnail.png`
- `assets/aidesign/meeting-coach-app-thumbnail.png`
- `assets/aidesign/partner-app-thumbnail.png`
- `assets/aidesign/self-care-app-thumbnail.png`
- `assets/case-studies.css`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/icons/apple-touch-icon.png`
- `assets/icons/favicon-16x16.png`
- `assets/icons/favicon-32x32.png`
- `assets/icons/favicon.ico`
- `assets/icons/favicon.svg`
- `assets/icons/site.webmanifest`
- `case-studies/index.html`
- `experience.html`
- `script.js`
- `styles.css`
- `work.html`
### `aidesign/meeting_coach.html` (REQUIRED)
- `aidesign/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/demos/aidesign--meeting_coach.html`
- `assets/home-2027/large-logo-horizontal.svg`
- `case-studies/index.html`
- `experience.html`
- `work.html`
### `aidesign/meeting_coach_demo.html` (UNCERTAIN)
- `aidesign/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/demos/aidesign--meeting_coach_demo.html`
- `assets/home-2027/large-logo-horizontal.svg`
- `case-studies/index.html`
- `experience.html`
- `work.html`
### `aidesign/partner.html` (REQUIRED)
- `aidesign/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/demos/aidesign--partner.html`
- `assets/home-2027/large-logo-horizontal.svg`
- `case-studies/index.html`
- `experience.html`
- `work.html`
### `aidesign/partner_fullscreen.html` (REQUIRED)
- `aidesign/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/demos/aidesign--partner_fullscreen.html`
- `assets/home-2027/large-logo-horizontal.svg`
- `case-studies/index.html`
- `experience.html`
- `work.html`
### `aidesign/self_care.html` (REQUIRED)
- `aidesign/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/demos/aidesign--self_care.html`
- `assets/home-2027/large-logo-horizontal.svg`
- `case-studies/index.html`
- `experience.html`
- `work.html`
### `aidesign/share/contact.html` (REQUIRED)
- `aidesign/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/demos/aidesign--share--contact.html`
- `assets/home-2027/large-logo-horizontal.svg`
- `case-studies/index.html`
- `experience.html`
- `work.html`
### `aidesign/share/meeting-coach.html` (REQUIRED)
- `aidesign/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/demos/aidesign--share--meeting-coach.html`
- `assets/home-2027/large-logo-horizontal.svg`
- `case-studies/index.html`
- `experience.html`
- `work.html`
### `aidesign/share/partner.html` (REQUIRED)
- `aidesign/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/demos/aidesign--share--partner.html`
- `assets/home-2027/large-logo-horizontal.svg`
- `case-studies/index.html`
- `experience.html`
- `work.html`
### `aidesign/share/self-care.html` (REQUIRED)
- `aidesign/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/demos/aidesign--share--self-care.html`
- `assets/home-2027/large-logo-horizontal.svg`
- `case-studies/index.html`
- `experience.html`
- `work.html`
### `assets/aidesign/prototypes/contact/index.html` (REQUIRED)
- `assets/aidesign/prototypes/contact/support.js`
- `assets/aidesign/prototypes/contact/vendor/react-dom.js`
- `assets/aidesign/prototypes/contact/vendor/react.js`
### `assets/aidesign/prototypes/meeting-coach/index.html` (REQUIRED)
- `assets/aidesign/prototypes/meeting-coach/support.js`
- `assets/aidesign/prototypes/meeting-coach/vendor/react-dom.js`
- `assets/aidesign/prototypes/meeting-coach/vendor/react.js`
### `assets/aidesign/prototypes/partner/index.html` (REQUIRED)
- `assets/aidesign/prototypes/partner/support.js`
- `assets/aidesign/prototypes/partner/vendor/react-dom.js`
- `assets/aidesign/prototypes/partner/vendor/react.js`
### `assets/aidesign/prototypes/self-care/index.html` (REQUIRED)
- `assets/aidesign/prototypes/self-care/support.js`
- `assets/aidesign/prototypes/self-care/vendor/react-dom.js`
- `assets/aidesign/prototypes/self-care/vendor/react.js`
### `assets/embeds/us20220261083a1.html` (REQUIRED)
- `assets/vscimage/generated/capital-one-patent-figure-pdf-thumb-760x570.webp`
### `assets/home-2027/demos/aidesign--Contact Prototype (standalone).html` (REQUIRED)
- `aidesign/index.html`
### `assets/home-2027/demos/aidesign--meeting_coach.html` (REQUIRED)
- `aidesign/index.html`
### `assets/home-2027/demos/aidesign--meeting_coach_demo.html` (UNCERTAIN)
- `aidesign/index.html`
### `assets/home-2027/demos/aidesign--partner.html` (REQUIRED)
- `aidesign/index.html`
### `assets/home-2027/demos/aidesign--partner_fullscreen.html` (REQUIRED)
- `aidesign/index.html`
- `aidesign/partner.html`
### `assets/home-2027/demos/aidesign--self_care.html` (REQUIRED)
- `aidesign/index.html`
### `assets/home-2027/demos/aidesign--share--contact.html` (REQUIRED)
- `aidesign/index.html`
### `assets/home-2027/demos/aidesign--share--meeting-coach.html` (REQUIRED)
- `aidesign/index.html`
### `assets/home-2027/demos/aidesign--share--partner.html` (REQUIRED)
- `aidesign/index.html`
### `assets/home-2027/demos/aidesign--share--self-care.html` (REQUIRED)
- `aidesign/index.html`
### `assets/home-2027/demos/macos26-slider--index.html` (UNUSED or unlisted route)
- `apple-touch-icon.png`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `favicon.ico`
- `favicon.svg`
- `macos26-slider/index.html`
- `site.webmanifest`
### `assets/home-2027/demos/nft-prototype.html` (UNUSED or unlisted route)
- `apple-touch-icon.png`
- `favicon-16x16.png`
- `favicon-32x32.png`
- `favicon.ico`
- `favicon.svg`
- `site.webmanifest`
### `assets/home-2027/selected-home.html` (UNUSED or unlisted route)
- `aidesign/index.html`
- `assets/aidesign/prototypes/contact/index.html`
- `assets/aidesign/prototypes/meeting-coach/index.html`
- `assets/aidesign/prototypes/partner/index.html`
- `assets/aidesign/prototypes/self-care/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/home-2027/van-shea-headshot-2027-small.jpg`
- `assets/home-2027/van-shea-headshot-2027.png`
- `assets/home-2027/wave-05-static.svg`
- `assets/icons/favicon.svg`
- `assets/vscimage/generated/capital-one-patent-figure-pdf-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/mt-bank-future-b2b-lending-board-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/nami-988-campaign-fullscreen-1693x929.webp`
- `assets/vscimage/generated/vanguard3200x1800-fullscreen-3200x1800.webp`
- `case-studies/capital-one-gesture-patent/index.html`
- `case-studies/index.html`
- `case-studies/mt-bank-commercial-banking-transformation/index.html`
- `case-studies/nami-delaware-988-campaign/index.html`
- `case-studies/nyu-curriculum-alignment/index.html`
- `case-studies/vanguard-innovation-lab-integration/index.html`
- `experience.html`
- `work.html`
### `case-studies/capital-one-gesture-patent/index.html` (REQUIRED)
- `aidesign/index.html`
- `analytics.js`
- `assets/case-studies.css`
- `assets/case-studies.js`
- `assets/embeds/us20220261083a1.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/icons/apple-touch-icon.png`
- `assets/icons/favicon-16x16.png`
- `assets/icons/favicon-32x32.png`
- `assets/icons/favicon.ico`
- `assets/icons/favicon.svg`
- `assets/icons/site.webmanifest`
- `assets/videos/capital-one-samples.mp4`
- `assets/vscimage/generated/capital-one-patent-figure-pdf-fullscreen-3200x1800.webp`
- `case-studies/index.html`
- `case-studies/nami-delaware-988-campaign/index.html`
- `case-studies/vanguard-innovation-lab-integration/index.html`
- `experience.html`
- `script.js`
- `styles.css`
- `work.html`
### `case-studies/index.html` (REQUIRED)
- `aidesign/index.html`
- `analytics.js`
- `assets/capital-one-logo.svg`
- `assets/case-studies.css`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/icons/apple-touch-icon.png`
- `assets/icons/favicon-16x16.png`
- `assets/icons/favicon-32x32.png`
- `assets/icons/favicon.ico`
- `assets/icons/favicon.svg`
- `assets/icons/site.webmanifest`
- `assets/vscimage/generated/m-t3200x1800-thumb-760x570.webp`
- `assets/vscimage/generated/nami-988-campaign-featured-thumb-1200x659.webp`
- `assets/vscimage/generated/nyu-2000-1-2000x1000-thumb-760x570.webp`
- `assets/vscimage/generated/vanguard3200x1800-thumb-760x570.webp`
- `case-studies/capital-one-gesture-patent/index.html`
- `case-studies/index.html`
- `case-studies/mt-bank-commercial-banking-transformation/index.html`
- `case-studies/nami-delaware-988-campaign/index.html`
- `case-studies/nyu-curriculum-alignment/index.html`
- `case-studies/vanguard-innovation-lab-integration/index.html`
- `experience.html`
- `script.js`
- `styles.css`
- `work.html`
### `case-studies/mt-bank-commercial-banking-transformation/index.html` (REQUIRED)
- `aidesign/index.html`
- `analytics.js`
- `assets/case-studies.css`
- `assets/case-studies.js`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/icons/apple-touch-icon.png`
- `assets/icons/favicon-16x16.png`
- `assets/icons/favicon-32x32.png`
- `assets/icons/favicon.ico`
- `assets/icons/favicon.svg`
- `assets/icons/site.webmanifest`
- `assets/videos/mt_movie.mp4`
- `assets/vscimage/generated/m-t3200x1800-fullscreen-3200x1800.webp`
- `case-studies/index.html`
- `case-studies/nami-delaware-988-campaign/index.html`
- `case-studies/nyu-curriculum-alignment/index.html`
- `experience.html`
- `script.js`
- `styles.css`
- `work.html`
### `case-studies/nami-delaware-988-campaign/index.html` (REQUIRED)
- `aidesign/index.html`
- `analytics.js`
- `assets/case-studies.css`
- `assets/case-studies.js`
- `assets/case-studies/nami-delaware-988-campaign/billboard-thumb.webp`
- `assets/case-studies/nami-delaware-988-campaign/bus-shelter-thumb.webp`
- `assets/case-studies/nami-delaware-988-campaign/magazine-thumb.webp`
- `assets/case-studies/nami-delaware-988-campaign/school-poster-thumb.webp`
- `assets/case-studies/nami-delaware-988-campaign/sms-thumb.webp`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/icons/apple-touch-icon.png`
- `assets/icons/favicon-16x16.png`
- `assets/icons/favicon-32x32.png`
- `assets/icons/favicon.ico`
- `assets/icons/favicon.svg`
- `assets/icons/site.webmanifest`
- `assets/vscimage/generated/nami-988-campaign-large-1693x929.webp`
- `case-studies/capital-one-gesture-patent/index.html`
- `case-studies/index.html`
- `case-studies/mt-bank-commercial-banking-transformation/index.html`
- `experience.html`
- `script.js`
- `styles.css`
- `work.html`
### `case-studies/nyu-curriculum-alignment/index.html` (REQUIRED)
- `aidesign/index.html`
- `analytics.js`
- `assets/case-studies.css`
- `assets/case-studies.js`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/icons/apple-touch-icon.png`
- `assets/icons/favicon-16x16.png`
- `assets/icons/favicon-32x32.png`
- `assets/icons/favicon.ico`
- `assets/icons/favicon.svg`
- `assets/icons/site.webmanifest`
- `case-studies/index.html`
- `case-studies/mt-bank-commercial-banking-transformation/index.html`
- `case-studies/vanguard-innovation-lab-integration/index.html`
- `experience.html`
- `script.js`
- `styles.css`
- `work.html`
### `case-studies/vanguard-innovation-lab-integration/index.html` (REQUIRED)
- `aidesign/index.html`
- `analytics.js`
- `assets/case-studies.css`
- `assets/case-studies.js`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/icons/apple-touch-icon.png`
- `assets/icons/favicon-16x16.png`
- `assets/icons/favicon-32x32.png`
- `assets/icons/favicon.ico`
- `assets/icons/favicon.svg`
- `assets/icons/site.webmanifest`
- `assets/videos/vanguard-samples.mp4`
- `assets/vscimage/generated/vanguard3200x1800-fullscreen-3200x1800.webp`
- `case-studies/capital-one-gesture-patent/index.html`
- `case-studies/index.html`
- `case-studies/nyu-curriculum-alignment/index.html`
- `experience.html`
- `script.js`
- `styles.css`
- `work.html`
### `experience.html` (REQUIRED)
- `aidesign/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/icons/apple-touch-icon.png`
- `assets/icons/favicon-16x16.png`
- `assets/icons/favicon-32x32.png`
- `assets/icons/favicon.ico`
- `assets/icons/favicon.svg`
- `assets/icons/site.webmanifest`
- `case-studies/capital-one-gesture-patent/index.html`
- `case-studies/index.html`
- `case-studies/mt-bank-commercial-banking-transformation/index.html`
- `case-studies/nyu-curriculum-alignment/index.html`
- `case-studies/vanguard-innovation-lab-integration/index.html`
- `experience.html`
- `script.js`
- `styles.css`
- `work.html`
### `home-2.html` (UNUSED or unlisted route)
- `aidesign/index.html`
- `assets/aidesign/prototypes/contact/index.html`
- `assets/aidesign/prototypes/meeting-coach/index.html`
- `assets/aidesign/prototypes/partner/index.html`
- `assets/aidesign/prototypes/self-care/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/home-2027/van-shea-headshot-2027-small.jpg`
- `assets/home-2027/van-shea-headshot-2027.png`
- `assets/icons/favicon.svg`
- `assets/vscimage/generated/capital-one-patent-figure-pdf-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/mt-bank-future-b2b-lending-board-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/nami-988-campaign-fullscreen-1693x929.webp`
- `assets/vscimage/generated/vanguard3200x1800-fullscreen-3200x1800.webp`
- `case-studies/capital-one-gesture-patent/index.html`
- `case-studies/index.html`
- `case-studies/mt-bank-commercial-banking-transformation/index.html`
- `case-studies/nami-delaware-988-campaign/index.html`
- `case-studies/nyu-curriculum-alignment/index.html`
- `case-studies/vanguard-innovation-lab-integration/index.html`
- `experience.html`
- `work.html`
### `home-3.html` (UNUSED or unlisted route)
- `aidesign/index.html`
- `assets/aidesign/prototypes/contact/index.html`
- `assets/aidesign/prototypes/meeting-coach/index.html`
- `assets/aidesign/prototypes/partner/index.html`
- `assets/aidesign/prototypes/self-care/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/home-2027/van-shea-headshot-2027-small.jpg`
- `assets/home-2027/van-shea-headshot-2027.png`
- `assets/icons/favicon.svg`
- `assets/vscimage/generated/capital-one-patent-figure-pdf-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/mt-bank-future-b2b-lending-board-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/nami-988-campaign-fullscreen-1693x929.webp`
- `assets/vscimage/generated/vanguard3200x1800-fullscreen-3200x1800.webp`
- `case-studies/capital-one-gesture-patent/index.html`
- `case-studies/index.html`
- `case-studies/mt-bank-commercial-banking-transformation/index.html`
- `case-studies/nami-delaware-988-campaign/index.html`
- `case-studies/nyu-curriculum-alignment/index.html`
- `case-studies/vanguard-innovation-lab-integration/index.html`
- `experience.html`
- `work.html`
### `home.html` (UNUSED or unlisted route)
- `aidesign/index.html`
- `assets/aidesign/prototypes/contact/index.html`
- `assets/aidesign/prototypes/meeting-coach/index.html`
- `assets/aidesign/prototypes/partner/index.html`
- `assets/aidesign/prototypes/self-care/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/home-2027/van-shea-headshot-2027-small.jpg`
- `assets/home-2027/van-shea-headshot-2027.png`
- `assets/icons/favicon.svg`
- `assets/vscimage/generated/capital-one-patent-figure-pdf-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/mt-bank-future-b2b-lending-board-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/nami-988-campaign-fullscreen-1693x929.webp`
- `assets/vscimage/generated/vanguard3200x1800-fullscreen-3200x1800.webp`
- `case-studies/capital-one-gesture-patent/index.html`
- `case-studies/index.html`
- `case-studies/mt-bank-commercial-banking-transformation/index.html`
- `case-studies/nami-delaware-988-campaign/index.html`
- `case-studies/nyu-curriculum-alignment/index.html`
- `case-studies/vanguard-innovation-lab-integration/index.html`
- `experience.html`
- `work.html`
### `index.html` (REQUIRED)
- `aidesign/index.html`
- `assets/aidesign/prototypes/contact/index.html`
- `assets/aidesign/prototypes/meeting-coach/index.html`
- `assets/aidesign/prototypes/partner/index.html`
- `assets/aidesign/prototypes/self-care/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/home-2027/van-shea-headshot-2027-small.jpg`
- `assets/home-2027/van-shea-headshot-2027.png`
- `assets/icons/favicon.svg`
- `assets/vscimage/generated/capital-one-patent-figure-pdf-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/mt-bank-future-b2b-lending-board-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/nami-988-campaign-fullscreen-1693x929.webp`
- `assets/vscimage/generated/vanguard3200x1800-fullscreen-3200x1800.webp`
- `case-studies/capital-one-gesture-patent/index.html`
- `case-studies/index.html`
- `case-studies/mt-bank-commercial-banking-transformation/index.html`
- `case-studies/nami-delaware-988-campaign/index.html`
- `case-studies/nyu-curriculum-alignment/index.html`
- `case-studies/vanguard-innovation-lab-integration/index.html`
- `experience.html`
- `work.html`
### `macos26-slider/index.html` (UNUSED or unlisted route)
- `aidesign/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/demos/macos26-slider--index.html`
- `assets/home-2027/large-logo-horizontal.svg`
- `case-studies/index.html`
- `experience.html`
- `work.html`
### `nft-prototype.html` (UNUSED or unlisted route)
- `aidesign/index.html`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/demos/nft-prototype.html`
- `assets/home-2027/large-logo-horizontal.svg`
- `case-studies/index.html`
- `experience.html`
- `work.html`
### `work.html` (REQUIRED)
- `aidesign/index.html`
- `analytics.js`
- `assets/home-2027/agency-home.css`
- `assets/home-2027/agency-home.js`
- `assets/home-2027/agency-site.css`
- `assets/home-2027/large-logo-horizontal.svg`
- `assets/icons/apple-touch-icon.png`
- `assets/icons/favicon-16x16.png`
- `assets/icons/favicon-32x32.png`
- `assets/icons/favicon.ico`
- `assets/icons/favicon.svg`
- `assets/icons/site.webmanifest`
- `assets/vscimage/generated/capital-one-patent-diagram-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/capital-one-patent-diagram-large-1900x1600.webp`
- `assets/vscimage/generated/capital-one-patent-diagram-thumb-760x570.webp`
- `assets/vscimage/generated/exchange-1440-v01-default-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/exchange-1440-v01-default-large-1900x1600.webp`
- `assets/vscimage/generated/exchange-1440-v01-default-thumb-760x570.webp`
- `assets/vscimage/generated/large-web-portfolio-airdolly23200x1800-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/large-web-portfolio-airdolly23200x1800-large-1900x1600.webp`
- `assets/vscimage/generated/large-web-portfolio-airdolly23200x1800-thumb-760x570.webp`
- `assets/vscimage/generated/large-web-portfolio-fluidx3200x1800-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/large-web-portfolio-fluidx3200x1800-large-1900x1600.webp`
- `assets/vscimage/generated/large-web-portfolio-fluidx3200x1800-thumb-760x570.webp`
- `assets/vscimage/generated/large-web-portfolio-gore3200x1800-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/large-web-portfolio-gore3200x1800-large-1900x1600.webp`
- `assets/vscimage/generated/large-web-portfolio-gore3200x1800-thumb-760x570.webp`
- `assets/vscimage/generated/large-web-portfolio-greif-large-1900x1600.webp`
- `assets/vscimage/generated/large-web-portfolio-greif-thumb-760x570.webp`
- `assets/vscimage/generated/large-web-portfolio-greif3200x1800-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/large-web-portfolio-greif3200x1800-large-1900x1600.webp`
- `assets/vscimage/generated/large-web-portfolio-greif3200x1800-thumb-760x570.webp`
- `assets/vscimage/generated/m-t3200x1800-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/m-t3200x1800-large-1900x1600.webp`
- `assets/vscimage/generated/m-t3200x1800-thumb-760x570.webp`
- `assets/vscimage/generated/nami-988-campaign-featured-thumb-1200x659.webp`
- `assets/vscimage/generated/nami-988-campaign-fullscreen-1693x929.webp`
- `assets/vscimage/generated/nami-988-campaign-large-1693x929.webp`
- `assets/vscimage/generated/nyu-2000-1-2000x1000-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/nyu-2000-1-2000x1000-large-1900x1600.webp`
- `assets/vscimage/generated/nyu-2000-1-2000x1000-thumb-760x570.webp`
- `assets/vscimage/generated/politico-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/politico-large-1900x1600.webp`
- `assets/vscimage/generated/politico-thumb-760x570.webp`
- `assets/vscimage/generated/sketches-and-nfts-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/sketches-and-nfts-large-1900x1600.webp`
- `assets/vscimage/generated/sketches-and-nfts-thumb-760x570.webp`
- `assets/vscimage/generated/vanguard3200x1800-fullscreen-3200x1800.webp`
- `assets/vscimage/generated/vanguard3200x1800-large-1900x1600.webp`
- `assets/vscimage/generated/vanguard3200x1800-thumb-760x570.webp`
- `case-studies/capital-one-gesture-patent/index.html`
- `case-studies/index.html`
- `case-studies/mt-bank-commercial-banking-transformation/index.html`
- `case-studies/nami-delaware-988-campaign/index.html`
- `case-studies/nyu-curriculum-alignment/index.html`
- `case-studies/vanguard-innovation-lab-integration/index.html`
- `experience.html`
- `script.js`
- `styles.css`
- `work.html`

## Known unresolved local paths

- `assets/home-2027/demos/aidesign--meeting_coach.html` refers to `./meeting_coach_demo.html`, which does not exist at that path. It is within a public AI Design prototype route. A similarly named file exists with the prefix `aidesign--`; report-only per the release guardrail.
- `aidesign/index/index.html` (an alternate, unlisted route) references four `*-mobile-thumbnail-v2.png` paths absent from `/build/assets/aidesign/`. The page is outside the public dependency closure and is classified `UNUSED` pending any route decision.
- Prototype `support.js` files contain `.dc.html` string/regex checks; the static scanner treats these as code patterns, not resource fetches.

## External references observed

- Public pages reference Google Fonts; some pages reference Calendly resources. These remain external network dependencies and are not bundled locally.
- Navigation points to the existing same-site `/blog/`, which is why the current WordPress `/livesite/blog/` tree is retained under `Uncertain`.

## Release metadata findings

- Source `sitemap.xml`, canonical URLs, and social metadata use `https://vanshea.com` without `www`; production requires `https://www.vanshea.com`.
- Source `.htaccess` has unguarded rewrite directives and lacks the requested compression, cache and security-header configuration.
- Main HTML references favicons under `/assets/icons/`; the root has a parallel favicon set. Keep one valid referenced set plus root manifest icons in the release.
- `analytics.js` is linked by source pages, but its configuration defaults to provider `none`, empty measurement ID, and disabled GA/collection. No production analytics ID was found. The static bundle script strips the analytic loader/UI hooks.
- Full/static headshot references were updated in `/build/` before this release task; the original build files are preserved in place and will also be copied into `_archive/build-original-2026-09-28/` before staging edits.
