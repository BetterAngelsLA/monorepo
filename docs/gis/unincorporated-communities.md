# Unincorporated communities: the taxonomy, resolved

Whether LA County's unincorporated land can be broken into named communities rather
than one bucket holding two-thirds of the county's area. Resolved by probing the
layer; the answer is yes, with one specific filter.

## Verdict

**Load `CITY_TYPE = 'Unincorporated' AND Feat_Type = 'Land'` as a seventh dimension.**
That yields **120 named communities** from a **single authority**, and it is the
geography DPH already uses for unincorporated service delivery.

Source: [Community Boundaries (CSA)], layer 23 —
`https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/23`

## The filter, and what it excludes

The full layer mixes three publishers: `SOURCE` is `BOS` (county eGIS), `LA City`
(the city's own community geography) and `Long Beach City`, and `COMMUNITY` is
therefore not one countywide taxonomy. It also carries 19 water/pier/breakwater
features.

The filter excludes all of it. Within `CITY_TYPE='Unincorporated' AND
Feat_Type='Land'`, **100% of the 120 rows are `SOURCE='BOS'` with
`LCITY='Unincorporated'`** — one authority, one naming convention. `COMMUNITY` is
unique across all 120, as is `CSA_ID`.

Verified properties of that subset:

- **Non-overlapping and gap-free**: 0 intersecting pairs, sum = union = **2,603.02 sq mi**
- Coverage agrees with the county's legal landbase to **0.012%** (0.31 sq mi symmetric
  difference out of 2,603)
- DPH corroborates independently: its Community Health Profiles layer keys these exact
  units as `csa_unincorp_<name>` — **119 of 120 names match.** The 120-unit set is the
  de-facto recognised geography for county service delivery, not a GIS artefact.

## Non-defects

**`Arcadia` and `Azusa` looked mislabelled as unincorporated.** They are not. They are
real unincorporated land *adjacent to* those cities, named for them — 0.91 and 1.57
sq mi against a median of 1.79, so not slivers. Each touches its namesake city at
distance 0 with **0.0 sq ft of intersection**, while separate incorporated rows exist
(`City of Arcadia` 11.11 sq mi, `City of Azusa` 9.66). It is a **systematic county
convention** (also El Monte, Cerritos, Lakewood, Lynwood, Hawthorne, Pomona, Whittier,
Palmdale…).

**A filter that "cleaned up" these rows would delete ~2.5 sq mi of real county land.**
The defect was in the initial reading, not the data.

**Five names appeared under both `City` and `Unincorporated`** (`Del Rey`,
`Florence-Firestone`, `Harbor Gateway`, `Miracle Mile`, `Angeles National Forest`).
They are genuinely distinct, geometrically **disjoint** places sharing a name — exact
intersection 0.000000 sq mi for all five pairs. Disambiguated by `LCITY` + `LABEL`.
These five are the only collisions in the land subset (148 + 120 − 5 = 263).

**`NOTES` is unusable as a source of truth**: only 1 of the 120 rows has any text, and
it contains typos and a future-dated entry ("5/16/2029").

## Recommended shape

| | |
|---|---|
| code field | `CSA_ID` (unique inside this filter) |
| name field | `COMMUNITY` |
| filter | `CITY_TYPE = 'Unincorporated' AND Feat_Type = 'Land'` |
| count | 120 |

**Expect the largest units to dominate any area-weighted rollup.** Angeles National
Forest alone is 691 sq mi, 26.6% of all unincorporated land, and it is not a
population centre. Castaic, West Antelope Valley, Hi Vista and Santa Monica Mountains
are similarly vast and sparse. Interaction counts will not track area at all — the
useful signal is in the dense units (East Los Angeles, Florence-Firestone, Altadena,
Athens-Westmont, Lennox, Willowbrook).

## The one real weakness

**The layer publishes no edit date and no attribution.** `copyrightText` is empty,
`editingInfo` is null, and there are no date fields, so unlike every other dimension
we load, we cannot record a vintage or evidence authority from the service itself. The
Hub item was modified 2026-08-20 and sibling layer 19 shows edits to 2026-08-19, but
neither is provenance for *this* layer.

If dating matters, cross-check against the **DRP "City and Unincorporated Community
Boundary"**
(`https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/admin_dist_SDE_DIST_DRP_CITY_COMM_BDY/FeatureServer/0`,
last edited 2026-10-02) — but note it is **much coarser**: 79 unincorporated features,
with the entire Antelope Valley as one 1,800 sq mi polygon. It is a validation
reference, not an alternative dimension.

## Not doing this yet

The dimension is documented, not implemented. Adding it means a new `RegionKind`, an
entry in the importer's `SOURCES`, a migration, and an extension to the GraphQL enum —
mechanical, but it should land with its own import verification and a decision about
whether an empty `source_attribution` is acceptable for a dimension we cannot date.

[Community Boundaries (CSA)]: https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/23
