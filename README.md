# Monarch Migration Live

A national monarch butterfly migration intelligence tool combining commercially reusable recent observations, published phenology, live NWS flight weather, historical occurrence context, Great Lakes concentration context, habitat timing and eastern/western population status.

## Run locally

```bash
npm test
npm run score
npm run dev
```

Open:
`http://localhost:3000/national-tools/monarch-migration-live`

Live API calls require internet access. The static shell and deterministic tests do not.

## Canonical production route
`https://chrisizworski.com/national-tools/monarch-migration-live`

## Data ethics / licensing
- iNaturalist: observation records restricted to CC0 / CC BY; no photos republished.
- GBIF: occurrence history restricted to CC0 / CC BY.
- Journey North: linked, not ingested, because historical data is noncommercial ShareAlike unless separate permission is obtained.
- Modeled Migration Pulse is never a butterfly count.

See `MASTER_EXECUTION_PROMPT.md` and `docs/DATA_SOURCES.md`.
