# Design Portfolio Site

Simple HTML/CSS/JS portfolio site with an Express backend contact API that sends email via Resend.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your env file:

```bash
cp .env.example .env
```

3. Update `.env`:
- `RESEND_API_KEY`: Your Resend API key.
- `CONTACT_TO_EMAIL`: Inbox that receives contact form messages.
- `CONTACT_FROM_EMAIL`: Verified sender in your Resend account.

4. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## VSCimage Admin App

VSCimage is a separate webpage for administering logos and portfolio images.

- Open: `http://localhost:3000/vscimage`
- Upload any image size.
- Generate required variants:
  - Logo: `240x240`
  - Thumb: `760x570`
  - Large: `1900x1600`
  - Fullscreen: `3200x1800`
- Assign generated files to:
  - Light and dark logos
  - Each portfolio project's thumb, large, and fullscreen image
- Saved config file: `assets/vscimage/config.json`

VSCimage API endpoints:

- `GET /api/vscimage/config`
- `POST /api/vscimage/config`
- `GET /api/vscimage/files`
- `POST /api/vscimage/upload`

## API

- `POST /api/contact`
- JSON body:

```json
{
  "name": "Your Name",
  "email": "you@example.com",
  "brief": "Project details"
}
```
