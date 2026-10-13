# LA-Area Geospatial Data Source Catalog — for BetterAngels (PostGIS ingest)

**Compiled:** 2026-10-13 (UTC). All URLs below were probed by HTTP request on that date. Catalog contents (dataset counts, vintages, layer IDs) were read directly from the publishers' machine-readable catalogs, not from documentation pages.

**Verification legend**

| Mark | Meaning |
|---|---|
| ✅ | HTTP 200 **and** service/layer metadata parsed directly (`?f=pjson` / `?f=json` / catalog feed). Layer ID, geometry type and CRS below are read from the live service. |
| 🟡 | URL resolves (HTTP 200) but it is a landing page/app, or metadata was not parsed. |
| ❌ | Did not resolve, or was actively blocked, on 2026-10-13. Reported because knowing a source is dead matters as much as knowing it is live. |

**Two structural facts that shape everything below**

1. **There are three LA-area ArcGIS server estates, and they are not mirrors of each other.** [public.gis.lacounty.gov](https://public.gis.lacounty.gov/arcgis/rest/services?f=pjson) (LA County eGIS, current), [arcgis.gis.lacounty.gov](https://arcgis.gis.lacounty.gov) (older LA County host, still serving some layers), and [maps.lacity.org/lahub](https://maps.lacity.org/lahub/rest/services?f=pjson) (City of LA). Many LA County layers appear in *both* the county servers and as hosted copies in the county's ArcGIS Online org (`RmCCgQtiZLDCtblq`). Hosted copies and the on-prem layers frequently have **different CRS** (see §6).
2. **LA's native working CRS is EPSG:2229 (NAD83 / California State Plane Zone V, US survey feet)** — not 4326. The majority of LA County and LA City hosted feature layers report `latestWkid: 2229`. Several agencies publish in **EPSG:3310** (NAD83 / California Albers, meters) and **EPSG:3857**. Ingest code must reproject explicitly; PostGIS will not infer this from GeoJSON (see §6).

---

## 0. Highest-value starting set (if you only wire up a dozen things)

| Need | Use this | Why |
|---|---|---|
| LA City council districts | `maps.lacity.org/lahub/rest/services/Boundaries/MapServer/13` | Authoritative city layer, **live WFS also available** (§1.1) |
| LA County supervisorial districts | `public.gis.lacounty.gov/.../Political_Boundaries/FeatureServer/27` | County authoritative, "Current" layer |
| LA City Planning communities | `services5.arcgis.com/7nsPwEMP38bSkCjy/.../Community_Plan_Areas/FeatureServer/0` | 35 CPAs, City Planning copyright |
| LA Times neighborhoods | `services5.arcgis.com/7nsPwEMP38bSkCjy/.../LA_Times_Neighborhoods/FeatureServer/0` | The de-facto "LA neighborhood" boundary set |
| Census tracts / block groups | TIGER/Line state files + TIGERweb | Federal, public domain, no license friction |
| ZCTAs | TIGER/Line `ZCTA520` + TIGERweb layer 1 | Federal; better licensing than any local ZIP layer |
| Service Planning Areas (SPA) | `services.arcgis.com/RmCCgQtiZLDCtblq/.../Service_Planning_Areas_2022_view/FeatureServer/4` | 2022 SPA, DPH-maintained |
| HUD Continuum of Care (CA-600) | `services1.arcgis.com/4yjifSiIG17X0gW4/.../Continuum_of_Care_Grantee_Areas_from_HUD/FeatureServer/0` | HUD-owned source of truth |
| Shelters / services points | `public.gis.lacounty.gov/.../LMS_Data_Public/MapServer/158` | Sourced from 211 LA; richest single point layer |
| Food / meal sites | `.../LMS_Data_Public/MapServer/156` + `Food_Distribution_chp/FeatureServer/0` | County LMS + DPH indicator |
| Libraries, parks | `Public_Library/FeatureServer/2`, `DPR_Parks_as_Points.../FeatureServer/0` | County points and building footprints |
| Transit stops | LA Metro GTFS (`gitlab.com/LACMTA/gtfs_bus`) | Only authoritative, current Metro source |
| Disadvantage overlays | CalEnviroScreen 4.0/5.0 on `gis.data.ca.gov` | GeoPackage downloads available |

---

## 1. Administrative boundaries

### 1.1 City of Los Angeles — Council Districts

| | |
|---|---|
| **Owner** | City of Los Angeles (Bureau of Engineering / LA GeoHub) |
| **Endpoints** | ✅ `https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/13` — layer `Council Districts` (polygon) |
| | ✅ **WFS 2.0.0 (verified working):** `https://maps.lacity.org/lahub/services/Boundaries/MapServer/WFSServer` — feature type `BoundariesPro:Council_Districts` (namespace prefix is `BoundariesPro`, *not* `Boundaries`). 30 feature types published; GML 3.2 output. |
| | ✅ Hub download API: `https://geohub.lacity.org/api/download/v1/items/76104f230e384f38871eb3c4782f903d/shapefile?layers=13` → `LA_City_Council_Districts_(Adopted_2021).zip`; `.../geojson?layers=13` → `Council_Districts.geojson` |
| | ✅ Hosted AGOL copy (different CRS): `https://services1.arcgis.com/X1hcdGx5Fxqn4d0j/arcgis/rest/services/CouncilDistricts/FeatureServer` |
| **Formats** | ArcGIS REST (MapServer + FeatureServer), **WFS**, KML, shapefile .zip, GeoJSON, CSV, GeoPackage/FileGDB *(per-item — see §5.1)* |
| **Coverage / vintage** | City of LA; "Adopted 2021" redistricting. Previous districts (2012 at layer 28, 2003 at layer 14) also retained — useful for historical joins. |
| **License** | AGOL copy states `For General use.` LA GeoHub items generally carry the City's open-data terms; **no explicit CC0/PD mark on the boundary layers** — attribute "City of Los Angeles". |
| **CRS** | MapServer service: **EPSG:3857**. Hub-hosted item + AGOL copy: **EPSG:3310** (NAD83 / California Albers). |
| **Caveats** | The MapServer advertises `KmlServer, WFSServer, WMSServer` — a genuinely rare capability here and the cleanest programmatic path. The two copies are **not the same projection**, so do not assume equivalence when reconciling. |

### 1.2 LA County Supervisorial Districts

| | |
|---|---|
| **Owner** | County of Los Angeles, Registrar-Recorder/County Clerk (published via LA County eGIS) |
| **Endpoints** | ✅ `https://public.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/FeatureServer/27` — `Supervisorial District (Current)` |
| | ✅ `/FeatureServer/26` — `Supervisorial District (2021)`; `/FeatureServer/1` — 2011; `/FeatureServer/8` — 2001; `/FeatureServer/14` — 1991 |
| | ✅ `https://public.gis.lacounty.gov/arcgis/rest/services/DRP/GISNET_Public/MapServer/315` — `Supervisorial District` (also `431` = 2011) |
| | 🟡 Redistricting source page: [redistricting.lacounty.gov/mapping-files-data-download](https://redistricting.lacounty.gov/mapping-files-data-download/) |
| **Formats** | ArcGIS REST (FeatureServer + MapServer), hub downloads (shapefile/GeoJSON/CSV/KML/FileGDB/GeoPackage per item) |
| **Coverage / vintage** | Countywide; 2021 lines current, all historic decades retained in the same service |
| **License** | LA County eGIS Terms of Use — see [egis-lacounty.hub.arcgis.com/pages/terms-of-use](https://egis-lacounty.hub.arcgis.com/pages/terms-of-use). **Not public domain.** Informational-only, no warranty, County reserves right to discontinue. `copyrightText`: "LA County Registrar/Recorder". |
| **CRS** | **EPSG:2229** (`wkid: 102645`, units `esriFeet`) — confirmed from the service's `spatialReference` |
| **Caveats** | The FeatureServer allows `Query,Create,Update,Uploads,Editing` capability flags, but public access is read-only in practice. `maxRecordCount: 1000` — for 5 polygons that is fine; for the precinct layers it is not. |

### 1.3 LA County / City boundaries, and Cities & Communities (Statistical Areas)

| | |
|---|---|
| **Owner** | LA County eGIS (Cities & Communities/CSA is board-approved, maintained with each Board office) |
| **Endpoints** | ✅ Cities & Communities (CSA): `https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/23` (also `FeatureServer/23`) |
| | ✅ `.../Political_Boundaries/FeatureServer/19` — `City Boundaries`; `/FeatureServer/21` — `City Annexations` |
| | ✅ LA County boundary (EOC GIS, un-merged into mainland/island): `https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/LA_County_Boundary/FeatureServer` |
| | ✅ LA City boundary: `.../Boundaries/MapServer/7` (City Boundary), `/15` (County Boundary), `/1` (Adjacent Cities) |
| | ✅ Statewide county boundaries: `https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/California_County_Boundaries_and_Identifiers_with_Coastal_Buffers/FeatureServer/1` |
| **Formats** | ArcGIS REST; shapefile/GeoJSON/CSV via hub download API; FileGDB + **GeoPackage** available on the statewide county layer |
| **Coverage / vintage** | Countywide. CSA is updated frequently — the AGOL description documents updates through **2026-08** (La Verne, Calabasas, Hidden Hills annexations). City Boundaries include `FEAT_TYPE` ∈ {land, water, breakwater, pier}. |
| **License** | LA County eGIS Terms of Use (non-PD, informational). Statewide layer: CAL FIRE FRAP, "no restrictions on distribution… cite CAL FIRE as original source" — the most permissive of this group. |
| **CRS** | EPSG:2229 for county layers; statewide CAL FIRE layer reports `102100` (EPSG:3857) |
| **Caveats** | CSA polygons include water/pier features — **filter `FEAT_TYPE='land'`** or your area calculations will be wrong. CSA names use conventions like `Westfield/Academy Hills` and parenthetical aliases; normalise before use as a join key. |

### 1.4 Census tracts & block groups

| | |
|---|---|
| **Owner** | U.S. Census Bureau (federal) |
| **Endpoints** | ✅ LA County restatement: `https://public.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Demographics/MapServer/14` (2020 tracts), `/5` (2000), `/9` (1990) |
| | ✅ `https://public.gis.lacounty.gov/arcgis/rest/services/DRP/GISNET_Public/MapServer/429` (2020 tract), `/327` (2010 tract) |
| | ✅ Hosted 2010: `https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/CT_2010_gdb/FeatureServer/0` |
| | ✅ **TIGERweb (authoritative):** `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2020/MapServer/6` (Census Tracts), `/8` (Block Groups), `/10` (Census Blocks) |
| | ✅ TIGERweb current blocks: `.../TIGERweb/tigerWMS_CurrentBlocks/MapServer` |
| **Formats** | ArcGIS REST (MapServer/FeatureServer); **TIGER/Line shapefiles** (§4.1); Cartographic Boundary Files |
| **Coverage / vintage** | 2020 census geography current; 1990/2000/2010 retained at LA County |
| **License** | TIGER/Line and TIGERweb: **U.S. public domain / no copyright** — the cleanest licensing of any source in this catalog |
| **CRS** | TIGER/Line and TIGERweb native **EPSG:4269 (NAD83 geographic)**; LA County's own tract layers are EPSG:2229 or 3857 depending on the service |
| **Caveats** | LA County also publishes **"split tract"** layers (tracts split by CSA/city, one per year 2010→2026, e.g. `2026_Split_Tract/FeatureServer/1`). These are *not* Census tracts — they are county reporting units with their own IDs. Do not join them to Census data by GEOID without checking. |

### 1.5 ZIP Code Tabulation Areas (ZCTAs) and ZIP codes

> **These are two different things and mixing them is the most common LA data error.** ZCTAs are Census statistical areas (tracts assigned to a ZIP); "ZIP codes" are USPS delivery routes. LA-area agency layers labelled "Zip Codes" are usually the latter, sometimes parcel-accurate.

| | |
|---|---|
| **Owner** | ZCTAs: U.S. Census Bureau. ZIP areas: LA County (parcel-accurate) / LA City |
| **Endpoints** | ✅ **ZCTA (Census, 2020):** `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/1` (layer `2020 Census ZIP Code Tabulation Areas`) |
| | ✅ ZCTA shapefile (national, ~500 MB): `https://www2.census.gov/geo/tiger/TIGER2024/ZCTA520/tl_2024_us_zcta520.zip` (verified resolvable, `application/zip`) |
| | ✅ **LA County ZIP Code Boundaries (Parcel Accurate):** `https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/5` |
| | ✅ LA County ZIP Codes (hosted): `https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/LA_County_ZIP_Codes_Hosted/FeatureServer/0` |
| | ✅ City of LA ZIP Codes: `https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/City_of_Los_Angeles_Zip_Codes/FeatureServer/0` |
| | ✅ LA City Boundaries MapServer `/26` (`Zip Codes (LA County)`) and `/27` (`Zip Codes (Thomas Bros. Maps)`) — the Thomas Bros. set is a legacy commercial-derived boundary, avoid it |
| | 🟡 `data.lacity.org` dataset `hfdw-5uq2` "Zip Codes within the City of Los Angeles" — tabular, field `zcta5ce10`, **CC0 1.0**, but last updated 2021 |
| **Formats** | ArcGIS REST; TIGER/Line shapefile (ZCTA); Socrata JSON/CSV/GeoJSON for `data.lacity.org` |
| **License** | ZCTA: public domain. County/City ZIP layers: LA County / City terms (attribution, non-PD). |
| **CRS** | TIGER: EPSG:4269. County ZIP layer: EPSG:2229 (service-level). |
| **Caveats** | ZCTA shapefiles are published **nationally**, never per-state — you must clip to LA County. Some ZIP codes have **no ZCTA** (P.O. box-only ZIPs) and ZCTAs cross county lines. ZCTAs are revised only with each decennial census, so they lag USPS reality by up to a decade. |

### 1.6 Neighborhoods & communities

| Source | Endpoint | Notes |
|---|---|---|
| **LA Times "Mapping L.A." neighborhood boundaries** | ✅ `https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LA_Times_Neighborhoods/FeatureServer/0` — service layer name `LA_City_Neighborhoods_UpdatedPROJECT` | Polygon, **EPSG:2229**, `capabilities: Query` only (no Extract ⇒ no server-side shapefile export). Hub page: [geohub.lacity.org/datasets/lahub::la-times-neighborhood-boundaries](https://geohub.lacity.org/datasets/lahub::la-times-neighborhood-boundaries) |
| **LA Times Mapping L.A. API** | ❌ `http://projects.latimes.com/mapping-la/api/` returned **HTTP 403** | The historic KML/KMZ/GeoJSON boundaries API. A Python wrapper exists ([datadesk/latimes-mappingla-api](https://github.com/datadesk/latimes-mappingla-api)) but the upstream API is bot-blocked and **likely retired**. **Prefer the FeatureServer above**; treat the Mapping L.A. API as unavailable unless retested from a browser. |
| **LA City Planning Community Plan Areas (CPAs)** | ✅ `https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Community_Plan_Areas/FeatureServer/0` | 35 CPAs. `copyrightText: City of Los Angeles, Department of City Planning`. EPSG:2229, `maxRecordCount: 2000`, `capabilities: Query,Extract`. Also `.../Boundaries/MapServer/9`, and WFS as `BoundariesPro:Community_Plan_Areas` |
| **CPA alt. hosted** | ✅ `https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/CPA/FeatureServer/0` | Short-name variant; verify it matches the above before using both |
| **LA County Cities & Communities (CSA)** | ✅ `Political_Boundaries/MapServer/23` | Covers *unincorporated* areas + city names; **not a general neighborhood layer for the City of LA** |
| **Neighborhood Councils (Certified)** | ✅ `.../Boundaries/MapServer/18`; hosted `https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Neighborhood_Council_Boundaries_(2018)/FeatureServer/0` | 99+ certified NCs; **stale (2018)** and boundaries change with certifications — check for a newer vintage |
| **Neighborhood Service Areas** | ✅ `.../Boundaries/MapServer/19` | City administrative unit |
| **LA County Community Standards Districts / Planning Areas** | ✅ `https://public.gis.lacounty.gov/arcgis/rest/services/DRP/Open_Data/MapServer/4` (CSD), `/31` (Planning Areas), `/5` (CSD subareas) | Unincorporated county only |
| **LA County Town Council / Community Group** | ✅ `https://public.gis.lacounty.gov/arcgis/rest/services/DRP/GISNET_Public/MapServer/381` | Informal, unincorporated areas |

**Caveat — which "neighborhood" definition to use.** There is no authoritative City of LA neighborhood boundary. Three competing sets in active use: **LA Times Mapping L.A.** (~114 neighborhoods, widely used in journalism/nonprofit work), **LA City Planning Community Plan Areas** (35, legally meaningful for land use, coarser), and **Neighborhood Councils** (99+, politically meaningful, unequal in size, stale). Do not blend them; pick one and store the source in a column.

---

## 2. Service-relevant geographies

### 2.1 LA County Service Planning Areas (SPAs)

| | |
|---|---|
| **Owner** | LA County Department of Public Health (DPH) — the SPA geography is countywide and used by multiple departments |
| **Endpoints** | ✅ `https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Service_Planning_Areas_2022_view/FeatureServer/4` — `Service Planning Areas (2022)`, **EPSG:2229**, `maxRecordCount: 2000`, `capabilities: Query,Extract` |
| | ✅ `https://public.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/23` — same 2022 SPA (service CRS **EPSG:3857**); `/4` = SPA 2012 |
| | ✅ `https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/DPH_Service_Planning_Areas_SPA/FeatureServer/17` — DPH-branded copy |
| | ✅ `.../arcgis/rest/services/Service_Planning_Areas_(SPAs)/FeatureServer/1` |
| **Formats** | ArcGIS REST; shapefile/GeoJSON/CSV/FileGDB/GeoPackage via hub download API (per item) |
| **Coverage / vintage** | Countywide, **8 SPAs**. 2022 version is current; 2012 retained. `copyrightText` credits DPH with Census Bureau / ISD / Registrar-Recorder / DPW as contributors. |
| **License** | LA County eGIS Terms of Use — attribution to DPH, informational only, non-PD |
| **CRS** | EPSG:2229 (hosted) vs EPSG:3857 (on-prem MapServer) — **the same geography in two different projections** |
| **Caveats** | SPAs nest within the county and do not respect city boundaries. Note there are **two different "service area" systems in LA County**: DPH/Public Health SPAs (8) and DMH Service Areas (8, similar but not identical) — see 2.2. |

### 2.2 LA County Department of Mental Health (LACDMH) Service Areas

| | |
|---|---|
| **Owner** | LA County Department of Mental Health (LACDMH) |
| **Endpoints** | 🟡 Program page: [dmh.lacounty.gov/geospatial-initiative](https://dmh.lacounty.gov/geospatial-initiative/) — published 2026-10-13; links web maps/apps only |
| | 🟡 Service Area & Supervisory District Boundary Viewer: `https://lacdmh.maps.arcgis.com/apps/webappviewer/index.html?id=8f284198edd44c37a88dcc93b19854f1` |
| | 🟡 LACDMH Provider Locator: `https://dmh.lacounty.gov/pd/` |
| | ✅ **Mental Health Centers (points):** `https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/LMS_Data_Public/MapServer/84` |
| | ✅ **Medical Service Study Areas (MSSA)** — the state geography LACDMH activity maps are built on: `https://services5.arcgis.com/fMBfBrOnc6OOzh7V/arcgis/rest/services/Medical_Service_Study_Areas_/FeatureServer/0` (**EPSG:3857**), plus shapefile/GeoJSON via `https://gis.data.ca.gov/datasets/hcai::medical-service-study-areas` |
| **Formats** | ❌ **No downloadable DMH Service Area polygon layer was found.** DMH's own `lacdmh.maps.arcgis.com` org returned **0 public items** to an anonymous search. Data dictionary + MSSA shapefile exist for the state MSSA geography. |
| **Coverage / vintage** | DMH service areas documented at [dmh.lacounty.gov/about/service-areas](https://dmh.lacounty.gov/about/service-areas/); vintage unclear |
| **License** | Unresolved — no license was published with a DMH service-area layer because no such layer was found |
| **CRS** | n/a for DMH; MSSA is EPSG:3857 |
| **Caveats / action** | ⚠ **Flagged as unverified.** The DMH Service Area boundary geometry appears to be **published only inside ArcGIS web app items**, not as a public feature layer. To obtain polygons you must either (a) extract the layer from the web app's underlying item via the ArcGIS item data API, (b) email LACDMH GIS for the file, or (c) **substitute SPAs** — DMH service areas are widely treated as coterminous with the 8 SPAs for service planning, but confirm this with DMH before assuming it. |

### 2.3 Health Districts (DPH)

| | |
|---|---|
| **Owner** | LA County Department of Public Health |
| **Endpoints** | ✅ `.../Administrative_Boundaries/MapServer/22` — `Health Districts (2022)`; `/3` — `Health Districts (2012)` |
| | ✅ `https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Health_Districts_2022_view/FeatureServer/0` |
| **Formats / License / CRS** | Same estate as SPA (county eGIS terms; 2229 or 3857 depending on host) |
| **Caveats** | Health Districts are a **sub-SPA** geography. Useful for finer-grained clinic catchments; confirm nesting with SPA before overlaying. |

### 2.4 HUD Continuum of Care (CoC) boundaries

| | |
|---|---|
| **Owner** | U.S. Department of Housing and Urban Development |
| **Endpoints** | ✅ `https://services1.arcgis.com/4yjifSiIG17X0gW4/arcgis/rest/services/Continuum_of_Care_Grantee_Areas_from_HUD/FeatureServer/0` — **EPSG:3857**, `maxRecordCount: 2000`, `capabilities: Query`, `geometryType: esriGeometryPolygon` |
| | ✅ HUD alt. copy: `https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Continuum_of_Care_Grantee_Areas/FeatureServer/0` — `copyrightText: U.S. Department of Housing and Urban Development`, `Query,Extract`, EPSG:3857 |
| | ✅ HUD GIS portal: [hudgis-hud.opendata.arcgis.com](https://hudgis-hud.opendata.arcgis.com/) (HTTP 200) |
| **Formats** | ArcGIS REST (FeatureServer, MapServer). Attribute fields: `COCNAME`, `STUSAB`, `COCNUM`, `STATE_NAME`, plus HUD `PPRN` and many `ES_*` emergency-shelter capacity fields. |
| **Coverage / vintage** | National; one polygon per CoC |
| **LA-relevant CoCs — verified by direct attribute query** | **`CA-600` Los Angeles City & County CoC** (the main one), `CA-606` Long Beach CoC, `CA-607` Pasadena CoC, `CA-612` Glendale CoC. **Four separate CoCs overlap LA County** — this is a real trap: LA County is *not* one CoC. |
| **License** | U.S. federal data, HUD-published. Public domain in practice; HUD asks for standard federal attribution. |
| **CRS** | EPSG:3857 (both copies) |
| **Caveats** | ⚠ **The HUD Exchange CoC GIS Tools landing page is dead.** `https://www.hudexchange.info/programs/coc/gis-tools/` → **404**, and so are `https://www.hudexchange.info/programs/coc/`, `/programs/coc`, and `/resource/4847/continuum-of-care-coc-boundaries/` (all checked 2026-10-13). Use the FeatureServer directly; the HUD-published shapefile download path is no longer discoverable from HUD's own site. |

### 2.5 School districts

| Source | Endpoint | Formats / notes |
|---|---|---|
| **LA County — School Districts** | ✅ `https://public.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/FeatureServer/25` | Polygon; EPSG:2229; countywide, all districts |
| **LA County — School District Boundaries** | ✅ `.../LACounty_Dynamic/Administrative_Boundaries/MapServer/0` | Polygon; EPSG:3857 (service) |
| **LA County — Registrar-Recorder** | ✅ `https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/School_District/FeatureServer/0` and `.../School_Districts_Trustee_Areas/FeatureServer/0` | Trustee areas = elected sub-districts; useful for advocacy targeting |
| **School District Headquarters (points)** | ✅ `.../LMS_Data_Public/MapServer/52` | Point layer |
| **LAUSD — schools & campuses** | ✅ `https://maps.lacity.org/lahub/rest/services/LAUSD_Schools/MapServer/0` (Schools), `/2` (School Campuses) | LA City server; EPSG:3857 |
| **LAUSD — attendance boundaries** | ✅ `.../LAUSD_Schools/MapServer/4` (Elementary), `/5` (Middle), `/6` (High) | The only attendance-area polygons in this catalog. `.../MapServer/7` = Board of Education Districts, `/8` = Local Districts |
| **LAUSD — boundary key codes** | ✅ `https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LAUSD_Attendance_Boundary_Key_Codes_(Elementary_Schools)/FeatureServer/0` (+ Middle, High variants) | Lookup tables; join to the boundary layers |
| **California CDE — School District Areas 2025-26** | ✅ `https://services3.arcgis.com/fdvHcZVgB2QSRNkL/arcgis/rest/services/DistrictAreas2526/FeatureServer/0` (**EPSG:3857**); hub page [gis.data.ca.gov/datasets/CDEGIS::california-school-district-areas-2025-26](https://gis.data.ca.gov/datasets/CDEGIS::california-school-district-areas-2025-26) | **Best licensing + best format range**: shapefile, GeoJSON, CSV, **FileGDB, GeoPackage**. Statewide, annual vintages (2023-24, 2024-25, 2025-26 all downloadable) |
| **California CDE — District Offices 2025-26** | ✅ `https://services3.arcgis.com/fdvHcZVgB2QSRNkL/arcgis/rest/services/DistrictSites2526/FeatureServer/0` | Points |
| **Census TIGERweb — school districts** | ✅ `.../tigerWMS_Census2020/MapServer/12` (Unified), `/14` (Secondary), `/16` (Elementary) | Federal, public domain; deprecated by Census in favour of CDE for CA |
| **Census TIGER/Line — school district shapefiles** | ✅ `https://www2.census.gov/geo/tiger/TIGER2024/ELSD/tl_2024_06_elsd.zip`, `.../UNSD/tl_2024_06_unsd.zip` | EPSG:4269; verified resolvable |

**Caveat.** LAUSD attendance boundaries are **not** school district boundaries — a campus's attendance area is a fraction of the district. Also, many LA County students attend districts other than LAUSD (e.g. a single address can fall in an elementary district that feeds a different high school district). If "school district" matters for eligibility, use `UNSD`/`ELSD`/`SCSD` separately rather than a single "school district" polygon.

### 2.6 Police / law enforcement divisions

| Source | Endpoint | Notes |
|---|---|---|
| **LAPD Divisions** | ✅ `https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LAPD_Division/FeatureServer/0` | Polygon, **EPSG:2229**, `Query,Extract`. The 21 geographic divisions. |
| **LAPD Bureaus** | ✅ `.../LAPD_Bureaus/FeatureServer/0` | Polygon; 4 bureaus (groups of divisions) |
| **LAPD Police Stations** | ✅ `.../LAPD_Police_Stations/FeatureServer/0` | Points |
| **LASD Station Boundaries** | ✅ `.../Administrative_Boundaries/MapServer/9`; Reporting Districts at `/8` | County sheriff; **LASD jurisdiction ≠ county area** (contract cities + unincorporated) |
| **LASD RD** | ✅ `https://public.gis.lacounty.gov/arcgis/rest/services/Sheriff/RD/MapServer` | Sheriff reporting district service |
| **Sheriff & Police Stations (all agencies)** | ✅ `.../LMS_Data_Public/MapServer/146` | Points, countywide, all agencies |
| **Fire station boundaries / PSAP** | ✅ `.../Administrative_Boundaries/MapServer/19` (County Fire station boundaries), `/20` (PSAP boundaries) | Relevant if you do 911/emergency-response analysis |

**Caveat.** LAPD divisions cover the **City of LA only**. Outside city limits, policing is by LASD or by municipal police (Santa Monica, Long Beach, Pasadena, Glendale, Burbank, etc.) — there is no single LA County "police division" layer. For countywide coverage, combine `Station Boundaries` (LASD) with `Sheriff & Police Stations` (points).

### 2.7 Other administrative/service geographies worth knowing

| Geography | Endpoint | Why it matters |
|---|---|---|
| **DPSS Service Areas** | ✅ `https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/DPSS_Service_Areas/FeatureServer/21` | Public benefits offices (CalWORKs, CalFresh, General Relief) |
| **DPSS zip code service areas** | ✅ `.../dcfs_zip_code_service_areas/FeatureServer/0` | ZIP-based lookup |
| **DCFS Service Areas / Office Boundaries** | ✅ `.../DCFS_SERVICE_AREAS/FeatureServer/0`; `.../Administrative_Boundaries/MapServer/2` | Child welfare; overlaps with high-need populations |
| **Regional Centers (2014)** | ✅ `.../Administrative_Boundaries/MapServer/6` | Developmental-disability services; **stale** |
| **LA County Library Service Areas / Planning Areas** | ✅ `.../Administrative_Boundaries/MapServer/12` (service areas), `/11` (planning areas) | Library catchments |
| **Medical Service Study Areas (MSSA)** | ✅ `https://services5.arcgis.com/fMBfBrOnc6OOzh7V/arcgis/rest/services/Medical_Service_Study_Areas_/FeatureServer/0` | State health-planning geography used by LACDMH and HCAI |
| **Health Professional Shortage Areas** | ✅ `https://gisportal.hrsa.gov/server/rest/services/Shortage/HealthProfessionalShortageAreas_FS/MapServer` — layer **4 = Mental Health HPSA**, 8 = Primary Care, 0 = Dental | Federal designation; useful for siting/eligibility |
| **Medically Underserved Areas/Populations** | ✅ `https://gisportal.hrsa.gov/server/rest/services/Shortage/MedicallyUnderservedAreas_FS/MapServer/0` | Federal MUA/MUP |
| **Congressional / Assembly / Senate / BoE districts (2021)** | ✅ `.../Political_Boundaries/FeatureServer/29,30,31,32` | One service, four legislative layers |
| **State legislative (statewide, current)** | ✅ `https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/CA_State_Senate_Districts_and_Membership/FeatureServer/0`; Assembly `.../CA_State_Assembly_Districts_and_Memberships_2024_to_2026/FeatureServer/5` | With membership data; FileGDB/GeoPackage on some items |
| **Voting precincts** | ✅ `.../Political_Boundaries/FeatureServer/34` (Registrar-Recorder Precincts), `/37` (Election Precincts); LA City variants at `.../Boundaries/MapServer` | Very high feature count — respect `maxRecordCount` |

---

## 3. Point-of-interest / resource datasets

### 3.1 Homeless services, shelters & encampments

| Source | Endpoint | Detail |
|---|---|---|
| **LA County LMS — "Homeless Shelters and Services"** ⭐ | ✅ `https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/LMS_Data_Public/MapServer/158` | **Point**, `Map,Query,Data`, `maxRecordCount: 1000`. **Field list (verbatim):** `source, ext_id, cat1, cat2, cat3, org_name, name, addrln1, addrln2, city, state, hours, phones, email, url, info1, info2, post_id, description, zip, link, use_type, latitude, longitude, date_updated, dis_status, POINT_X, POINT_Y, allcats, nameUrlFriendly, isCounty, tags`. `source` = **`211`** (211 LA). Verified sample rows include mental-health counselling and shelter providers. |
| **LA County LMS — "Food Assistance"** | ✅ `.../LMS_Data_Public/MapServer/156` | Point; same LMS schema as above |
| **Charitable Food Distribution Sites** | ✅ `https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Food_Distribution_chp/FeatureServer/0` | Point, **EPSG:2229**, `maxRecordCount: 2000`. `copyrightText` credits **211 LA Food Resources** via LA County DPH. Filter to `type='food distribution/pantries'`. |
| **Persons Experiencing Homelessness** | ✅ `.../arcgis/rest/services/Persons_Experiencing_Homelessness/FeatureServer/0` | Small-area estimate/count layer |
| **Homeless Counts 2020** | ✅ `.../arcgis/rest/services/Homeless_Counts_2020/FeatureServer/0` | Polygon counts |
| **LA City Homeless Count by Council District** | ✅ 2017 `.../Homeless_Count_2017_Results_CD/FeatureServer/0`; 2018 `.../hc2018_resultz/FeatureServer/0`; 2019 `.../Homeless_Count_by_City_Council_District_2019/FeatureServer/0`; countywide 2019 `.../Homeless_Count_Los_Angeles_County_2019/FeatureServer/0` | **Vintages end at 2019–2020.** The 2018 item is the only one of these advertising **FileGDB and GeoPackage** downloads (both verified returning `.zip` / `.gpkg`). |
| **LA County HEARS — Homeless Encampment Operations** | ✅ `.../arcgis/rest/services/LA_County_HEARS_Public_Viewer_Mockup_View/FeatureServer/0` | Unincorporated-area encampment operations. Title contains "Mockup" — confirm stability before depending on it. |
| **Measure A Public Metrics** | ✅ `.../arcgis/rest/services/Measure_A_Public_Metrics/FeatureServer/0` | Measure H/A homelessness funding metrics by area |
| **Cooling/warming centers** | ✅ `.../LMS_Data_Public/MapServer/55` (points); ✅ `https://services7.arcgis.com/DSSF7DFVxfZsz379/arcgis/rest/services/Cooling_Heating_Centers_City_of_Los_Angeles/FeatureServer/0` (**EPSG:4326**); ✅ `.../RmCCgQtiZLDCtblq/arcgis/rest/services/Public_Emergency_Map_Cooling_Center_View/FeatureServer/0` | Three overlapping sets: county LMS, City of LA, and an "augmented" emergency view. Reconcile before use. |
| **LAHSA** | 🟡 Data hub: [lahsa.org/data-refresh](https://www.lahsa.org/data-refresh); count products: [lahsa.org/homeless-count](https://www.lahsa.org/homeless-count) | ❌ **No shapefile, GeoJSON or feature service found.** LAHSA publishes **dashboards (Tableau/embedded), PDFs and Excel only** — Homeless Count, System KPIs, Interim Housing, Street Outreach, Inside Safe, Pathway Home. Point-in-time count summaries are released annually as PDF/data summaries. **If you need LAHSA geography, the LA County LMS layer 158 + HUD CoC polygons are your practical substitutes.** |
| **LAHSA interim housing / shelter bed inventory** | ⚠ Not published as open geodata | Beds-per-project data exists inside the Interim Housing dashboard but is not an open dataset. |

### 3.2 Food, meal sites & basic needs

| Source | Endpoint | Formats / notes |
|---|---|---|
| **Senior Centers & Congregate Meal Sites** ⭐ | ✅ `https://services1.arcgis.com/tp9wqSVX1AitKgjd/arcgis/rest/services/OlderAdultCongregateMealLocations/FeatureServer/0` | Layer `Congregate_Meal_Sites`, point, **EPSG:4326**, `maxRecordCount: 1000`. Note `capabilities` includes `Create,Delete,Update,Editing,Sync` — a writable public layer; **do not write**, but be aware content can change without notice. |
| **Los Angeles Public Food Access Sites** | ✅ `https://services9.arcgis.com/2ynJbr9BE17vXxR8/arcgis/rest/services/Los_Angeles_Public_Food_Access_Sites/FeatureServer/0` | Point, **EPSG:3857**, `maxRecordCount: 2000` |
| **Farmers' Markets (county)** | ✅ `.../RmCCgQtiZLDCtblq/arcgis/rest/services/Farmers_Markets_chp/FeatureServer/0` | Point |
| **Farmers Markets in Los Angeles (city)** | ✅ `https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Farmers_Markets_in_Los_Angeles/FeatureServer/0` | Point |
| **Libraries Summer Lunch 2023 / Parks Summer Lunch 2023** | ✅ `.../Libraries_Summer_Lunch_2023/FeatureServer/0`; ✅ `.../County_of_Los_Angeles_Parks_Summer_Lunch_2023/FeatureServer/0` | **2023 vintage only** — summer meal sites move every year. Treat as a schema template, not a current dataset. |
| **USDA Food Access Research Atlas / Food Deserts** | ✅ LA City restatement `https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/USDA_data_1/FeatureServer/0`; ✅ DPH `.../Food_Deserts/FeatureServer/0` | Tract-level food-access flags |
| **SNAP recipients by census tract** | 🟡 `https://geohub.lacity.org/maps/lahub::snap-recipients-by-census-tract` | Map item; extract underlying layer |
| **LA Regional Food Bank** | 🟡 [lafoodbank.org/find-food](https://www.lafoodbank.org/find-food/) (HTTP 200) | ⚠ **Web locator only — no open data download, no API found.** Scraping is the only route and its ToS has not been reviewed. The DPH `Food_Distribution_chp` layer (which credits 211 LA) is the better substitute. |

### 3.3 Public facilities: libraries, parks, community centres

| Source | Endpoint | Detail |
|---|---|---|
| **LA County Public Library — buildings** ⭐ | ✅ `https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Public_Library/FeatureServer/2` | Layer `LibraryBuildings_2023`, **polygon** (building outline + 10 ft buffer), **EPSG:2229**, `maxRecordCount: 2000`. `copyrightText: Los Angeles County, Assessor, eGIS`. |
| **LA County Public Library Facilities** | ✅ `.../Public_Library_Facilities/FeatureServer/0` | ⚠ **`type: Table` — no geometry.** Verified. Do not expect points here. |
| **LA County Library branch info (Cool Spot map)** | ✅ `https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Library_Branch_Information_For_Cool_Spot_Map/FeatureServer/0` | Points with cooling-centre attributes |
| **LA Public Library (LAPL) branches** | ✅ `data.lacity.org` dataset `a4nt-4gca` — [data.lacity.org/api/views/a4nt-4gca.json](https://data.lacity.org/api/views/a4nt-4gca.json) | **72 branches.** Point field `location`; also `branch_name, phone_number, email, council_district`. **License: Creative Commons 1.0 Universal (Public Domain Dedication)** — the most permissive license in this whole catalog. ⚠ `rowsUpdatedAt` = 2014 ⇒ **stale**. |
| **Library service/planning areas** | ✅ `.../Administrative_Boundaries/MapServer/12` and `/11` | Polygons |
| **LA County Parks — as points** | ✅ `https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/DPR_Parks_as_Points_(Public_-_Hosted_Feb_2023)/FeatureServer/0` | Point, **EPSG:2229**, `maxRecordCount: 2000` |
| **Countywide Parks & Open Space** | ✅ `.../Countywide_Parks_and_Open_Space__(Public_-_Hosted2)/FeatureServer/0` | Polygons; name contains double underscore — URL-encode carefully |
| **DPR Park Facilities (Public)** | ✅ `.../DPR_Park_Facilities_(Public)/FeatureServer/11` | Facilities within parks |
| **DPR Restrooms** ⭐ | ✅ `.../DPR_Park_Building_and_Parking_Lots_(Public_View_Layer_2)/FeatureServer/24` | **Public restroom points** — high value for a street-services app. Also `/23` Building Rooms, `/20` Park Buildings, `/21` Picnic Shelters, `/22` Parking Lots |
| **DPR Park Service Areas / Recreation Districts / Agency Boundaries** | ✅ `/FeatureServer/103`, `/FeatureServer/13`, `/FeatureServer/92` | Administrative polygons |
| **LA County Parks & Open Space (on-prem)** | ✅ `https://public.gis.lacounty.gov/arcgis/rest/services/PARKS/OpenSpace/FeatureServer`; `.../PARKS/Trails/MapServer` | FeatureServer + MapServer; trails |
| **LA City Parks** ⭐ | ✅ `data.lacity.org` dataset `4jt3-efvk` — [data.lacity.org/api/views/4jt3-efvk.json](https://data.lacity.org/api/views/4jt3-efvk.json) | Fields `the_geom, objectid, address, name`. **License: CC0 1.0.** ⚠ **GeoJSON export is in EPSG:2229, not 4326** — see §6.3. Attribution: "Department of Recreation and Parks". |
| **LAPARKS facilities + cooling centres** | ✅ `https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LAPARKS_Recreation_and_Parks_Facilities_and_Cooling_Centers/FeatureServer/0` | Points |
| **Housing & Community Investment service locations** | ✅ `data.lacity.org` dataset `29cn-rph9` | **CC0 1.0**; fields `location_type, facility_title, location_1, phone, hours_open, hours_closed, service_description` |

### 3.4 Transit — LA Metro

| Source | Endpoint | Detail |
|---|---|---|
| **LA Metro GTFS — bus** ⭐ | ✅ `https://gitlab.com/LACMTA/gtfs_bus` — raw: `https://gitlab.com/LACMTA/gtfs_bus/-/raw/master/gtfs_bus.zip` (verified `application/octet-stream`) | GitLab-hosted, version-controlled. Repo contents: `gtfs_bus.zip`, `feed_info.txt`, `README.md`. |
| **LA Metro GTFS — rail** ⭐ | ✅ `https://gitlab.com/LACMTA/gtfs_rail` — raw: `https://gitlab.com/LACMTA/gtfs_rail/-/raw/master/gtfs_rail.zip` | Repo contains the **unzipped** feed too: `agency.txt, calendar.txt, calendar_dates.txt, fare_attributes.txt, fare_rules.txt, feed_info.txt, routes.txt, shapes.txt, stop_times.txt, stops.txt, trips.txt`. `stops.txt` gives you `stop_lat`/`stop_lon` in **WGS84**. |
| **LA Metro developer site** | 🟡 [developer.metro.net](https://developer.metro.net/) (HTTP 200) | ⚠ `https://www.metro.net/about/developers/` → **404** |
| **Metro ArcGIS services** | ✅ but **stale**: e.g. `https://services8.arcgis.com/lsvzsQ5u5k8py5Sx/arcgis/rest/services/JUN20_LACMTA_Bus_Stops_and_the_Bus_Lines_Serving_them/FeatureServer` | Metro's AGOL org has bus-stop/ridership feature services but the newest vintages found are **2019–2021** (`JUN20`, `OCT19`, `SEP21`, `Oct21`). **Do not use as current stop inventory.** |
| **LA City Metro Bus & Rail** | ✅ `https://maps.lacity.org/lahub/rest/services/Metro_Bus_and_Rail/MapServer` | **EPSG:3857**, `supportedExtensions: KmlServer` (no WFS). Layers: `/1` Metro Rail Lines & Stops (point), `/2` Metro Rail Lines (line), `/3` Metro Bus Lines (line), `/9` Metro BRT (line), `/5,/6,/7` Transit Projects, `/8` TCTMC Streets of Significance. **Lines, not stop inventory.** |
| **Other LA County transit agencies** | 🟡 Not individually verified in this pass | LADOT DASH, Big Blue Bus (Santa Monica), Culver CityBus, Long Beach Transit, Pasadena Transit, Metrolink, Access Services, and ~20 more each publish their own GTFS. Aggregate via the Mobility Database / transit.land rather than chasing each agency. |
| **GTFS → PostGIS** | — | Convert `stops.txt` to a point table; `shapes.txt` to LineStrings; `stop_times.txt`/`trips.txt` to feed-frequency metrics. GTFS is **WGS84 / EPSG:4326** by specification. |

**Caveat.** Metro operates rail and most bus service, but **many LA County bus stops belong to other agencies** (LADOT, Big Blue Bus, municipal operators). Metro GTFS alone undercounts transit access countywide.

---

## 4. State and federal sources

### 4.1 U.S. Census — TIGER/Line and TIGERweb

| | |
|---|---|
| **Owner** | U.S. Census Bureau, Geography Division |
| **TIGER/Line shapefiles** | ✅ URL pattern: `https://www2.census.gov/geo/tiger/TIGER{YYYY}/{LAYER}/tl_{YYYY}_{STATE}{LAYER}.zip` |
| | **Verified resolvable (`application/zip`) for CA (FIPS 06), 2024 vintage:** |
| | `.../TIGER2024/TRACT/tl_2024_06_tract.zip` — census tracts |
| | `.../TIGER2024/BG/tl_2024_06_bg.zip` — block groups |
| | `.../TIGER2024/PLACE/tl_2024_06_place.zip` — incorporated places / CDPs |
| | `.../TIGER2024/ELSD/tl_2024_06_elsd.zip` — elementary school districts |
| | `.../TIGER2024/UNSD/tl_2024_06_unsd.zip` — unified school districts |
| | `.../TIGER2024/ZCTA520/tl_2024_us_zcta520.zip` — **ZCTAs, national only** |
| | Directory browsing: `https://www2.census.gov/geo/tiger/TIGER2024/TRACT/` ✅ |
| **TIGERweb REST** | ✅ Root: `https://tigerweb.geo.census.gov/arcgis/rest/services?f=pjson` — folders include `TIGERweb`, `Census2020`, `Generalized_ACS2026`, `Econ`, `Utilities` |
| | ✅ `.../TIGERweb/tigerWMS_Census2020/MapServer` — **verified layer IDs:** `6` Census Tracts, `8` Census Block Groups, `10` Census Blocks, `12` Unified School Districts, `14` Secondary School Districts, `16` Elementary School Districts, `20` County Subdivisions, `26` Incorporated Places, `28` Census Designated Places |
| | ✅ `.../TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer` — **`0` 2020 PUMAs, `1` 2020 ZCTAs** |
| | ✅ `.../TIGERweb/State_County/MapServer`, `.../TIGERweb/Legislative/MapServer`, `.../TIGERweb/Transportation/MapServer`, `.../TIGERweb/tigerWMS_Current/MapServer`, `.../TIGERweb/tigerWMS_CurrentBlocks/MapServer` |
| **Formats** | Shapefile .zip (TIGER/Line); ArcGIS MapServer (TIGERweb, queryable GeoJSON); Cartographic Boundary Files; Census Data API |
| **Coverage / vintage** | Annual TIGER/Line; TIGERweb has Census 2010/2020 and ACS 2012–2026 generalized layers |
| **License** | **Public domain.** TIGER/Line and TIGERweb carry no copyright; the Census Bureau asks for source citation but imposes no restriction. Best-in-class for commercial-friendly reuse. |
| **CRS** | **EPSG:4269 (NAD83 geographic)**, both shapefiles and TIGERweb. Note: this is **NAD83, not WGS84** — for LA the difference is sub-metre, but be explicit. |
| **Caveats** | TIGER/Line shapefiles are **state-scoped for most layers but national for ZCTA and some others** — verify per layer. TIGERweb `maxRecordCount` limits mean block-level queries for LA County (≈100k+ blocks) need `returnIdsOnly` + pagination. TIGER/Line shapefiles use `.prj` (plain text WKT), and the DBF is limited to 10-char field names (not an encoding issue for TIGER since fields are ASCII `GEOID`/`NAME`/`ALAND`/`AWATER`). |

### 4.2 CalEnviroScreen (OEHHA) and CA disadvantaged-community layers

| | |
|---|---|
| **Owner** | California Office of Environmental Health Hazard Assessment (OEHHA), CalEPA |
| **CalEnviroScreen 4.0** ⭐ | ✅ `https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/CalEnviroScreen_4_0_Results_/FeatureServer/0` — polygon, **EPSG:3310 (NAD83 / California Albers, metres)**, `maxRecordCount: 2000`, `Query,Extract` |
| | ✅ Download API: `https://gis.data.ca.gov/api/download/v1/items/b6e0a01c423b489f8d98af641445da28/shapefile?layers=0`, `.../geojson?layers=0`, `.../csv?layers=0`, `.../filegdb?layers=0`, **`.../geoPackage?layers=0`** |
| | 🟡 Hub page: [gis.data.ca.gov/datasets/OEHHA::calenviroscreen-4-0-results-1](https://gis.data.ca.gov/datasets/OEHHA::calenviroscreen-4-0-results-1) |
| **CalEnviroScreen 5.0** ⭐ | ✅ `https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/calenviroscreen50results_F_070126_gdb/FeatureServer/2` — `CalEnviroScreen 5.0 Results`, polygon, **EPSG:3310**, `copyrightText: OEHHA, CalEPA`. Draft version also published: `.../CES5_Draft/FeatureServer/0`. |
| **SB 535 Disadvantaged Communities** | ✅ 2026: `https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/SB_535_Disadvantaged_Communities_2026/FeatureServer/0`; 2022/2023-24: `.../SB535_DACupdate20232024/FeatureServer/1` | The statutory DAC list — often the eligibility flag you actually need |
| **OEHHA direct download (oehha.ca.gov)** | ❌ **Blocked.** `https://oehha.ca.gov/calenviroscreen/download-data` returned HTTP 200 but an **empty body**, and the direct shapefile `.../media/downloads/calenviroscreen/document/calenviroscreen40shpf2021d.zip` returned a 212-byte **Imperva/Incapsula bot-block page** (`<html>…Incapsula_Resource…`), not a ZIP. | 
| **Formats** | ArcGIS REST, shapefile, GeoJSON, CSV, **FileGDB, GeoPackage** (all via `gis.data.ca.gov` download API) |
| **Coverage / vintage** | Statewide, **census-tract** level. CES 4.0 (2021 data) is the long-standing official version; CES 5.0 is now published. |
| **License** | State of California open data; OEHHA attribution expected. Verify the specific item's license field before commercial redistribution. |
| **CRS** | **EPSG:3310** — not 2229, not 3857. Easy to get wrong. |
| **Caveats** | Tract-level only — to get a ZIP- or district-level score you must do an **area-weighted** aggregation, because CES tract scores are not density measures and simple joins will mislead. Use the download API, not `oehha.ca.gov`. |

### 4.3 California state portals

| Source | URL | Detail |
|---|---|---|
| **CA State Geoportal** ⭐ | ✅ [gis.data.ca.gov](https://gis.data.ca.gov/) — DCAT catalog: `https://gis.data.ca.gov/api/feed/dcat-us/1.1.json` (**HTTP 200, 21,234,552 bytes, 3,950 datasets**) | ArcGIS Hub. Download API pattern `https://gis.data.ca.gov/api/download/v1/items/{itemId}/{format}?layers={n}`. **GeoPackage and FileGDB are genuinely available on many items here** (unlike LA City — §5.1). Verified publishers include OEHHA, CDE GIS, HCAI, CAL FIRE, CDTFA, CA Energy Commission, Water Boards, Caltrans. |
| **CA Open Data Portal** | ✅ [data.ca.gov](https://data.ca.gov/) — CKAN: `https://data.ca.gov/api/3/action/package_search?q=...` (**verified returning JSON**) | CKAN API; mostly tabular/statistical, not geospatial. Use for CHHS program data, not boundaries. |
| **CDE GIS — school districts** | ✅ see §2.5 | Annual vintages, shapefile + GeoPackage |
| **HCAI — Medical Service Study Areas** | ✅ `https://services5.arcgis.com/fMBfBrOnc6OOzh7V/arcgis/rest/services/Medical_Service_Study_Areas_/FeatureServer/0`; hub [gis.data.ca.gov/datasets/hcai::medical-service-study-areas](https://gis.data.ca.gov/datasets/hcai::medical-service-study-areas) | State health-planning geography used by LACDMH |
| **Caltrans / Caltrans GIS** | ✅ `https://caltrans-gis.dot.ca.gov/arcgis/rest/services/...` (e.g. `CHaviation/Hospital_Heliports/FeatureServer/0`) | Districts, highways, aviation |
| **California county boundaries (CDTFA/CDT)** | ✅ `https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/California_County_Boundaries_and_Identifiers_with_Coastal_Buffers/FeatureServer/1` | FileGDB + GeoPackage available |
| **State legislative districts** | ✅ see §2.7 | Current (2024+) vintages with FileGDB/GeoPackage |
| **CHHS open data** | 🟡 [data.chhs.ca.gov](https://data.chhs.ca.gov/) — not separately probed in this pass | Medi-Cal, behavioral health, facility licensing |

### 4.4 HUD

| Source | URL | Detail |
|---|---|---|
| **CoC Grantee Areas** ⭐ | ✅ `https://services1.arcgis.com/4yjifSiIG17X0gW4/arcgis/rest/services/Continuum_of_Care_Grantee_Areas_from_HUD/FeatureServer/0` | See §2.4. LA CoC = **CA-600**; also CA-606 (Long Beach), CA-607 (Pasadena), CA-612 (Glendale) |
| **HUD ArcGIS Online org** | ✅ `https://services1.arcgis.com/4yjifSiIG17X0gW4/arcgis/rest/services/...` — **4,402 public items** | HUD's org. Verified relevant items: `Point_in_Time_Count_2019/FeatureServer`, `Point_in_Time_Counts/FeatureServer`, `Census_Tracts_Opportunity_Zones_2016Census/FeatureServer`, `Location_Affordability_Index/FeatureServer`, `Housing_Element`-adjacent layers, `Low Income Community Census Tracts` |
| **HUD GIS portal** | ✅ [hudgis-hud.opendata.arcgis.com](https://hudgis-hud.opendata.arcgis.com/) (HTTP 200) | ⚠ Its DCAT feed at `.../api/feed/dcat-us/1.1.json` returned **HTTP 502** — the catalog endpoint is broken even though the site loads. Discover datasets via AGOL search instead. |
| **HUD Exchange — CoC GIS Tools** | ❌ **Dead.** `https://www.hudexchange.info/programs/coc/gis-tools/` → 404. Also 404: `/programs/coc/`, `/programs/coc`, `/resource/5781/coc-gis-tools/`, `/resource/4847/continuum-of-care-coc-boundaries/`, `/homelessness-assistance/` | **HUD Exchange's CoC program pages were restructured or removed as of 2026-10-13.** Do not build a pipeline on HUD Exchange URLs without monitoring. |
| **HUD USER — QCT / DDA, FMR, Income Limits** | ⚠ `https://www.huduser.gov/portal/datasets/qct.html`, `.../fmr.html`, `.../sadda/sadda_qct.html` all returned **HTTP 202 with empty body** | 202 = bot-challenge/async. URLs exist and are the canonical locations; **content could not be verified** by non-browser client. Flagged as unverified. Qualified Census Tracts and Difficult Development Areas are the geography-bearing ones (tract-level, Excel/CSV). |
| **AHAR / PIT counts** | 🟡 via HUD AGOL items above | Tabular + polygon |

**License (federal).** HUD data is U.S. Government work — public domain in practice, standard federal attribution.

### 4.5 CMS, HRSA, and health services

| Source | URL | Detail |
|---|---|---|
| **HRSA GIS Portal** ⭐ | ✅ `https://gisportal.hrsa.gov/server/rest/services?f=pjson` — ArcGIS Server **11.3**, folders include `UDS, Shortage, HealthCareFacilities, HealthCareProviders, HealthCareShortage, HealthEquity, MCHB, Opioids, AnalyzerTool` | A full ArcGIS REST estate, largely unnoticed. |
| **Health Professional Shortage Areas** | ✅ `https://gisportal.hrsa.gov/server/rest/services/Shortage/HealthProfessionalShortageAreas_FS/MapServer` — **layer `4` = Mental Health HPSA**, `8` = Primary Care HPSA, `0` = Dental Health HPSA | Directly relevant to behavioural-health siting |
| **Medically Underserved Areas/Populations** | ✅ `.../Shortage/MedicallyUnderservedAreas_FS/MapServer/0` | MUA/MUP perimeter polygons |
| **Primary Care service delivery sites** | ✅ `.../HealthCareFacilities/PrimaryHealthCareFacilities_FS/MapServer` — `0` Health Care Service Delivery Sites, `1` Grantees | FQHC/site points |
| **UDS (Uniform Data System)** | ✅ `.../UDS/UDS/MapServer/0` (`OPHC`) | Health-centre utilization reporting |
| **CMS Approved Facilities / HRSA / VHA** | ✅ `.../HealthCareFacilities/HealthCareFacilities/MapServer` — `0` CMS Approved Facilities, `12` VHA Facilities, `14` HRSA Facilities, `39–41` BLCP/HBP | Multi-agency facility layer |
| **NHSC (National Health Service Corps)** | ✅ `.../HealthCareProviders/NationalHealthServicesCorps_FS/MapServer` | NHSC participants, jobs, eligible sites |
| **CMS data** | 🟡 [data.cms.gov](https://data.cms.gov/) (HTTP 200); provider data: [data.cms.gov/provider-data](https://data.cms.gov/provider-data/) (HTTP 200) | Mostly **tabular**, not spatial. Provider of Services file has addresses (geocode yourself), not coordinates. |
| **HRSA Data Explorer** | 🟡 [data.hrsa.gov/tools/data-explorer](https://data.hrsa.gov/tools/data-explorer) (HTTP 200) | Web UI; the REST endpoints above are the better programmatic path |

**License.** HRSA/CMS: U.S. federal, public domain in practice.

### 4.6 EPA / environmental justice — **significant breakage**

| Source | Status | Detail |
|---|---|---|
| **EJScreen** | ❌ **Gone.** `https://www.epa.gov/ejscreen` → **404**; `https://ejscreen.epa.gov/mapper/` → **DNS resolution failure** (`Could not resolve host`) | EPA's EJ screening tool and its mapper host are no longer available. Do not plan on EJScreen. |
| **EPA EJ cumulative impacts page** | ❌ `https://www.epa.gov/environmentaljustice/ej-and-cumulative-impacts-research` → 404 | |
| **EPA geodata ArcGIS** | ✅ `https://geodata.epa.gov/arcgis/rest/services?f=pjson` (HTTP 200) — folders `OAR_OAP, OECA, OEI, ORD, OSWER, OW, Region9, …` | Working, but **no EJScreen service** in the folder listing |
| **Alternatives** | 🟡 Third-party mirrors exist on AGOL (e.g. "EJScreen 2.32 US Percentiles Tracts" as a Shapefile item; CDC Environmental Justice Index feature services) | Not authoritative. **Use [CalEnviroScreen](#42-calenviroscreen-oehha-and-ca-disadvantaged-community-layers) instead** — it is California-specific, maintained, and actively published. |

**Practical conclusion:** for environmental-justice overlays in LA, **CalEnviroScreen 4.0/5.0 + SB 535 DAC are strictly better than EJScreen** — better resolution of relevance, live ArcGIS endpoints, GeoPackage downloads, and a maintainer.

---

## 5. Format tradeoffs for periodic re-import into PostGIS

### 5.1 The four consumption modes, compared

| Dimension | (a) Shapefile (.zip) | (b) GeoJSON | (c) GeoPackage (.gpkg) | (d) Live ArcGIS REST / WFS |
|---|---|---|---|---|
| **One file?** | No — 3–7 sidecar files (`.shp .shx .dbf .prj .cpg .sbn .xml`) | Yes | Yes, single SQLite container | N/A (HTTP) |
| **Geometry types** | One per file | Mixed `FeatureCollection` allowed | **Multiple layers, mixed types, one file** | Layer-defined |
| **Null geometry** | **Not representable** — features must have geometry, or the file is invalid | `"geometry": null` allowed | Allowed | Allowed |
| **Field names** | **Truncated to 10 chars** in DBF | Any length (JSON) | Any length | Any (Esri aliases separate) |
| **Field types** | DBF: no `timestamptz`, no `boolean`, no `bigint`, no Unicode-safe text without codepage | Full JSON types | Full SQLite types incl. dates, booleans | Esri types incl. `esriFieldTypeDate` (epoch ms) |
| **Text encoding** | **Legacy codepage**; needs `.cpg` or falls back to system codepage. LA layers with Spanish/Chinese/Korean names break silently. | UTF-8 by spec | UTF-8 by default | UTF-8 JSON |
| **Size limits** | **2 GB per file (hard)**; DBF 2 GB; field count 255 | None, but memory-hungry to parse whole-file | Effectively unlimited (SQLite) | `maxRecordCount` per request (often 1000–2000) |
| **Compression** | Usually zipped | gzip if server sets it | Internally page-based | gzip |
| **Spatial index** | `.shx` (offset index only) | None | **R-tree spatial index** | Server-side |
| **CRS declaration** | `.prj` (WKT); **LA files are often 2229 or 3310, not 4326** | **RFC 7946 says WGS84 — but publishers lie** (see §6.3) | Declared per layer in `gpkg_spatial_ref_sys` | Declared in service metadata (`?f=pjson`) |
| **Multi-user / partial read** | Whole file | Whole file | SQLite: can query subsets | Server-side filter/query |
| **Authoritative timeliness** | Snapshot at download | Snapshot | Snapshot | **Always current** |
| **Change detection** | Diff full files | Diff full files | Diff full files | `lastEditDate` / date fields / `supportsQueryDataElements` |
| **Offline/reproducible** | ✔ Good (pin the file) | ✔ Good | ✔ Best (single artifact) | ✘ Not reproducible |
| **Fails loudly?** | Sometimes silently (encoding, truncation) | Usually loudly | Usually loudly | Fails loudly (HTTP) |

### 5.2 Recommendation for BetterAngels

**Use a tiered strategy, not one format.**

1. **Live ArcGIS REST as the default refresh path.** Most LA sources in this catalog expose a verified FeatureServer or MapServer layer. Query with `where=1=1&outFields=*&f=geojson&outSR=4326` and page with `resultOffset`/`resultRecordCount`, honoring the service's `maxRecordCount` (1000–2000 in LA). Reasons this wins for LA specifically:
   - It is the **only** way to get the current vintage without hunting for a re-published file (see the 2026-08 CSA update and the annual CES/CDE releases).
   - The source CRS is **explicitly declared** in `?f=pjson` — which is exactly the information GeoJSON files tend to get wrong (§6.3).
   - It avoids shapefile's 10-char field truncation, which would mangle LA County LMS fields like `nameUrlFriendly` → `nameUrlFrie`, `date_updated` → `date_updat`, `dis_status` → `dis_status` (fits) — and worse on longer names.
   - **Verify before each run** that the layer still exists and still reports the geometry type and CRS you expect; these are county/city servers where layers are renumbered (e.g. the LA City `Boundaries` MapServer has a group layer `0` plus `1–28`, and the county's `Administrative_Boundaries` mixes 2012 and 2022 vintages in one service).

2. **GeoPackage as the archival/pinned artifact.** Where available — `gis.data.ca.gov` items (CalEnviroScreen 4.0, CDE school districts, county boundaries, legislative districts), LA County hub items that advertise it, and LA City hub items that advertise it — `.../geoPackage?layers=N` returns a real `.gpkg`. A GeoPackage carries its own CRS, preserves full field names, allows null geometry, and is a single file you can checksum and store. This is the right format for "the version we validated on date X."
   - ⚠ **GeoPackage availability is per-item, not per-portal.** On LA City GeoHub, `.../geoPackage?layers=13` returns **HTTP 400** `{"message":"Unsupported file format. Supported file formats are csv, shapefile, geojson, kml"}`, while the same endpoint on a different item (`c8e6c2f2b6434c67a33a7b189f53f2b4`) returns a real `.gpkg`. **Always probe the format before relying on it**; the DCAT feed advertising "GeoPackage" does not guarantee the endpoint honours it.

3. **Shapefile only as a fallback, and only when the layer is small and ASCII.** Shapefile's real hazards for this project, concretely:
   - **No null geometry** — HUD CoC and LMS records that lack coordinates will be **silently dropped** by any shapefile export.
   - **10-char field truncation** — LA County LMS has `nameUrlFriendly`, `date_updated`, `description`, `dis_status`; DPH indicator layers have long `copyrightText`-style attribute names. You will lose or collide columns.
   - **Codepage** — LA data contains `Cañada`, `El Sereno`, Korean/Chinese place names in some resource datasets. A missing `.cpg` yields mojibake that only surfaces in production.
   - **2 GB / 255 fields / one geometry type** — the LA County parcel and precinct layers exceed this; never route those through shapefile.
4. **WFS is a genuine first-class option here — and it is rare.** The LA City `Boundaries` MapServer is verified to serve **WFS 2.0.0** (`/lahub/services/Boundaries/MapServer/WFSServer`) with **30 feature types** including `BoundariesPro:Council_Districts`, `BoundariesPro:Community_Plan_Areas`, `BoundariesPro:Neighborhood_Councils__Certified_`, `BoundariesPro:City_Boundary`, `BoundariesPro:Zip_Codes__LA_County_`. Use `ogr2ogr -f PostgreSQL "PG:..." WFS:"<url>" <typename>` for a one-command ingest, or `GetFeature` with `count=`/`startIndex=` for paging. Note the namespace is `BoundariesPro` while the URL segment is `Boundaries`.
   - Elsewhere in LA, WFS is **scarce**: the county estate advertises only `KmlServer` on the layers inspected, and Metro's MapServer advertises `KmlServer` only.

### 5.3 Concrete pipeline notes

- **Never trust a declared CRS over the observed coordinates.** See §6.3 — `data.lacity.org` serves GeoJSON in State Plane feet while labelling it GeoJSON.
- **Set `-t_srs`/`ST_Transform` explicitly** to your storage SRID. Store in **EPSG:4326** (or 4269) for interchange and add a generated geography column; or store in **EPSG:2229** if all your analysis is LA-local and you want feet-based buffers/distances without projection cost. Do not mix 2229 and 3310 in one table — they differ in both units (feet vs metres) and datum realisation.
- **Record provenance per row**: source URL, layer id, `?f=pjson` hash, retrieval timestamp, and the vintage field. Several LA layers (SPA 2012 vs 2022, CSA updates, CES 4.0 vs 5.0, SPA/health district periods) coexist in the *same* service with no year column.
- **Watch for `capabilities` that include writable verbs.** `OlderAdultCongregateMealLocations` advertises `Create,Delete,Update,Editing,Sync`, and the county `Political_Boundaries` FeatureServer advertises `Query,Create,Update,Uploads,Editing`. Public read is fine; make sure no automation ever issues `applyEdits`.
- **Watch for `type: Table`.** `Public_Library_Facilities/FeatureServer/0` is a table with no geometry despite the name. Always check `geometryType` in the layer metadata.
- **TIGERweb pagination.** Block-level LA County queries need `returnIdsOnly=true` then chunked `objectIds`, because `maxRecordCount` is far below the feature count.

---

## 6. CRS cheat sheet and the LA-specific projection traps

### 6.1 The three CRSs you will actually meet

| EPSG | Name | Units | Where you meet it in this catalog |
|---|---|---|---|
| **4326** | WGS 84 | degrees | GTFS feeds; a few hosted AGOL layers (`OlderAdultCongregateMealLocations`, City of LA cooling centres); anything a vendor "web-ready"-ified |
| **4269** | NAD83 | degrees | **All TIGER/Line shapefiles and TIGERweb** |
| **2229** | NAD83 / California State Plane Zone V (ftUS) | US survey feet | **The LA County and LA City default.** `wkid: 102645`. Political/Administrative Boundaries, LMS data, LA Times neighborhoods, LAPD divisions, Community Plan Areas, CalEnviroScreen-adjacent county layers |
| **3310** | NAD83 / California Albers | metres | **CalEnviroScreen 4.0 and 5.0**, SB 535 DAC, LA City Council Districts on AGOL |
| **3857** | WGS 84 / Pseudo-Mercator | metres (spherical) | County **MapServer** service-level SR; HUD CoC; HRSA; CDE school districts; many `*.arcgis.com` hosted layers |

### 6.2 The same layer in two projections

Verified example: **SPA (2022)**
- `https://public.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/23` → service SR **EPSG:3857**
- `https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Service_Planning_Areas_2022_view/FeatureServer/4` → **EPSG:2229**

Same geography, two hosts, two CRSs. If you ingest one as a "snapshot" and the other as a "refresh", geometry will be numerically incompatible and any `ST_Intersects` between them returns garbage. **Resolve every layer's SRID at ingest from the service metadata and transform on write.**

### 6.3 ⚠ The GeoJSON label trap (verified)

`data.lacity.org` — the LA City Socrata portal — exports GeoJSON at `https://data.lacity.org/resource/{id}.geojson`. A live test against the Parks dataset (`4jt3-efvk`) returned valid `application/vnd.geo+json` whose first coordinate pair is:

```
6471422.288662225, 1844939.9790317267
```

Those are **EPSG:2229 State Plane feet**, not degrees. The dataset's metadata (`/api/views/4jt3-efvk.json`) contains **no** `srid`, `projection`, or `geo` key — nothing declares the CRS. A naive loader will either reject the coordinates or, worse, store them as if they were lon/lat.

**Mitigation:** for `data.lacity.org` GeoJSON exports, *always* check the coordinate magnitude. `|x| > 180` ⇒ projected, almost certainly EPSG:2229 for LA City. Prefer the portal's CSV + a separate geometry source, or use the equivalent ArcGIS layer, where the CRS is declared.

### 6.4 Reprojection cost/benefit for LA

- Distances and buffers: doing them in **2229 (feet)** avoids geodesic math and is what the county's own analyses assume. Doing them in **3310 (metres)** is more portable and is what the State uses.
- Storage: **4326/4269 text** is what `ogr2ogr`, `shp2pgsql`, and most GeoJSON pipelines expect; transform at write time.
- If you store in 2229, remember every third-party layer you pull (HUD CoC in 3857, CalEnviroScreen in 3310, TIGER in 4269) needs an explicit `ST_Transform(geom, 2229)` — and `ST_Transform` between 2229 and 3310 is a **unit change as well as a datum/projection change**, so a factor-of-3.28 error will look plausible in a test and absurd in production.

---

## 7. Verification failures and open items (carry these forward)

| Item | Status on 2026-10-13 | Suggested handling |
|---|---|---|
| `oehha.ca.gov` shapefile/landing downloads | ❌ Bot-blocked (Incapsula); 212-byte HTML `calenviroscreen40shpf2021d.zip` | Use `gis.data.ca.gov` ArcGIS + download API. Do not scrape OEHHA. |
| `projects.latimes.com/mapping-la/api/` | ❌ HTTP 403 | Use the `LA_Times_Neighborhoods` FeatureServer. Confirm with the LA Times before publishing derived neighborhood boundaries. |
| `hudexchange.info/programs/coc/gis-tools/` and the whole `/programs/coc` tree | ❌ 404 | Use HUD's ArcGIS FeatureServer for CoC polygons. Monitor HUD for a relocated page. |
| `hudgis-hud.opendata.arcgis.com/api/feed/dcat-us/1.1.json` | ❌ HTTP 502 | Discover HUD datasets via AGOL search API instead. |
| `data.lacounty.gov/api/views.json` | ❌ 404 — not Socrata at that path | The site resolves and is ArcGIS-backed. Treat LA County open data as **the eGIS Hub** (`egis-lacounty.hub.arcgis.com`) plus `public.gis.lacounty.gov`. |
| `huduser.gov` QCT / FMR / SADDA pages | ⚠ HTTP 202, empty body (bot challenge) | Canonical URLs; contents unverified. Fetch from a real browser session or accept the risk. |
| `huduser.gov` ↔ HUD data downloads generally | ⚠ Same | — |
| **LACDMH Service Area polygons** | ⚠ No public feature layer found; DMH AGOL org returned 0 public items | Extract from the web-app item, email LACDMH GIS, or substitute SPAs (§2.2). |
| **LAHSA geometry (shelters, SPAs-as-LAHSA-draws-them, CES regions)** | ⚠ Dashboards/PDF/Excel only | Substitute LA County LMS 158 + HUD CoC polygons. |
| `lafoodbank.org` | ⚠ Web locator only, no API/data | Substitute DPH `Food_Distribution_chp` (credits 211 LA). |
| **Metro ArcGIS stop layers** | ⚠ Exist but newest vintage found is 2021 | Use GTFS from GitLab. |
| **EPA EJScreen** | ❌ 404 + DNS failure | Use CalEnviroScreen 5.0 / SB 535 DAC. |
| `metro.net/about/developers/` | ❌ 404 | Use `developer.metro.net` (200). |
| **License text for LA City boundary/resource layers** | ⚠ LA City GeoHub items mostly carry blank `license` fields | The City's hub terms apply; **get written confirmation before commercial redistribution**. `data.lacity.org` datasets are clearly marked **CC0 1.0** and are safe. |
| **2026-era vintages** | ℹ Catalog `modified` dates run through 2026-10; CSA updates are documented to 2026-08 | Verify each source's current vintage at ingest rather than trusting this document. |

---

## 8. Appendix — machine-readable catalog endpoints used to build this report

| Catalog | URL | Verified |
|---|---|---|
| LA City GeoHub DCAT | `https://geohub.lacity.org/api/feed/dcat-us/1.1.json` | ✅ 200 · 9,631,225 bytes · **1,689 datasets** |
| LA County eGIS Hub DCAT | `https://egis-lacounty.hub.arcgis.com/api/feed/dcat-us/1.1.json` | ✅ 200 · 6,415,167 bytes · **951 datasets** |
| CA State Geoportal DCAT | `https://gis.data.ca.gov/api/feed/dcat-us/1.1.json` | ✅ 200 · 21,234,552 bytes · **3,950 datasets** |
| LA County ArcGIS REST root | `https://public.gis.lacounty.gov/arcgis/rest/services?f=pjson` | ✅ 200 · 28 folders |
| LA City ArcGIS REST root | `https://maps.lacity.org/lahub/rest/services?f=pjson` | ✅ 200 · 35 services |
| HRSA ArcGIS REST root | `https://gisportal.hrsa.gov/server/rest/services?f=pjson` | ✅ 200 · ArcGIS Server 11.3 |
| TIGERweb REST root | `https://tigerweb.geo.census.gov/arcgis/rest/services?f=pjson` | ✅ 200 · 16 folders |
| ArcGIS Online search API | `https://www.arcgis.com/sharing/rest/search?q=...&f=json` | ✅ 200 (used to locate HUD, HRSA, Metro, DMH items) |
| LA City Socrata | `https://data.lacity.org/api/views/{id}.json`, `/resource/{id}.geojson` | ✅ 200 |
| LA County eGIS hub download API | `https://egis-lacounty.hub.arcgis.com/api/download/v1/items/{itemId}/{format}?layers={n}` | ✅ 200 (shapefile → `.zip`) |

**Reproduce this catalog at any time** by re-fetching the three DCAT feeds above and diffing against §1–§4. The download-API pattern is identical across all three ArcGIS Hub portals:

```
https://{portal}/api/download/v1/items/{itemId}/{format}?layers={layerId}
   format ∈ { shapefile, geojson, csv, kml, filegdb, geoPackage }   # per-item availability
```
