# LA boundary layers — currency audit

**Question this answers:** are the LA boundary layers we intend to load *current*, and which
ones are superseded?

**Method.** Every ArcGIS REST endpoint referenced in
[la-geodata-sources.md](la-geodata-sources.md) was probed live on **2026-10-13** (`?f=pjson`
metadata plus layer listings), and the ArcGIS **service layer lists** were read directly —
those are the authoritative statement of which vintage a publisher currently serves.

**Headline:** every endpoint probed was **reachable (15/15)**. The important discovery is that
the publishers themselves label current versus superseded vintages in their layer names, so we
can resolve currency from metadata rather than guessing from dates.

---

## 1. LA City Council Districts — the region we load. CURRENT.

| | |
|---|---|
| Layer | `Council Districts` (id **13**) |
| Service | `https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer` |
| CRS | EPSG:**3857** |
| Geometry | `esriGeometryPolygon` |
| Features | **15** (verified by count query) |
| Fields | `OBJECTID, NAME, District, District_Name, TOOLTIP, NLA_URL` |
| Shapefile | `geohub.lacity.org/api/download/v1/items/76104f230e384f38871eb3c4782f903d/shapefile?layers=13` |
| DBF last update | **2026-10-04** (verified from the downloaded `.dbf` header) |

**Superseded within the same service:**

| Layer id | Name | Verdict |
|---|---|---|
| 13 | Council Districts | **CURRENT** |
| 28 | Previous Council Districts (Adopted 2012) | superseded by id 13 |
| 14 | Previous Council Districts (Adopted 2003) | superseded by id 28 |

**Independent cross-check.** LA County publishes its *own* copy of the same boundary set as
`LA City Council Districts (2021)` in
`https://public.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/FeatureServer/33`.
It also returns **15** features with fields `OBJECTID, MEMBER, DISTRICT, DIST_MEMBER`. Two
independent official publishers agreeing on the feature count is a strong correctness signal —
and a cheap way to detect a truncated download.

> **Note the detail:** the County's `DISTRICT` is a *number*; the City's `District` is also
> numeric, but its `NAME` field holds the **councilmember's name**, not a district label. Do
> not use `NAME` as a stable code — use `District`. This is exactly the kind of thing that
> silently produces garbage keys.

---

## 2. LA County Supervisorial Districts — CURRENT

| | |
|---|---|
| Layer | `Supervisorial District (Current)` (id **27**) |
| CRS | EPSG:**2229** (CA State Plane V, **feet**) |
| Features | **5** (verified) |
| Max record count | 1000 |

The service retains a full historical series — **the pattern to copy**:

| Layer id | Name | Verdict |
|---|---|---|
| 27 | Supervisorial District (Current) | **CURRENT** |
| 26 | Supervisorial District (2021) | previous cycle, kept |
| 1 | Supervisorial District (2011) | historical |
| 8 | Supervisorial Districts (2001) | historical |
| 14 | Supervisorial Districts (1991) | historical |
| 15 | Supervisorial Districts (1981) | historical |
| 16 | Supervisorial Districts (1971) | historical |

**Load id 27, not 26.** The names make the choice unambiguous.

---

## 3. Service Planning Areas (SPAs) — CURRENT

| | |
|---|---|
| Layer | `Service Planning Areas (2022)` |
| Service | `services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Service_Planning_Areas_2022_view/FeatureServer/4` |
| CRS | EPSG:**2229** |
| Features | **8** (verified) |
| Last edit | **2026-08-31** (verified — actively maintained this year) |
| Max record count | 2000 |

This is the most recently-touched of the three headline layers, and the 2022 vintage is the
current one. There is no 2023+ SPA release.

---

## 4. HUD Continuum of Care — CURRENT (but check the vintage caveat)

| | |
|---|---|
| Layer | `Continuum_of_Care_Grantee_Areas` |
| Service | `services1.arcgis.com/4yjifSiIG17X0gW4/arcgis/rest/services/Continuum_of_Care_Grantee_Areas_from_HUD/FeatureServer/0` |
| CRS | EPSG:**3857** |
| Features | **396** (national) |
| Last edit | **2022-04-14** |

**Caveat:** the geometry has not been edited since 2022, but CoC *boundaries* are stable —
HUD's annual changes are to funding allocations, not to the grantee area polygons. This layer
is the right one; do not read "2022" as "abandoned". LA is **four** CoCs, verified by
attribute query: `CA-600` (LA City & County), `CA-606` (Long Beach), `CA-607` (Pasadena),
`CA-612` (Glendale).

---

## 5. Other current layers confirmed reachable

All 15 probed endpoints responded. The LA County `Political_Boundaries` service additionally
exposes current-cycle layers for every elected geography:

| Layer id | Name |
|---|---|
| 29 | Congressional District (2021) |
| 30 | State Assembly District (2021) |
| 31 | State Senate District (2021) |
| 32 | Board of Equalization (2021) |
| 33 | LA City Council Districts (2021) |
| 19 | City Boundaries |
| 23 | Community Boundaries (CSA) |
| 25 | School Districts |

The LA City `Boundaries` service exposes 29 layers including `Community Plan Areas` (9),
`Neighborhood Councils (Certified)` (18), `Zip Codes (LA County)` (26), `Assembly Districts`
(2), `Congressional Districts` (10) and `State Senate Districts` (23).

---

## 6. What to watch

- **Do not pick a layer by id alone.** The LA County service mixes 1971–2021 vintages in one
  layer list. Always resolve by the `(Current)` / `(2021)` / `(2022)` suffix in the name.
- **Age is not exposed uniformly.** LA City layers carry no `lastEditDate`/`dateUpdated` in
  their metadata, so recency has to come from the DBF header or the published item page. LA
  County and the AGOL-hosted layers do expose edit dates.
- **Many catalog URLs are written service-root-relative** in
  [la-geodata-sources.md](la-geodata-sources.md) (a bare host plus the service path, with the
  layer id named in prose), so an automated sweep finds fewer endpoints than the prose
  describes. Treat the doc as the inventory and this file as the currency verdict.
- **Re-run this audit before each import.** The check is cheap and read-only; the failure mode
  it prevents (loading a 2012 district set) is silent.

---

## Reproduce

```bash
# which vintages does a publisher actually serve?
curl -s "https://public.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/FeatureServer?f=pjson" \
  | python3 -c "import json,sys; [print(l['id'], l['name']) for l in json.load(sys.stdin)['layers']]"

# real feature count
curl -s -G ".../FeatureServer/27/query" \
  --data-urlencode "where=1=1" --data-urlencode "returnCountOnly=true" --data-urlencode "f=json"

# real CRS (never trust the portal page)
curl -s ".../FeatureServer/27?f=pjson" | python3 -c "import json,sys; print(json.load(sys.stdin)['extent']['spatialReference'])"
```
