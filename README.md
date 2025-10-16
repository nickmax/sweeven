# Sweeven Café Site

This repository contains the static marketing site for Sweeven Café, including the public menu. Everything is built with vanilla HTML, Tailwind via CDN, and a lightweight Node server for local previews.

## Getting Started

```bash
npm install
npm start
```

The `start` script launches a simple static server on <http://localhost:3000>. Open the address in your browser to browse the home page (`index.html`) or the dedicated fullscreen menu (`menu.html`).

## Project Structure

- `index.html` – landing page with the embedded Canva menu preview.
- `menu.html` – standalone full-screen menu experience.
- `assets/` – images, icons, and other static assets served by the site.
- `server.js` – tiny Node server used for local development previews.

All menu content now lives directly in the HTML pages—no CMS, admin dashboard, or JSON API is required. Update copy or imagery by editing the corresponding markup files.
