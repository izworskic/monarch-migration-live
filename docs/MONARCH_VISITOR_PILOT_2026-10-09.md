# Monarch Visitor-Intent Pilot — October 9, 2026

## What is being tested

Whether three monarch destination pages with distinct, crawlable, source-backed visitor guidance produce more qualified organic engagement than location pages using the original generic template.

This is a **quasi-experiment, not a randomized A/B test**. Sites differ substantially in search demand and seasonal lifecycle. Interpret relative gains cautiously.

## Treatment

- `/pacific-grove-ca`: official sanctuary status, seasonal timing, best viewing conditions, practical admission details.
- `/pismo-beach-ca`: official winter grove window, location and access, no false on-site presence claim.
- `/cape-may-nj`: migratory stopover, seasonal monitoring, official project, visitor considerations.

All three preserve the existing Migration Pulse, map, observations, historical data, canonical URLs, and the existing ZIP/location form. They add a visible static visitor answer and an outbound CTA event `monarch_visitor_guide_cta` (parameters `experiment=visitor_intent_v1`, `monarch_location`, `destination=official_monitoring`).

**Five untouched local page controls**: Chicago, Peninsula Point, South Bass Island, Austin and San Antonio.

## Baseline: Sep 9–Oct 6, 2026 (28 days, Search Console export)

| Page | Clicks | Impressions | CTR |
| --- | ---: | ---: | ---: |
| Cape May | 10 | 98 | 10.20% |
| Pacific Grove | 5 | 94 | 5.32% |
| Pismo Beach | 2 | 49 | 4.08% |
| **Treatment total** | **17** | **241** | **7.05%** |
| San Antonio | 4 | 67 | 5.97% |
| Austin | 1 | 35 | 2.86% |
| Chicago | 1 | 25 | 4.00% |
| Peninsula Point | 0 | 5 | 0% |
| South Bass Island | 0 | 3 | 0% |
| **Control total** | **6** | **135** | **4.44%** |

Data starts *after existing pages began indexing*, so this is a baseline, not a launch-time metric. The baseline has too few clicks for confident causal inference.

## Run book

1. Build `npm test`; verify treatment pages contain correct content/schema/canonical and controls remain unaltered.
2. Verify treated page HTML is accessible and not blocked/noindexed; verify map and live source behavior on production after deployment.
3. Record date/time of actual rollout. The four-week clock starts then, **not** from this document's creation date.
4. In Search Console, capture per-page daily Web clicks, impressions, CTR, position; compare the 28 days after rollout against 28 days before. Track the eight location pages separately and a rolling seven-day view.
5. In GA4, count `monarch_location_readout`, `monarch_visitor_guide_cta` and organic landing page sessions per treatment page. Beware legacy `monarch_location_readout` has a method classification issue for page presets.
6. Review whether location-specific search queries appear, source CTA helps visitors, and bounce/engagement changes. Check official links manually and never treat a model score as an on-site butterfly count.

## Interpretation

- **Early success**: sustained growth in nonbranded impressions, clicks and on-page engagement at treatment pages, after considering query mix, average position and seasonal demand.
- **Needs revision**: impressions up but CTR down, or visitors repeatedly leave without engaging.
- **Inconclusive**: per-page click counts remain in single digits; expand duration rather than declaring victory.
- Do **not** promise 2× clicks or statistical significance at this baseline volume.
- No additional location expansion should be committed solely on this pilot until the primary three location pages are reliable and measured.

## Source limitations

- Pacific Grove: official Museum monarch page, https://www.pgmuseum.org/monarchs. The museum's September 19, 2026 update stated that the sanctuary season had not begun; pilot does not present that dated status as today's live count.
- Pismo: California State Parks, https://parks.ca.gov/?page_id=30273.
- Cape May: New Jersey Audubon, https://njaudubon.org/monarch-monitoring/.

This pilot does **not** fix the shared migration model's western-season classification or loose geographic observation window. Those are independent correctness tasks, and visitor guidance explicitly limits claims until they are fixed.
