# Build Static FTP Upload

Source folder:
- `build/`

Upload target:
- Upload the contents of `ftp-upload/` into the host web root.

Included:
- `index.html`
- `experience.html`
- `styles.css`
- `script.js`
- `case-studies/`
- `aidesign/`
- `assets/`
- `.htaccess`

Important:
- This package is static only.
- It does not include the Express runtime, Next.js analytics app, or databases.
- App-only routes such as `/analytics`, `/app`, and `/login` are redirected to the homepage.
