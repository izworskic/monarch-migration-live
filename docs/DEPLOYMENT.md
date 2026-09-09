# Deployment

## Vercel

This repository is zero-build static + serverless:
- static application: `public/`
- serverless endpoints: `api/`
- canonical/base-path routing: `vercel.json`

Import the GitHub repository into Vercel with the project name `monarch-migration-live`. Do not set a framework preset or custom build command; the repository routing already maps the public shell and API functions.

After the Vercel deployment is READY, validate:

1. `/national-tools/monarch-migration-live`
2. `/national-tools/monarch-migration-live/styles.css`
3. `/national-tools/monarch-migration-live/app.js`
4. `/national-tools/monarch-migration-live/api/status`
5. `/national-tools/monarch-migration-live/api/context?lat=43.6&lng=-84.7`
6. `/national-tools/monarch-migration-live/api/sightings?days=14&limit=5&nelat=45&nelng=-82&swlat=42&swlng=-87`
7. `/national-tools/monarch-migration-live/api/history?lat=43.6&lng=-84.7&radius=2.5`

Verify the production HTML includes canonical `https://chrisizworski.com/national-tools/monarch-migration-live` and GA4 `G-Y5D2V2W7HN`.

## National tools network

Only after the standalone deployment passes production probes:
- add a rewrite in `izworskic/national-outdoor-tools-hub` from `/national-tools/monarch-migration-live` and its assets/API paths to this deployment;
- add Monarch Migration Live to the Wildlife intent card, featured tools and wildlife library group;
- increment the hub ItemList count and add the canonical URL to structured data.

Do not copy the engine into the hub.
