# NYC Public Pool Finder

Mobile-first web map of NYC Parks outdoor public pools.

Data source: https://www.nycgovparks.org/facilities/outdoor-pools and each pool detail page's schema.org `PublicSwimmingPool` data for coordinates, address, phone, and source links.

## Features
- Interactive OpenStreetMap/Leaflet map with pins for all NYC outdoor public pools
- Use current GPS location and show nearest pools by distance
- Tap pins/cards to view pool details, type, accessibility, closure note, phone, and NYC Parks link
- Borough and open/closed filters
- Mobile-first bottom sheet list

## Development
```bash
npm install
npm run dev
npm run build
```
