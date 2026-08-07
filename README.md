# ClubPass

Standalone Vite + React site for **ClubPass — Home Express by RewardLand**.

## Routes

| Path            | Page              | Notes                                     |
| --------------- | ----------------- | ----------------------------------------- |
| `/`             | `ClubPass`        | Desktop/web landing page (root page)      |
| `/clubpass-app` | `ClubPassApp`     | Mobile / in-app landing page              |

Routing lives in [src/routes.jsx](src/routes.jsx) (`react-router`).

## Structure

```
src/
  pages/ClubPass.jsx        landing page
  pages/ClubPassApp.jsx     in-app page
  css/clubpass.css          scoped to .clubpass-page
  css/clubpass-app.css      scoped to .clubpass-app-page
  routes.jsx                router
  App.jsx / main.jsx        app shell
public/images/              page artwork
```

Page metadata (`<title>`, `<meta>`) is rendered inline in each page — React 19
hoists those into `<head>`, so no Helmet dependency is needed.

## Scripts

```bash
npm install
npm run dev      # dev server
npm run build    # production build -> dist/
npm run preview  # serve the build
npm run lint     # oxlint
```

## Deploying

It's an SPA — the host must rewrite unknown paths to `index.html` so
`/clubpass-app` resolves on a hard refresh.
