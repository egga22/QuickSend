Quick Link Send
================

Share links instantly with a friend in a shared "room" URL. Paste a link, click Send, and everyone on that room page sees it and can open it. Uses RESTDB.io for persistence (with a local demo fallback).

Features
- Room-based sharing via `?room=CODE` URLs
- Simple UI: paste link, send, open
- Polling for updates every ~2.5s
- RESTDB.io integration (API key + collection)
- Local demo mode if RESTDB isn’t configured

Project Structure
- `index.html` – Single-page app
- `styles.css` – Minimal styling
- `app.js` – Logic, RESTDB client, polling
- `config.example.js` – Fill and copy to `config.js`

Setup (RESTDB.io)
1) Create a database at https://restdb.io
2) Create a collection named `links` (or change the name in config). Fields are schemaless by default, but the app writes:
   - `room` (string)
   - `url` (string)
   - `sender` (string)
   - `createdAt` (ISO date string)
3) In Database → Security, enable CORS for your domain (during development you can set to `*` temporarily).
4) Create an API key (Database → API keys).

Configure
1) Copy `config.example.js` to `config.js`
2) Edit values:
   - `baseUrl`: e.g. `https://yourdb-1234.restdb.io/rest`
   - `apiKey`: your RESTDB API key
   - `collections.links`: `links` (or whatever you named it)

Run Locally
- Quick dev server (Python):
  - Python 3: `python3 -m http.server 5173`
  - Open `http://localhost:5173`
- Or open `index.html` directly in a browser (note: some browsers restrict `file://` + fetch; prefer a local server).

Usage
- Click Create Room or join with a code.
- Share the URL (Copy Room Link).
- Enter your name (optional), paste a URL, Send.
- The list updates every few seconds. Click Open to launch.

Notes
- If `config.js` is missing or left with placeholders, the app runs in local demo mode using `localStorage` (no network).
- Ensure RESTDB CORS settings allow your origin.
- Polling interval is 2500ms by default (see `POLL_MS` in `app.js`).

Deploy
- Any static hosting works (GitHub Pages, Netlify, Vercel, S3, etc.). Just include `config.js` alongside `index.html`.

