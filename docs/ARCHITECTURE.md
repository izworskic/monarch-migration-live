# Architecture

## Public shell
Static HTML/CSS/ES module JavaScript. MapLibre GL uses OpenFreeMap tiles. The static shell remains useful if APIs degrade.

## Serverless APIs
- `api/sightings.js`: iNaturalist recent observations, commercial-license allowlist, 15-minute CDN cache.
- `api/context.js`: NWS hourly conditions + two iNaturalist time windows + deterministic migration model.
- `api/history.js`: GBIF local yearly observation facets, CC0/CC BY only, 6-hour cache.
- `api/geocode.js`: ZIP lookup.
- `api/status.js`: semantics/source contract.

## Model
`lib/monarch-model.js` is deterministic and unit-tested. It exposes published timing windows separately from the local composite Migration Pulse.

## Mounting
Standalone Vercel project, canonical path `/national-tools/monarch-migration-live`. `vercel.json` rewrites the base path to static assets and serverless functions.

## Privacy
Device geolocation is requested only on click. Precise location is stored only in local browser storage for repeat visits. Analytics receives product state, not coordinates.
