# Phase 1 decision record

Reviewed 2026-09-26 without changing files. Recorded after the user approved Phase 2.

The supplied prompt and its ZIP copy are identical. The 140-file ZIP has two overlapping systems: an older React `vs-` prototype and the newer four-theme `vsx-` site patterns. The documents are reference material; the user's staged workflow and file restrictions take precedence.

The audit found 330 files in build and 5,697 in livesite. Excluding `.DS_Store`: 179 identical, 43 changed, 103 build-only, and 5,465 live-only. WordPress accounts for most live-only files; live also has a lab section absent from build. Promotion must preserve those files and exclude build QA, source archives, and unselected experiments.

Build's homepage uses agency-home.css; other pages layer legacy styles and agency overrides. Live uses styles.css plus page-specific CSS. Hardcoded values, duplicate fonts, !important rules, theme IDs, and competing storage keys prevent a new stylesheet alone from becoming authoritative. Build paths have `/build/` prefixes; live paths are rooted at `/`. Isolated preview origins are needed to avoid loading the root project's assets while viewing live.

Existing sync scripts regenerate HTML and delete destination directories. Git already exists; the unrelated untracked website-audit-for-codex.md must remain untouched. Phase 1 produced no commit because its no-file-changes instruction took precedence.

Approved Phase 2 assumptions:
1. Build the newer four-theme design system as plain HTML/CSS/JS, using one canonical token file.
2. Keep current build/live behavior untouched until an explicit migration and push.
3. Enable the accessible darker headline coral in Tinted and Wild.
4. Create leadership only as an example inside design-system.
5. Preserve WordPress and live-only content in the later scoped promotion workflow.

Phase 3 remains separate: dev/live reload, guarded push commands, backup and restore, and compatibility migration. Rollback should call the same protected live-write mechanism as push:live. Backups must be outside the public web root; obsolete files must be archived rather than deleted.
