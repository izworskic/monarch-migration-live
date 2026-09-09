# Monarch Migration Live repository contract

This repository owns the Monarch Migration Live decision engine and public application.

## Non-negotiable semantics
- Observed, modeled, historical and linked data must remain distinguishable.
- Migration Pulse is a modeled local migration/flight-opportunity index, never a butterfly count.
- Observation-record counts are not abundance estimates.
- Eastern and western monarch populations must not be collapsed into one population-status number.

## Data licensing
- iNaturalist ingestion is restricted to commercially reusable observation records (CC0 or CC BY). Do not republish photos unless their individual licenses are separately verified.
- GBIF occurrence queries are restricted to CC0 / CC BY.
- Journey North is linked, not ingested or republished, unless separate commercial-use permission is documented.

## Analytics
Every production page must include GA4 measurement ID `G-Y5D2V2W7HN`. Do not send precise coordinates or ZIP codes to analytics.

## Deployment boundary
This repository is the standalone tool owner. `izworskic/national-outdoor-tools-hub` may proxy and link to this app but must not absorb this engine implementation.

Canonical public route: `https://chrisizworski.com/national-tools/monarch-migration-live`.

## Release gates
Run `npm test` and `npm run score`. Minimum implementation release score is 90/100 and no hard veto in `benchmarks/release.json` may be violated. Production must then be probed for page/assets, `/api/status`, `/api/context`, `/api/sightings`, GA4, and canonical metadata before the hub link is merged.
