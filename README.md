# NYC Public Pool Finder

A mobile-first map experiment for finding NYC Parks outdoor pools. It combines a local pool dataset with Leaflet, filters, official source links, and optional browser geolocation so “where can I swim?” becomes a quick answer.

## What this explores

- React and TypeScript with Vite
- Leaflet and React Leaflet map interactions
- Geolocation and distance sorting in the browser
- Search, borough filters, and closure states
- Using official NYC Parks links instead of pretending a static dataset is always current

The app ships with `src/pools.json`. Pool hours and closures can change, so the NYC Parks page linked in the app is the authority.

## Run it

```bash
npm install
npm run dev
# open the local URL printed by Vite
```

Build it with:

```bash
npm run build
```

## Next experiment

The next useful improvement is a refreshable data pipeline for seasonal hours and closures, not more map decoration.
