# Sweeven Menu CMS

This project now includes a lightweight content management system so the Sweeven Café menu can be edited without touching the HTML.

## Prerequisites

- Node.js 18+ (comes with `npm`)

## Install & Run

```bash
npm install
npm start
```

The command starts a small Node server on <http://localhost:3000>. It serves:

- the public site (`/`)
- a JSON API at `/api/menu`
- the CMS dashboard at `/sweeven-admin`

### Optional: Protect the CMS

Set an environment variable before starting the server to require a token for edits:

```bash
CMS_TOKEN=your-secret npm start
```

When the CMS prompts for a token, enter the same value and click **Save token**.

## Managing the Menu

1. Visit <http://localhost:3000/sweeven-admin>.
2. Sign in with the admin credentials supplied for your deployment.
3. (Optional) Enter the token if one is configured.
4. Edit categories, prices, names, and descriptions.
5. Click **Save changes** to persist updates. The menu is stored in `data/menu.json`.
6. Refresh the public page—menu updates render automatically through the API.

The public site falls back to the bundled `data/menu.json` if the API is offline, so the menu still loads during maintenance.
