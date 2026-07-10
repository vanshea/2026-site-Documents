Complete static copy of the real public-facing site.

Local preview:
- http://localhost:3000/livesite/

This folder is manually maintained. Do not run general sync commands against it.
Copy only reviewed and approved files from `../build/`, preserving any live-only
content and server files.

Approved AI Design-only promotion:
- `npm run livesite:aidesign:promote`

FTP export:
- `npm run livesite:bundle`
