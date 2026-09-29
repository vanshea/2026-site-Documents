# Building Toward 2027: Rethinking My Website from the Ground Up

*A look at the design, content, code, and release work behind the next version of vanshea.com.*

I started this redesign with a practical question: how can my website make it easier for someone to understand what I do, see the work behind it, and decide whether we should talk?

The answer took more than a new homepage. I spent the past several months shaping the site's story, simplifying its paths, building a reusable visual system, checking how the experience works on different screens, and preparing a careful local release. The result is a clearer direction for 2027 and a substantial amount of groundwork for getting there.

## Start with the story

My earlier homepage had a lot to say before it reached the work and the invitation to connect. It included separate sections about who I work with, how I work, my practice's pillars, and engagement; project listings; experiments; writing; and client recommendations. That material mattered, but the page asked visitors to take in too much at once.

I reshaped the homepage into a shorter sequence: identity, a direct statement of my practice, selected work, writing, experiments, contact, and footer. The longer explanation of who I work with and how I work, along with the practice pillars, engagement details, recommendations, and full inquiry form, moved to the About page. The Art page remains its own place for craft work.

That edit was about making the next step easier to see while keeping the substance available. The homepage now gives a quick introduction and evidence; the deeper context is one click away.

## Make the work easier to evaluate

The Work section now focuses on three projects: M&T Bank, Vanguard, and Capital One. I kept their existing case-study URLs and previews, so the shorter homepage still leads to the detailed stories. Across the broader site, I also worked on case-study presentation: layout spacing, outcome panels, next-project panels, mobile reading width, and image behavior.

The case studies cover different kinds of work, from commercial banking transformation and innovation-lab integration to a gesture patent. Preserving those pages and their routes was part of the redesign: a new front door only helps if the evidence behind it remains reachable.

## Give the page a tighter visual rhythm

I simplified the homepage typography to one family, Space Grotesk, and a small set of size and weight tokens. I also tuned the hero's motion: five masked lines enter vertically over one second, staggered by 120 milliseconds, while the emphasized words “guide” and “design” roll into place over 600 milliseconds. The subheading appears after the headline settles.

Those choices give the page a distinct opening without carrying the previous homepage's ticker, counters, recommendation carousel, decorative gradients, badges, and other competing elements forward. I kept the footer artwork as the site's visual signature.

The design was checked at desktop and mobile widths, including 1440 and 390 pixels. The revised page reduced the visible semantic element count before Contact from 47 to 31 on desktop and from 43 to 28 on mobile. The hero stacks into short lines on small screens, and the measured preview had no horizontal overflow. Motion also respects reduced-motion settings: the browser showed no running animations when that preference was enabled.

## Build a system that can grow

Alongside the homepage work, I created a standalone design system in plain HTML, CSS, and JavaScript. It has one source of truth for colors, type, spacing, radii, shadows, and motion, plus reusable page patterns and twelve HTML snippets. A complete leadership page serves as an example of how the pieces fit together.

The system includes four themes: Clear, Tinted, High Contrast, and Wild. Theme selection persists, the logo adapts to the background, and controls expose their selected state. It also includes an accessible image lightbox and a carousel without autoplay. The navigation stays visible on small screens, and interactive controls have generous touch targets.

I checked the example pages at 360, 768, 1280, and 1600 pixels across all four themes. The targeted checks found no horizontal overflow or broken image references. I adjusted headline colors where the original coral missed the large-text contrast threshold in two themes, and added focus treatments for dark panels and the image dialog. These are focused checks, not a claim that the whole site has been certified to an accessibility standard.

The system is deliberately its own source library for now. The existing build and live site still have older styles and scripts that can compete with new rules, so simply attaching the new stylesheet would not safely migrate them. The design system is a foundation; integrating it across the live site is a separate phase.

## Keep the supporting pages working

The redesign also involved the pieces that are easy to miss in a screenshot. I kept the WordPress blog separately deployed, updated its active theme's shared navigation and assets, and set up the homepage to show six writing titles. The build can fetch current WordPress posts or use a committed fallback snapshot when the API is unavailable, which makes offline builds deterministic.

The Art page retains its eight craft items and keyboard-operable lightbox. Existing fragment aliases continue to work, since a server cannot redirect a URL fragment on its own. I also kept the contact form's existing API integration and Google Form fallback when moving the full form to About.

## Prepare the release with care

I audited what was already in the build and live directories before preparing a local release. The live site contains the WordPress installation and other live-only content, so the release work had to preserve those files rather than assume the build was the whole website.

The local release bundle now contains 39 static HTML pages, the existing 5,452-file WordPress blog, the legacy lab route, and the assets needed by those pages. I corrected a static-export issue that could have removed AI Design Lab content, set canonical URLs and sitemap entries, added robots and custom 404 files, normalized root paths, and prepared hosting rules for HTTPS, route aliases, and sensitive-file access. I also restored existing social preview and footer images, added image dimensions where they were known, and reduced the size of authored CSS and JavaScript files.

The release checks confirmed that all 16 sitemap URLs and the relevant prototype, contact, and image routes returned successfully in the local preview. The preview also found a mobile homepage heading that may clip at 390 pixels when rendered with the production fonts. That needs a final visual decision before upload. Host-specific rewrite, compression, cache, and WordPress behavior also still need verification on the production server.

## Where the project stands

The redesign and release bundle are prepared locally; they have not been uploaded or deployed. The four-theme design system is available as a separate preview, while the existing build and live site have not yet been migrated to it. Some personal details on the redesigned site, including my years-of-experience figure, portrait, and role titles for selected case studies, still need my final input.

That is the work behind this 2027 redesign: a shorter story, a more focused way to explore the work, a reusable design foundation, responsive and accessibility-minded refinements, and a release process that accounts for the real site rather than a clean-room copy. The next step is to resolve the remaining content and production checks, then decide when to promote the prepared version.

The redesign is not just a different coat of paint. It is a clearer way into the work, built on a more deliberate system and a safer path to launch.
