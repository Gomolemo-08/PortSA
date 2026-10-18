# Fix My Ward: Municipal Fault Reporting (South Africa)

React 18 + Vite 5 + Leaflet. Residents drop a pin anywhere in South Africa and municipal teams receive exact GPS coordinates.

## Run
    npm install
    npm run dev        # http://localhost:5173
    npm run build      # production build in /dist

## Features
- Map locked to South Africa (lat -34.9 to -22.1, lng 16.4 to 32.95), with province jump chips
- Pin validation: reverse-geocoded (OpenStreetMap Nominatim) so pins in Lesotho, Eswatini, Namibia or the ocean are rejected; falls back to the bounding box offline
- "Use my location" (GPS), report form, severity, reference numbers, persisted in localStorage
- Municipal view: update report status; filters; CSV export; copy coordinates; navigate link
- Civic mini-game "Council Chamber": 10 timed questions on SA local governance, streaks, ranks, best score
- Responsive from 320px phones to desktop; keyboard accessible
- 12 demo reports at real city coordinates (Reset button restores them)

Internet is needed for map tiles and address lookup. Production use should swap in your own tile provider/geocoder and a backend API.
