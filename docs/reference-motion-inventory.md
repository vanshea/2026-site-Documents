# Reference motion inventory

Inspected https://austinknight.com on 2026-09-20 in headless Chrome at 1440 × 1000, 810 × 844, and 390 × 844. Captured rendered DOM, screenshots, media rules, active Web Animations timing and Element.animate calls during load, scroll and hover. No reference assets, fonts, colors or copy used.

## Observed order

Navigation, identity mark and hero, three work cards, portfolio link, podcasts, paired essays with slash separators, signup and reader logos, speaking and field research, contact. Current work uses cards rather than the list described in the brief. Follow the requested list and omit reference-only sections.

## Motion

Hero: staggered word/phrase opacity and vertical travel. Active animations include 128px upward travel, 1000ms duration, 1300ms and 1600ms delays, cubic-bezier(0.44, 0, 0.56, 1). Spring transforms use sampled linear easing, including 1600ms duration. These timings describe sampled active animations, not every element.

Work: progressive viewport entry and image-led linked surfaces. Hover emphasizes the card. Essays: paired links with slash separators and interactive title treatment. Scrolling brings lower content into view with opacity and transform changes. Exact intersection thresholds and every spring parameter were not established; use the explicit brief values.

Repeated image strips exist; the requested four-pillar text ticker is an adaptation. No text marquee content is copied.

CSS breakpoints: below 810px, 810–1023px, additional layout variants at 1440px. Mobile navigation collapses. At 390px the reference headline wraps into phrases, not one word per line. Follow the brief's one-word lines below 640px.

## Implementation tuning

Hero: 80ms stagger, 16px travel, 440ms ease-out cubic. Subhead at 600ms and CTA at 660ms, 220ms each, finished by 880ms. Reveal heading and first block at 20% visibility, 12px up over 550ms, once. Work rows shift surface and move arrow 4px, desktop still previews. Essays underline from left. Ticker: 36s linear cycle, hover/focus/manual pause. Recommendations: 6s crossfade, hover/focus/manual pause. Reduced motion makes changes instant and stops auto-advance. No scroll-jacking.
