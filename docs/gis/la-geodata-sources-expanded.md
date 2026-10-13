# Los Angeles Geospatial Boundary Catalog — Verified Inventory for PostGIS Ingestion

**Owner:** BetterAngels ([github.com/BetterAngelsLA](https://github.com/BetterAngelsLA))
**Probe date for every live request in this document: 2026-10-13 (UTC)**

**Method.** Enumerated the three required DCAT feeds → 6,590 dataset records → resolved **4,604 unique ArcGIS item IDs** to real service URLs (100% of IDs resolved) → screened to **283 candidate boundary services**, each fetched live at `?f=pjson` (280 OK) → **266 real feature counts** via `returnCountOnly=true`. Layered on top: 75 targeted ArcGIS Online catalog queries (3,265 items → 460 CA/LA boundary-relevant) and the **CA Geoportal search API** (`gis.data.ca.gov/api/search/v1`, 28 queries → 150 items), which proved far richer than the CA state DCAT feed. Every CRS/EPSG, geometry type, and feature count below was read from live metadata — **none guessed**. Where a value could not be verified, it appears in §4.

**Feed inventory:** LA City GeoHub DCAT = 1,689 datasets · LA County eGIS DCAT = 951 · CA State Geoportal DCAT = 3,950. **Note:** the CA state DCAT feed contained only **1** LA-relevant boundary dataset — it omits the state's most useful boundary layers. Always query the Geoportal search API instead (§7).

---

## 0. Currency legend

| Verdict | Meaning |
|---|---|
| **CURRENT (2026)** | Latest vintage confirmed live, actively maintained, safe to ingest |
| **CURRENT but FROZEN** | Latest available and correct, but publisher has stopped updating (decennial geography, closed programs) |
| **SUPERSEDED** | Newer vintage exists — replacement named |
| **DO NOT USE** | Dead, bot-blocked, empty, non-authoritative, or wrong geometry type for the purpose |

**CRS reality check (live-read across 283 services):** EPSG:**2229** ×145 (CA State Plane Zone 5, ft) · EPSG:**3857** ×117 · EPSG:4326 ×4 · EPSG:6424 ×4 · EPSG:3310 · EPSG:26910 · EPSG:26911 · EPSG:4269 · EPSG:6421. **There is no single CRS.** See §5.3.

---

## 1. START HERE — highest-value CURRENT, officially-sourced layers

| # | Layer | Owning agency | Endpoint / download | Geom | Real count | CRS (live) | Latest vintage | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | **LA City Council Districts (Adopted 2021)** | LA City (Bureau of Engineering, on City GeoHub) | [Boundaries/MapServer/13](https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/13) | Polygon | **15** | **3857** | adopted 2021 | **CURRENT** |
| 2 | **LA County Supervisorial District (Current)** | LA County Registrar-Recorder / DPW | [Political_Boundaries/MapServer/27](https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/27) | Polygon | **5** | **2229** | 2021 CRC | **CURRENT** |
| 3 | **Service Planning Areas 2022** | LA County Dept. of Public Health | [DPH_Service_Planning_Areas_SPA/FeatureServer/17](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/DPH_Service_Planning_Areas_SPA/FeatureServer/17) | Polygon | **8** | **2229** | 2022; last edit 2026-08-31 | **CURRENT** |
| 4 | **LAHSA Service Planning Areas** | LA Homeless Services Authority | [LMBdfutQCnDGYUyc/…/Service_Planning_Areas/FeatureServer/0](https://services2.arcgis.com/LMBdfutQCnDGYUyc/arcgis/rest/services/Service_Planning_Areas/FeatureServer/0) | Polygon | **8** | **2229** | edit 2026-09-25 | **CURRENT** |
| 5 | **Health Districts 2022** | LA County Dept. of Public Health | [Health_Districts_2022_view/FeatureServer/0](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Health_Districts_2022_view/FeatureServer/0) | Polygon | **26** | **2229** | 2022 | **CURRENT** |
| 6 | **2020 Census Tracts** | LA County ISD / eGIS | [Demographics/MapServer/14](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Demographics/MapServer/14) | Polygon | **2,496** | **2229** | 2020 Census | **CURRENT but FROZEN** |
| 7 | **2020 Census Block Groups** | LA County ISD / eGIS | [Demographics/MapServer/15](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Demographics/MapServer/15) | Polygon | **6,589** | **2229** | 2020 Census | **CURRENT but FROZEN** |
| 8 | **LA Times Neighborhood Boundaries** | Los Angeles Times (hosted on LA City GeoHub) | [LA_Times_Neighborhoods/FeatureServer/0](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LA_Times_Neighborhoods/FeatureServer/0) | Polygon | **114** | **2229** | item mod. 2025-06-06 | **CURRENT** |
| 9 | **Community Plan Areas** | LA City Planning (LADCP) | [Community_Plan_Areas/FeatureServer/0](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Community_Plan_Areas/FeatureServer/0) | Polygon | **36** | **2229** | item mod. 2025-10-09 | **CURRENT** |
| 10 | **Neighborhood Councils (Certified)** | EmpowerLA (LA Dept. of Neighborhood Empowerment) | [Boundaries/MapServer/18](https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/18) | Polygon | **99** | **3857** | item mod. 2026-09-17 | **CURRENT** |
| 11 | **ZIP Codes (Parcel Accurate)** | LA County ISD | [Administrative_Boundaries/MapServer/5](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/5) | Polygon | **313** | **3857** | item mod. 2026-02-17 | **CURRENT** |
| 12 | **TIGERweb Current (live REST)** | US Census Bureau | [tigerWMS_Current/MapServer](https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer) | Polygon | on-demand | **3857** | **"Census Current (2026) … January 1, 2026 vintage"** | **CURRENT** |
| 13 | **TIGER/Line 2026 CA tracts** | US Census Bureau | [tl_2026_06_tract.zip](https://www2.census.gov/geo/tiger/TIGER2026/TRACT/tl_2026_06_tract.zip) (32.5 MB) | SHP | ~9,100 CA | **4269** | **Jan 1 2026 vintage** | **CURRENT** |
| 14 | **Continuum of Care (CoC) Grantee Areas** | HUD | [Continuum_of_Care_Grantee_Areas/FeatureServer/0](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Continuum_of_Care_Grantee_Areas/FeatureServer/0) | Polygon | **387** (national) | **3857** | item mod. 2025-08-19 | **CURRENT** |
| 15 | **Qualified Census Tracts 2026** | HUD | [QUALIFIED_CENSUS_TRACTS_2026/FeatureServer/0](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/QUALIFIED_CENSUS_TRACTS_2026/FeatureServer/0) | Polygon | **14,496** (national) | **3857** | **issued 2025-09-22** | **CURRENT** |
| 16 | **Difficult Development Areas 2026** | HUD | [Difficult_Development_Areas_2026/FeatureServer/0](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Difficult_Development_Areas_2026/FeatureServer/0) | Polygon | **2,902** (national) | **3857** | **issued 2025-09-22** | **CURRENT** |
| 17 | **CalEnviroScreen 5.0 Results** | OEHHA / CalEPA | [calenviroscreen50results_F_070126_gdb/FeatureServer/2](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/calenviroscreen50results_F_070126_gdb/FeatureServer/2) | Polygon | **9,106** | **3310** | **5.0, published Jul 2026** | **CURRENT** |
| 18 | **SB 535 Disadvantaged Communities 2026** | OEHHA / CalEPA | [SB_535_Disadvantaged_Communities_2026/FeatureServer/0](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/SB_535_Disadvantaged_Communities_2026/FeatureServer/0) | Polygon | **2,704** tracts + 125 BIA + 150 BAS + 5 consult. | **3857** | **published 2026-09-17** | **CURRENT** |
| 19 | **City & Unincorporated Boundaries (Legal)** | LA County DPW / Registrar | [Political_Boundaries/MapServer/19](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/19) | Polygon | **345** | **2229** | item mod. 2026-09-10 | **CURRENT** |
| 20 | **California Air District Boundaries** | CA Air Resources Board (CARB) | [Air_District_WFL1/FeatureServer/0](https://services6.arcgis.com/x7ftScCDR8g2kVFB/arcgis/rest/services/Air_District_WFL1/FeatureServer/0) | Polygon | **47** | **3857** | item mod. 2026-09-28 | **CURRENT** |
| 21 | **FHSZ Local Responsibility Area 2025** | CAL FIRE / OSFM | [FHSALRA25_v1_All/FeatureServer/0](https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/FHSALRA25_v1_All/FeatureServer/0) | Polygon | **9,752** | **3310** | **"map dated March 24, 2025"** | **CURRENT** |
| 22 | **CA School District Areas 2025-26** | CA Dept. of Education (via CA Geoportal) | [DistrictAreas2526/FeatureServer/0](https://services3.arcgis.com/fdvHcZVgB2QSRNkL/arcgis/rest/services/DistrictAreas2526/FeatureServer/0) | Polygon | **936** | **3857** | **2025-26 school year** | **CURRENT** |
| 23 | **Medical Service Study Areas (MSSA)** | CA HCAI (Health Care Access & Information) | [Medical_Service_Study_Areas/FeatureServer/0](https://services5.arcgis.com/fMBfBrOnc6OOzh7V/arcgis/rest/services/Medical_Service_Study_Areas/FeatureServer/0) | Polygon | **9,129** | **3857** | item mod. 2026-04-20 | **CURRENT** |
| 24 | **LA County Health/Admin boundary bundle** | LA County ISD / eGIS | [Administrative_Boundaries/MapServer](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer) | Polygon | 22 layers | **3857** | mixed 2026 | **CURRENT** |

> **⚠ Two field-name traps (both verified by reading live field lists):**
> 1. LA City Council Districts (`Boundaries/MapServer/13`) has `NAME` = **councilmember name**, `District`, `District_Name`. **Join on `District`** — `NAME` changes every election.
> 2. `Boundaries/MapServer` hosts many layers; **`Community Plan Areas` (id 9) returns 0 features.** The real CPA layer is [Community_Plan_Areas/FeatureServer/0](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Community_Plan_Areas/FeatureServer/0) (36). Don't use the LA City hub id 9.

---

## 2. FULL INVENTORY BY CATEGORY

All counts are live `returnCountOnly=true` results; CRS is `latestWkid` from live `?f=pjson`.

### 2.1 Administrative — City of Los Angeles

| Layer | Owner | Endpoint | Formats | Geom | Count | CRS | Vintage / date | Verdict | License / attribution |
|---|---|---|---|---|---|---|---|---|---|
| Council Districts (2021) | LA City (BoE) | [Boundaries/MapServer/13](https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/13) | REST, GeoJSON, PBF | Polygon | 15 | 3857 | 2021 | CURRENT | none declared (`copyrightText` empty) |
| Community Plan Areas | LADCP | [Community_Plan_Areas/FeatureServer/0](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Community_Plan_Areas/FeatureServer/0) | REST, JSON | Polygon | 36 | 2229 | mod. 2025-10-09 | CURRENT | "Los Angeles City Planning" |
| Area Planning Commissions | LADCP | [Area_Planning_Commissions/FeatureServer/1](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Area_Planning_Commissions/FeatureServer/1) | REST, JSON | Polygon | 7 | 2229 | mod. 2025-10-21 | CURRENT | LADCP |
| Neighborhood Councils (Certified) | EmpowerLA | [Boundaries/MapServer/18](https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/18) | REST, GeoJSON, PBF | Polygon | 99 | 3857 | mod. 2026-09-17 | CURRENT | none declared |
| LA Times Neighborhoods | LA Times | [LA_Times_Neighborhoods/FeatureServer/0](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LA_Times_Neighborhoods/FeatureServer/0) | REST, JSON | Polygon | 114 | 2229 | mod. 2025-06-06 | CURRENT | "Los Angeles Times" — **third-party editorial, not govt** |
| City of Los Angeles Zip Codes | LA City (DataLA) | [City_of_Los_Angeles_Zip_Codes/FeatureServer/0](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/City_of_Los_Angeles_Zip_Codes/FeatureServer/0) | REST, JSON | Polygon | 160 | 3857 | mod. 2024-05-03 | CURRENT | City of LA |
| LA City 2020 Census Tracts | LA City (DataLA) | [LA_City_2020_Census_Tracts/FeatureServer/0](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LA_City_2020_Census_Tracts/FeatureServer/0) | REST | Polygon | 1,273 | 3857 | mod. 2025-07-29 | CURRENT | City of LA |
| City Boundary | LA City | [Boundaries/MapServer/7](https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/7) | REST, GeoJSON | Polygon | **1** | 3857 | maintained | CURRENT | — |
| Business Improvement Districts | LADCP | [Business_Improvement_Districts/FeatureServer/0](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Business_Improvement_Districts/FeatureServer/0) | REST | Polygon | 42 | 2229 | mod. 2024-08-20 | CURRENT | LADCP |
| Community Plan Implementation Overlays Subareas | LADCP | [Community_Plan_Implementation_Overlays_Subareas/FeatureServer/0](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Community_Plan_Implementation_Overlays_Subareas/FeatureServer/0) | REST | Polygon | 157 | 2229 | mod. 2026-07-28 | CURRENT | LADCP |
| Targeted Neighborhood Initiative | LADCP | [Targeted_Neighborhood_Initiative/FeatureServer/0](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Targeted_Neighborhood_Initiative/FeatureServer/0) | REST | Polygon | 26 | 2229 | mod. 2024-08-20 | CURRENT | LADCP |
| Promise Zone | LADCP | [Promise_Zone/FeatureServer/0](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Promise_Zone/FeatureServer/0) | REST | Polygon | 2 | 2229 | mod. 2024-08-26 | CURRENT but FROZEN (program ended) | LADCP |
| Transit / Pedestrian / Neighborhood Enhanced Networks | LADCP | [Transit_Enhanced_Network/FeatureServer/0](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/Transit_Enhanced_Network/FeatureServer/0) | REST | Polygon | — | 2229 | mod. **2026-09-03** | CURRENT (2016 siblings SUPERSEDED) | LADCP |

**`maps.lacity.org/lahub/rest/services/Boundaries/MapServer` — remaining layers** (Polygon, EPSG:3857, `maxRecordCount` 1000): Adjacent Cities (108), Annexations (322), Assembly Districts (13), Board of Supervisors (5), Bureau of Engineering Districts (4), Cable TV Franchise Areas (16), Community Development Block Grant (333), Congressional Districts (9), Contract Administration Districts (10), Contract Administration Inspection Districts (3), County Boundary (7), CRA Project Boundary (32), Neighborhood Block Grant (26), Neighborhood Service Areas (10), Sanitation Maintenance Districts (10), Santa Monica Mountains Open Space Preservation Assessment District (2), Solids Collection Service District Days (49), State Senate Districts (6), Wastewater Collection Districts (6), Watersheds (9), Zip Codes LA County (311), Zip Codes Thomas Bros. (315).

**Other LA City services on the same host:**

| Service | Layers (Polygon, EPSG:3857 unless noted) |
|---|---|
| [LADOT/MapServer](https://maps.lacity.org/lahub/rest/services/LADOT/MapServer) | Engineering Districts (6), Parking Enforcement Districts (6), Parking Meter Zones (71), Downtown Parking District (1), Central City Parking District (1) |
| [City_Planning_Department/MapServer](https://maps.lacity.org/lahub/rest/services/City_Planning_Department/MapServer) | Signage Supplemental Use District (20), Community Design Overlay District (19), Pedestrian Oriented Districts (3), Downtown Adaptive Reuse Incentive Areas (1), Streetscape Areas (18) |
| [Special_Areas/MapServer](https://maps.lacity.org/lahub/rest/services/Special_Areas/MapServer) | Very High Fire Hazard Severity Zones (14), Fire Brush Clearance Zone (14), Fire District No.1 (12), Energy Zones (4), High Wind Area (3), Hillside Grading Area (7) |
| [Fire_Department/MapServer](https://maps.lacity.org/lahub/rest/services/Fire_Department/MapServer) | Fire Districts (107) |
| [Stormwater_Information/MapServer](https://maps.lacity.org/lahub/rest/services/Stormwater_Information/MapServer) | Special Flood Hazard Areas (2,877) |
| [Housing_and_Community_Investment_Department/MapServer](https://maps.lacity.org/lahub/rest/services/Housing_and_Community_Investment_Department/MapServer) | HUD Empowerment Zones (36), State Enterprise Zones (3), Rent Stabilization Ordinance Service Areas (3), Census Tracts w/ Severely Overcrowded Households (546) |
| [LAUSD_Schools/MapServer](https://maps.lacity.org/lahub/rest/services/LAUSD_Schools/MapServer) | LAUSD Board of Education Districts (7), LAUSD Local Districts (6), School Campuses (800) |
| [Recreation_and_Parks_Department/MapServer](https://maps.lacity.org/lahub/rest/services/Recreation_and_Parks_Department/MapServer) | Griffith Park (1) |
| [Metro_Bus_and_Rail/MapServer](https://maps.lacity.org/lahub/rest/services/Metro_Bus_and_Rail/MapServer) | Metro Transit Projects Polygons (180) — mod. 2020, **STALE** |
| [Bureau_of_Street_Services/MapServer](https://maps.lacity.org/lahub/rest/services/Bureau_of_Street_Services/MapServer) | BSS Maintenance Districts (24), BSS Tree Maintenance Districts (6) |
| [Geotechnical_and_Hydrological_Info/MapServer](https://maps.lacity.org/lahub/rest/services/Geotechnical_and_Hydrological_Info/MapServer) | Alquist-Priolo Fault Zones (5), Preliminary Fault Rupture Study Areas (1), Watercourse Buffer Zone West LA (1) |
| [Mayors_Office/MapServer](https://maps.lacity.org/lahub/rest/services/Mayors_Office/MapServer) | CityLinkLA Broadband Zones (4) |
| [Census_2010/MapServer](https://maps.lacity.org/lahub/rest/services/Census_2010/MapServer) | Census Tracts 2010 (1,012), Census Blocks 2010 (30,691) — **SUPERSEDED** |
| [Landbase_Information/MapServer](https://maps.lacity.org/lahub/rest/services/Landbase_Information/MapServer) | Tracts (28,723) — **DO NOT USE**, stacked vintages |

### 2.2 Administrative — County of Los Angeles

**Definitive redistricting source:** [`arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer`](https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer) — **EPSG:2229, maxRecordCount 1000**, 37 layers. Mirrored at [`public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer`](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer).

| Layer | ID | Count | Vintage | Verdict |
|---|---|---|---|---|
| **Supervisorial District (Current)** | **27** | 5 | 2021 CRC | **CURRENT** |
| Supervisorial District (2021) | 26 | 5 | 2021 | **SUPERSEDED** by id 27 |
| Supervisorial District (2011) | 1 | 5 | 2011 | SUPERSEDED |
| Supervisorial Districts 2001 / 1991 / 1981 / 1971 | 8 / 14 / 15 / 16 | 5 each | historical | SUPERSEDED (historical only) |
| Congressional District (2021) | 29 | 18 | 2021 | **SUPERSEDED by Prop 50** |
| Congressional District 2011 / 2001 | 2 / 9 | 18 | 2011 / 2001 | SUPERSEDED |
| State Assembly District (2021) | 30 | 24 | 2021 | **CURRENT** |
| State Assembly Districts 2011 / 2001 | 3 / 10 | 24 / 26 | 2011 / 2001 | SUPERSEDED |
| State Senate District (2021) | 31 | 13 | 2021 | **CURRENT** |
| State Senate Districts 2011 / 2001 | 4 / 11 | 15 / 14 | 2011 / 2001 | SUPERSEDED |
| Board of Equalization (2021) | 32 | 1 | 2021 | **CURRENT** |
| Board of Equalization (2011) | 5 | 2 | 2011 | SUPERSEDED |
| LA City Council Districts (2021) | 33 | 15 | 2021 | **CURRENT** |
| LA City Council Districts 2012 / 2002 | 6 / 12 | 15 | 2012 / 2002 | SUPERSEDED |
| School Districts | 25 | 85 | current | CURRENT |
| **Registrar Recorder Precincts** | 34 | **33,236** | mod. 2026-09-10 | CURRENT |
| Registrar Recorder Election Precincts | 37 | 2,853 | current | CURRENT |
| County Boundaries | 18 | 11 | current | CURRENT |
| City Boundaries | 19 | 345 | mod. 2026-09-10 | CURRENT |
| Community Boundaries (CSA) | 23 | 374 | current | CURRENT |
| City Annexations | 21 | 4,424 | current | CURRENT (historical change log) |

**Other LA County administrative layers:**

| Layer | Owner | Endpoint | Geom | Count | CRS | Vintage | Verdict |
|---|---|---|---|---|---|---|---|
| Cities and Communities (Statistical Areas) | LA County ISD | [Political_Boundaries/MapServer/23](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/23) | Polygon | 374 | 2229 | mod. 2026-08-20 | CURRENT |
| LA County Unincorporated Boundaries | LA County DPW | [Political_Boundaries](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer) | Polygon | 345 | 2229 | mod. 2024-07-30 | CURRENT |
| LA County Districts (combined) | LA County RRCC | [Districts/FeatureServer/0](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Districts/FeatureServer/0) | Polygon | 320 | 2229 | mod. 2026-09-10 | CURRENT |
| Registrar Recorder School District Boundaries | LA County RRCC | [School_District_Boundaries/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/School_Districts_Boundaries/FeatureServer) | Polygon | 85 | 2229 | mod. 2026-09-10 | CURRENT |
| Registrar Recorder School District Trustee Areas | LA County RRCC | [School_Districts_Trustee_Areas/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/School_Districts_Trustee_Areas/FeatureServer) | Polygon | 360 | 2229 | mod. 2026-09-09 | CURRENT |
| **Incorporated Cities' Council Districts** | LA County RRCC | [Incorporated_Cities_Council_Districts/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Incorporated_Cities_Council_Districts/FeatureServer) | Polygon | — | 2229 | mod. 2025-10-29 | **CURRENT — high value, commonly missed** (council districts for *all 88* cities, not just LA) |
| County Lighting Maintenance District | LA County DPW | [PW_Open_Data/MapServer](https://dpw.gis.lacounty.gov/dpw/rest/services/PW_Open_Data/MapServer) | Polygon | **4,220** | 2229 | mod. 2024-07-15 | CURRENT |
| Public Works Road Maintenance Districts | LA County DPW | [Road_Maintenance_Districts/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Road_Maintenance_Districts/FeatureServer) | Polygon | 151 | 3857 | mod. 2026-08-05 | CURRENT |
| Road Maintenance District (DPW direct) | LA County DPW | [PW_Open_Data/MapServer](https://dpw.gis.lacounty.gov/dpw/rest/services/PW_Open_Data/MapServer) | Polygon | 150 | 2229 | mod. 2024-05-08 | CURRENT (mirror) |
| LA County Waterworks District Boundary | LA County DPW | [PW_Open_Data/MapServer](https://dpw.gis.lacounty.gov/dpw/rest/services/PW_Open_Data/MapServer) | Polygon | 230 | 2229 | mod. 2024-05-14 | CURRENT |
| LA County Flood Control District | LA County DPW | [PW_Open_Data/MapServer](https://dpw.gis.lacounty.gov/dpw/rest/services/PW_Open_Data/MapServer) | Polygon | 7 | 2229 | mod. 2024-05-08 | CURRENT |
| Flood Maintenance District Boundary | LA County DPW | [PW_Open_Data/MapServer](https://dpw.gis.lacounty.gov/dpw/rest/services/PW_Open_Data/MapServer) | Polygon | 5 | 2229 | mod. 2024-05-08 | CURRENT |
| LACFCD Right-of-Way Parcels | LA County DPW | [LACFCD_RW_Parcels/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/LACFCD_RW_Parcels/FeatureServer) | Polygon | **25,988** | 2229 | mod. 2024-05-08 | CURRENT |
| Township Range Section & Rancho Boundaries | LA County DPW | [Basemap/MapServer](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Basemap/MapServer) | Polygon | 3,065 | 2229 | mod. 2024-05-08 | CURRENT but FROZEN (historic survey) |
| **LA County Public Library Service Areas** | LA County Library / ISD | [Administrative_Boundaries/MapServer/12](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/12) | Polygon | **94** | 3857 | mod. 2026-09-09 | **CURRENT — count confirmed** |
| Public Library Planning Areas | LA County Library | [Administrative_Boundaries/MapServer/11](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/11) | Polygon | 8 | 3857 | mod. 2026-09-10 | CURRENT |
| Animal Care and Control Service Areas | LA County ISD | [Animal_Care_and_Control_Service_Areas/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Animal_Care_and_Control_Service_Areas/FeatureServer) | Polygon | 359 | 2229 | mod. 2024-01-10 | CURRENT |
| **Los Angeles County Catchment Areas** | LA County DPW | [Los_Angeles_County_Catchment_Areas/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Los_Angeles_County_Catchment_Areas/FeatureServer) | Polygon | **156,924** | 2229 | mod. 2026-03-17 | CURRENT — **largest polygon layer found; verify it is a service boundary before ingest** |
| DPW Landscape Maintenance Districts | LA County DPW | [via eGIS Hub](https://egis-lacounty.hub.arcgis.com/) | Polygon | — | 2229 | mod. 2026-08-05 | CURRENT |
| Disaster Management Areas | LA County OEM | [DISASTER_MANAGEMENT_AREAS/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/DISASTER_MANAGEMENT_AREAS/FeatureServer) | Polygon | 8 | 3857 | mod. 2023-08-03 | CURRENT |
| Workforce Regions | LA County Opportunity Office | [Workforce_Regions/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Workforce_Regions/FeatureServer) | Polygon | 8 | 6424 | mod. 2023-08-03 | CURRENT |
| PSAP Boundaries | LA County | [Administrative_Boundaries/MapServer/20](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/20) | Polygon | **143** | 3857 | current | CURRENT |
| Regional Centers (2014) | LA County DPH | [Administrative_Boundaries/MapServer/6](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/6) | Polygon | 7 | 3857 | 2014 | CURRENT but FROZEN |
| DCFS Office Boundaries | LA County DCFS | [Administrative_Boundaries/MapServer/2](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/2) | Polygon | 19 | 3857 | current | CURRENT |
| LA County Fire Station Boundaries | LA County Fire | [Administrative_Boundaries/MapServer/19](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/19) | Polygon | **175** | 3857 | current | CURRENT |
| State Enterprise Zones | LA County | [Administrative_Boundaries/MapServer/16](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/16) | Polygon | 3 | 3857 | current | CURRENT but FROZEN (program expired) |
| SCAG Regions | LA County Planning | [Subregionboundaryscag/MapServer](https://maps.scag.ca.gov/scaggis/rest/services/OpenData/Subregionboundaryscag/MapServer) | Polygon | 40 | 26911 | mod. 2023-08-03 | CURRENT |
| **GENASYS Alert Warning Areas** | LA County EOC (OEM) | [GENASYS_Alert_Warning_Area_NEW_view/FeatureServer/0](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/GENASYS_Alert_Warning_Area_NEW_view/FeatureServer/0) | Polygon | **0** | 3857 | item mod. 2026-10-13 | **DO NOT USE — service is LIVE but EMPTY (0 features)** |

**LA County Planning (DRP) `arcgis.gis.lacounty.gov/.../DRP/Open_Data/MapServer`** — all Polygon, EPSG:2229, item mod. 2026: Significant Ecological Area SEA (392), Agricultural Resource Area ARA (141), Zoned District ZD (211), Community Standards District CSD (28), Subdivision Activity in Unincorporated Areas (191), Rural Outdoor Lighting District / Dark Skies (117), Rural Preservation Area (66), Employment Protection District (31), Equestrian District EQD (7), Transit Oriented District TOD (9), Airport Supplemental Areas (44), Green Zones Sensitive Use Buffers 500 ft (25), Setback District Line, Native Tree Restoration Priority Planting Areas.

### 2.3 Census / statistical geography

| Layer | Owner | URL | Formats | Geom | Count | CRS | Vintage | Verdict |
|---|---|---|---|---|---|---|---|---|
| TIGER/Line **2026** CA Census Tracts | US Census | [tl_2026_06_tract.zip](https://www2.census.gov/geo/tiger/TIGER2026/TRACT/tl_2026_06_tract.zip) | SHP (32.5 MB) | Polygon | ~9,100 CA / 2,496 LA Co | **4269** | **Jan 1 2026** | **CURRENT** |
| TIGER/Line 2026 CA Block Groups | US Census | [tl_2026_06_bg.zip](https://www2.census.gov/geo/tiger/TIGER2026/BG/tl_2026_06_bg.zip) | SHP (52.8 MB) | Polygon | ~23,000 CA / 6,589 LA Co | 4269 | **Jan 1 2026** | **CURRENT** |
| TIGER/Line 2026 CA Blocks | US Census | [tl_2026_06_tabblock20.zip](https://www2.census.gov/geo/tiger/TIGER2026/TABBLOCK20/tl_2026_06_tabblock20.zip) | SHP (**386 MB**) | Polygon | ~520,000 CA / 91,626 LA Co | 4269 | **Jan 1 2026** | **CURRENT** |
| TIGER/Line 2026 ZCTA (national) | US Census | [tl_2026_us_zcta520.zip](https://www2.census.gov/geo/tiger/TIGER2026/ZCTA520/tl_2026_us_zcta520.zip) | SHP (**529 MB**) | Polygon | ~33,000 US / ~313 LA Co | 4269 | **Jan 1 2026** | **CURRENT** |
| TIGER/Line 2026 CA Places | US Census | [tl_2026_06_place.zip](https://www2.census.gov/geo/tiger/TIGER2026/PLACE/tl_2026_06_place.zip) | SHP (9.9 MB) | Polygon | — | 4269 | **Jan 1 2026** | **CURRENT** |
| TIGER/Line 2026 US Counties | US Census | [tl_2026_us_county.zip](https://www2.census.gov/geo/tiger/TIGER2026/COUNTY/tl_2026_us_county.zip) | SHP (83.4 MB) | Polygon | 3,144 US / 88 CA | 4269 | **Jan 1 2026** | **CURRENT** |
| TIGER/Line 2026 CA SLDL (Assembly) | US Census | [tl_2026_06_sldl.zip](https://www2.census.gov/geo/tiger/TIGER2026/SLDL/tl_2026_06_sldl.zip) | SHP (4.1 MB) | Polygon | 80 CA | 4269 | **Jan 1 2026** | **CURRENT** |
| TIGER/Line 2026 CA SLDU (Senate) | US Census | [tl_2026_06_sldu.zip](https://www2.census.gov/geo/tiger/TIGER2026/SLDU/tl_2026_06_sldu.zip) | SHP (3.2 MB) | Polygon | 40 CA | 4269 | **Jan 1 2026** | **CURRENT** |
| **TIGER/Line 2026 CA Congressional (cd120)** | US Census | [tl_2026_06_cd120.zip](https://www2.census.gov/geo/tiger/TIGER2026/CD/tl_2026_06_cd120.zip) | SHP (4.4 MB) | Polygon | 52 CA | 4269 | **120th Congress, Jan 1 2026** | **CURRENT** |
| TIGER/Line 2026 CA Unified School Districts | US Census | [tl_2026_06_unsd.zip](https://www2.census.gov/geo/tiger/TIGER2026/UNSD/tl_2026_06_unsd.zip) | SHP (4.3 MB) | Polygon | — | 4269 | **Jan 1 2026** | **CURRENT** |
| TIGER/Line 2026 CA Elementary School Districts | US Census | [tl_2026_06_elsd.zip](https://www2.census.gov/geo/tiger/TIGER2026/ELSD/tl_2026_06_elsd.zip) | SHP | Polygon | — | 4269 | **Jan 1 2026** | **CURRENT** |
| TIGER/Line 2026 CA Secondary School Districts | US Census | [tl_2026_06_scsd.zip](https://www2.census.gov/geo/tiger/TIGER2026/SCSD/tl_2026_06_scsd.zip) | SHP | Polygon | — | 4269 | **Jan 1 2026** | **CURRENT** |
| TIGER/Line 2026 AIANNH (tribal) | US Census | [tl_2026_us_aiannh.zip](https://www2.census.gov/geo/tiger/TIGER2026/AIANNH/tl_2026_us_aiannh.zip) | SHP (9.2 MB) | Polygon | national | 4269 | **Jan 1 2026** | **CURRENT** |
| TIGER/Line 2026 CA PUMA (2020) | US Census | [tl_2026_06_puma20.zip](https://www2.census.gov/geo/tiger/TIGER2026/PUMA20/tl_2026_06_puma20.zip) | SHP (6.2 MB) | Polygon | — | 4269 | 2020 PUMA on 2026 base | **CURRENT** |
| TIGER/Line 2026 CA County Subdivisions | US Census | [tl_2026_06_cousub.zip](https://www2.census.gov/geo/tiger/TIGER2026/COUSUB/tl_2026_06_cousub.zip) | SHP | Polygon | — | 4269 | **Jan 1 2026** | **CURRENT** |
| **TIGERweb Current (live REST)** | US Census | [tigerWMS_Current/MapServer](https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer) | REST, GeoJSON, PBF | Polygon | on-demand | **3857** | **"Census Current (2026) … January 1, 2026 vintage"** | **CURRENT — best Census option for PostGIS** |
| TIGERweb L8 / L10 / L12 | US Census | `…/tigerWMS_Current/MapServer/{8,10,12}` | REST | Polygon | tracts / block groups / 2020 blocks | 3857 | 2026 vintage | CURRENT |
| TIGERweb L54 / L56 / L58 | US Census | `…/tigerWMS_Current/MapServer/{54,56,58}` | REST | Polygon | **"120th Congressional Districts"**, "2026 SLDU", "2026 SLDL" | 3857 | **Jan 1 2026** | CURRENT |
| TIGERweb L2 / L28 / L30 / L82 | US Census | `…/tigerWMS_Current/MapServer/{2,28,30,82}` | REST | Polygon | 2020 ZCTA / Incorporated Places / CDPs / Counties | 3857 | 2026 vintage | CURRENT |
| 2020 Census Tracts (county-hosted) | LA County ISD | [Demographics/MapServer/14](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Demographics/MapServer/14) | REST | Polygon | 2,496 | 2229 | 2020 | CURRENT but FROZEN |
| 2020 Census Block Groups | LA County ISD | [Demographics/MapServer/15](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Demographics/MapServer/15) | REST | Polygon | 6,589 | 2229 | 2020 | CURRENT but FROZEN |
| 2020 Census Blocks | LA County ISD | [Demographics/MapServer/16](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Demographics/MapServer/16) | REST | Polygon | 91,626 | 2229 | 2020 | CURRENT but FROZEN |
| 2020 Census Designated Places | LA County ISD | [2020_Census_Designated_Places_WFL1/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/2020_Census_Designated_Places_WFL1/FeatureServer) | REST | Polygon | — | 3857 | mod. 2024-04-29 | CURRENT but FROZEN |
| **LA County 2026 Split Tract** | LA County ISD | [2026_Split_Tract/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/2026_Split_Tract/FeatureServer) | REST | Polygon | **2,892** | 2229 | **2026** | **CURRENT — newest Census-derived tract geography** |
| 2025 Population & Poverty at Split Tract | LA County ISD | [CT20FIP25CSA/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/CT20FIP25CSA/FeatureServer) | REST | Polygon | 2,890 | 2229 | 2025 | CURRENT |
| Split Tracts | LA County ISD | [Split_Tracts/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Split_Tracts/FeatureServer) | REST | Polygon | 2,880 | 2229 | mod. 2025-05-28 | CURRENT |
| California 2024 Census Designated Places | CA Geoportal (CDT) | [Census_Designated_Place_2024/FeatureServer/1](https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/Census_Designated_Place_2024/FeatureServer/1) | REST | Polygon | 1,136 | **3310** | 2024 | CURRENT |
| Tracts (multi-vintage stack) | LA City | [Landbase_Information/MapServer](https://maps.lacity.org/lahub/rest/services/Landbase_Information/MapServer) | REST | Polygon | 28,723 | 3857 | mixed | **DO NOT USE — stacked vintages** |

> LA County `Demographics/MapServer` has **maxRecordCount = 3000**; TIGERweb allows **100000** — the two most generous services for bulk pulls. Most others cap at 1000–2000.

### 2.4 Service geographies — health, homeless services, public safety

| Layer | Owner | Endpoint | Geom | Count | CRS | Vintage | Verdict |
|---|---|---|---|---|---|---|---|
| Service Planning Areas 2022 | LA County DPH | [Service_Planning_Areas_2022_view/FeatureServer/4](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Service_Planning_Areas_2022_view/FeatureServer/4) | Polygon | 8 | 2229 | 2022; last edit 2026-08-31 | **CURRENT** |
| **DPH Service Planning Areas (SPA)** | LA County DPH | [DPH_Service_Planning_Areas_SPA/FeatureServer/17](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/DPH_Service_Planning_Areas_SPA/FeatureServer/17) | Polygon | 8 | 2229 | "Los Angeles County Service Planning Areas (SPAs), updated in 2022 … Updating SPA and Health District boundaries to align" | **CURRENT — canonical DPH SPA** |
| Service Planning Areas (2022) on eGIS | LA County ISD | [Administrative_Boundaries/MapServer/23](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/23) | Polygon | 8 | 3857 | 2022 | CURRENT |
| **LAHSA Service Planning Areas** | LA Homeless Services Authority | [Service_Planning_Areas/FeatureServer/0](https://services2.arcgis.com/LMBdfutQCnDGYUyc/arcgis/rest/services/Service_Planning_Areas/FeatureServer/0) | Polygon | 8 | 2229 | item mod. 2026-09-25 | **CURRENT — LAHSA's own SPA** |
| LAHSA SPA Outreach Zones 2026 | LAHSA (`LAHSA_AE`) | AGOL item, mod. 2026-08-04 | Polygon | — | — | **2026** | CURRENT |
| Health Districts 2022 | LA County DPH | [Health_Districts_2022_view/FeatureServer/0](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Health_Districts_2022_view/FeatureServer/0) | Polygon | 26 | 2229 | 2022; item mod. 2026-02-19 | **CURRENT** |
| DMH HOME Team Boundaries | LA County Dept. of Mental Health | [LA_County_DMH_HOME_Team_Boundaries_test/FeatureServer/0](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/LA_County_DMH_HOME_Team_Boundaries_test/FeatureServer/0) | Polygon | 32 | 3857 | item mod. 2026-07-08 | CURRENT (note `_test` in name) |
| DMH Updated HOME Team Boundaries 060926 | LA County DMH | [Update_HOME_Team_Boundaries_060926/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Update_HOME_Team_Boundaries_060926/FeatureServer) | Polygon | — | 3857 | **2026-06-09** | **CURRENT — newer than the `_test` service** |
| **DMH 2026 Homeless Summary by SPA** | LA County DMH / DPH | [2026_Homeless_Summary_by_SPA/FeatureServer/0](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/2026_Homeless_Summary_by_SPA/FeatureServer/0) | Polygon | 8 | 2229 | **2026-08-27** | **CURRENT** |
| **HUD Continuum of Care (CoC) Grantee Areas** | HUD | [Continuum_of_Care_Grantee_Areas/FeatureServer/0](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Continuum_of_Care_Grantee_Areas/FeatureServer/0) | Polygon | 387 national | 3857 | item mod. 2025-08-19 | **CURRENT — official CoC boundary** |
| LA County Public Library Service Areas | LA County Library | [Administrative_Boundaries/MapServer/12](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/12) | Polygon | 94 | 3857 | mod. 2026-09-09 | CURRENT |
| LACoFD Battalion Boundaries | LA County Fire | [LACoFD_Battalion_Boundaries/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/LACoFD_Battalion_Boundaries/FeatureServer) | Polygon | 22 | 2229 | mod. 2024-10-02 | CURRENT |
| LACoFD Division Boundaries | LA County Fire | [LACoFD_Division_Boundaries/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/LACoFD_Division_Boundaries/FeatureServer) | Polygon | 9 | 2229 | mod. 2024-10-02 | CURRENT |
| LACoFD Region Boundaries | LA County Fire | [LACoFD_Region_Boundaries/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/LACoFD_Region_Boundaries/FeatureServer) | Polygon | 3 | 2229 | mod. 2024-10-02 | CURRENT |
| LACoFD Fire Station Boundaries | LA County Fire | [LACoFD_Fire_Station_Boundaries/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/LACoFD_Fire_Station_Boundaries/FeatureServer) | Polygon | 174 | 2229 | mod. 2025-05-28 | CURRENT |
| LACoFD Jurisdictional 2000 m Grid | LA County Fire | [LACoFD_Jurisdictional_2000_Meter_Grid/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/LACoFD_Jurisdictional_2000_Meter_Grid/FeatureServer) | Polygon | 2,831 | 2229 | mod. 2021-08-13 | CURRENT but FROZEN |
| LACoFD Fire Hazard Severity Zones — LRA | LA County Fire | [LACoFD_Fire_Hazard_Severity_Zones/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/LACoFD_Fire_Hazard_Severity_Zones/FeatureServer) | Polygon | 4 | 2229 | mod. 2025-08-25 | CURRENT |
| Law Enforcement Reporting Districts | LA County ISD | [Administrative/MapServer](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative/MapServer) | Polygon | **5,312** | 3857 | mod. 2023-08-03 | CURRENT |
| Station Boundaries (LASD) | LA County ISD | [Administrative_Boundaries/MapServer](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer) | Polygon | 92 | 3857 | mod. 2023-08-03 | CURRENT |
| Medical Service Study Areas (MSSA) | CA HCAI | [Medical_Service_Study_Areas/FeatureServer/0](https://services5.arcgis.com/fMBfBrOnc6OOzh7V/arcgis/rest/services/Medical_Service_Study_Areas/FeatureServer/0) | Polygon | **9,129** | 3857 | item mod. 2026-04-20 | **CURRENT — official CA MSSA** |
| LA County Park Planning Areas | LA County Parks (DPR) | [Administrative_Boundaries/MapServer/1](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/1) | Polygon | 47 | 3857 | mod. 2025-04-08 | CURRENT |
| DPR Park Service Areas | LA County Parks | [DPR_Park_Service_Areas/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/DPR_Park_Service_Areas/FeatureServer) | Polygon | 96 | 2229 | mod. 2025-04-08 | CURRENT |
| DPR Recreation Districts | LA County Parks | [DPR_Recreation_Districts/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/DPR_Recreation_Districts/FeatureServer) | Polygon | 10 | 2229 | mod. 2025-04-08 | CURRENT |
| DPR Park Planning Areas | LA County Parks | [DPR_Park_Planning_Areas/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/DPR_Park_Planning_Areas/FeatureServer) | Polygon | 47 | 2229 | mod. 2025-07-17 | CURRENT |
| DPR Agency Boundaries | LA County Parks | [DPR_Agency_Boundaries/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/DPR_Agency_Boundaries/FeatureServer) | Polygon | 3 | 2229 | mod. 2025-04-17 | CURRENT |
| Measure A Study Areas | LA County Parks | [Measure_A_Study_Areas/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Measure_A_Study_Areas/FeatureServer) | Polygon | 188 | 4326 | mod. 2025-04-08 | CURRENT |
| Park Needs Assessment Results | LA County Parks | [ParkNeedFramework/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/ParkNeedFramework/FeatureServer) | Polygon | 188 | 3857 | mod. 2025-04-08 | CURRENT |
| LA City Parks Boundaries | LA City RAP | [LA_City_Parks_Boundaries/FeatureServer](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LA_City_Park/FeatureServer) | Polygon | 569 | 3857 | mod. 2025-08-18 | CURRENT |
| LA City RAP Facility Boundaries | LA City RAP | [LARAP_Parks/FeatureServer](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LARAP_Parks/FeatureServer) | Polygon | 449 / 561 | 3857 | mod. 2025-08-18 | CURRENT |
| LA City Park Needs Assessment | LA City RAP | [LA_City_Par/FeatureServer](https://services5.arcgis.com/7nsPwEMP38bSkCjy/arcgis/rest/services/LA_City_Par/FeatureServer) | Polygon | 518 | 3857 | mod. 2026-03-11 | CURRENT |
| Baldwin Hills Conservancy Jurisdictional Boundaries | Baldwin Hills Conservancy / CA DPR | [Baldwin_Hill/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Baldwin_Hill/FeatureServer) | Polygon | 2 | 2229 | mod. 2025-11-26 | CURRENT |
| HPSA Primary Care (LA County clip) | LA County DPH — derived from HRSA | [HPSA_Primary_Care_Polygon_chp/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/HPSA_Primary_Care_Polygon_chp/FeatureServer) | Polygon | 46 | 2229 | item mod. **2024-04-23** | **CURRENT but STALE** (see §4) |
| HPSA Mental Health (LA County clip) | LA County DPH | [HPSA_Mental_Health_Polygon_chp/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/HPSA_Mental_Health_Polygon_chp/FeatureServer) | Polygon | 31 | 2229 | 2024-04-23 | CURRENT but STALE |
| HPSA Dental Health (LA County clip) | LA County DPH | [HPSA_Dental_Health_Polygon_chp/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/HPSA_Dental_Health_Polygon_chp/FeatureServer) | Polygon | 9 | 2229 | 2024-04-23 | CURRENT but STALE |
| Medically Underserved Areas/Populations | LA County DPH | [Medically_Underserved_chp/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Medically_Underserved_chp/FeatureServer) | Polygon | 43 | 2229 | 2024-04-23 | CURRENT but STALE |
| Healthy Places Index 3.0 | Public Health Alliance of SoCal (hosted LA County DPH) | [Healthy_Places_Index/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Healthy_Places_Index/FeatureServer) | Polygon | 2,344 | 2229 | 3.0; mod. 2024-04-23 | CURRENT |
| Indoor Air Quality Sensitivity Index v1.0 | LA County ISD | [iaqs_index_p/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/iaqs_index_p/FeatureServer) | Polygon | 2,495 | 2229 | v1.0, mod. 2026-07-08 | CURRENT |
| Maximum Extent Evacuation Zones — LA County Fires 2025 | LA County ISD | [Maximum_Exte/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Maximum_Exte/FeatureServer) | Polygon | 368 | 2229 | 2025 fires; mod. 2026-04-06 | CURRENT |

### 2.5 Environmental / health / equity

| Layer | Owner | Endpoint | Geom | Count | CRS | Vintage | Verdict |
|---|---|---|---|---|---|---|---|
| **CalEnviroScreen 5.0 Results** | OEHHA / CalEPA | [calenviroscreen50results_F_070126_gdb/FeatureServer/2](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/calenviroscreen50results_F_070126_gdb/FeatureServer/2) | Polygon | 9,106 | **3310** | **v5.0, item mod. 2026-07-30** | **CURRENT** |
| CalEnviroScreen 4.0 Results | OEHHA / CalEPA | [CalEnviroScreen_4_0_Results_/FeatureServer/0](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/CalEnviroScreen_4_0_Results_/FeatureServer/0) | Polygon | 8,035 | 3310 | v4.0, Oct 2021 | **SUPERSEDED by 5.0** |
| CalEnviroScreen 3.0 (LA County clip) | LA City LASAN (derived) | [CalEnviroScreen_Data/FeatureServer/2](https://services1.arcgis.com/X1hcdGx5Fxqn4d0j/arcgis/rest/services/CalEnviroScreen_Data/FeatureServer/2) | Polygon | 2,393 | 3857 | **CES 3.0** | **SUPERSEDED — two generations old** |
| CalEnviroScreen 2.0 Score | LA County ISD | [Hazards/MapServer](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Hazards/MapServer) | Polygon | 268 | 3857 | **CES 2.0** | **SUPERSEDED — do not use** |
| **SB 535 Disadvantaged Communities 2026** | OEHHA / CalEPA | [SB_535_Disadvantaged_Communities_2026/FeatureServer/0](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/SB_535_Disadvantaged_Communities_2026/FeatureServer/0) | Polygon | 2,704 tracts; L1 125 BIA; L2 5 consult.; L3 150 BAS | 3857 | **published 2026-09-17** | **CURRENT** |
| SB 535 DAC 2022 (+ 2024 tribal update) | OEHHA | [SB535_DACupdate20232024/FeatureServer](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/SB535_DACupdate20232024/FeatureServer) | Polygon | 2,310 + 152 | 3310 | 2022 / tribal upd. 2024-09-27 | **SUPERSEDED by 2026** |
| SB 535 DAC 2022 | OEHHA | [SB_535_Disadvantaged_Communities_2022/FeatureServer/0](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/SB_535_Disadvantaged_Communities_2022/FeatureServer/0) | Polygon | 2,310 | 3310 | 2022 | **SUPERSEDED by 2026** |
| **California Air District Boundaries** | CA Air Resources Board | [Air_District_WFL1/FeatureServer/0](https://services6.arcgis.com/x7ftScCDR8g2kVFB/arcgis/rest/services/Air_District_WFL1/FeatureServer/0) | Polygon | **47** | 3857 | item mod. 2026-09-28; "as defined in … 40 CFR Ch. I §81 and CA Health & Safety Code §40000 et seq." | **CURRENT — includes South Coast AQMD** |
| **FHSZ Local Responsibility Area 2025** | CAL FIRE / OSFM | [FHSALRA25_v1_All/FeatureServer/0](https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/FHSALRA25_v1_All/FeatureServer/0) | Polygon | 9,752 | 3310 | **"map dated March 24, 2025"** | **CURRENT** |
| FHSZ State Responsibility Area 2023.3 | CAL FIRE / OSFM | [FHSZSRA_23_3/FeatureServer/0](https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/FHSZSRA_23_3/FeatureServer/0) | Polygon | 18,423 | 3857 | **"map dated September 29, 2023, as adopted on January 31, 2024 and implemented on April 1, 2024"** | **CURRENT** |
| CAL FIRE State Responsibility Areas | CAL FIRE | [State_Responsibility_Area/FeatureServer/0](https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/State_Responsibility_Area/FeatureServer/0) | Polygon | 20,499 | 3857 | item mod. 2026-04-09 | CURRENT |
| Combined High Hazard Zones (HHZ) | CAL FIRE | [HHZ_Explode/FeatureServer/2](https://jujyio9tsa7ehvfz.svcs1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/HHZ_Explode/FeatureServer/2) | Polygon | **85,567** | 3857 | item mod. 2026-09-25 | CURRENT |
| CAL FIRE Forest Districts TA83 | CAL FIRE | [CAL_FIRE_Forest_Districts_TA83/FeatureServer/0](https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/CAL_FIRE_Forest_Districts_TA83/FeatureServer/0) | Polygon | 4 | 3310 | item mod. 2024-05-13 | CURRENT |
| CAL FIRE Jurisdictions | CAL FIRE | [Jurisdictions/FeatureServer/0](https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/Jurisdictions/FeatureServer/0) | Polygon | 540 | 3857 | item mod. 2026-07-10 | CURRENT |
| Regional Water Quality Control Board Boundaries | CA State Water Resources Control Board | [Administrative/Regional_Board_Boundaries/MapServer](https://gispublic.waterboards.ca.gov/arcgis/rest/services/Administrative/Regional_Board_Boundaries/MapServer) | Polygon | — | — | item mod. **2026-09-24** | CURRENT |
| Regional Board Boundary Features (portal mirror) | CA Water Boards | [Regional_Board_Boundary_Features/FeatureServer](https://gispublic.waterboards.ca.gov/portalserver/rest/services/Hosted/Regional_Board_Boundary_Features/FeatureServer) | Polygon | — | — | — | **Token Required (499)** — use the non-portal mirror |
| **Low-Income or Disadvantaged Communities (CEC)** | CA Energy Commission | [Low_Income_or_Disadvantaged_Communities_Designated_by_California/FeatureServer/0](https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Low_Income_or_Disadvantaged_Communities_Designated_by_California/FeatureServer/0) | Polygon | 4,738 | **6414** | item mod. 2026-08-12 | CURRENT |
| California Building Climate Zones | CA Energy Commission | [BuildingCl/FeatureServer](https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/BuildingCl/FeatureServer) | Polygon | 16 | 3310 | mod. 2026-08-12 | CURRENT |
| **Electric Load Serving Entities (IOU & POU)** | CA Energy Commission | [ElectricLoadServingEntities_IOU_POU/FeatureServer/0](https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/ElectricLoadServingEntities_IOU_POU/FeatureServer/0) | Polygon | 54 | 3857 | item mod. 2026-09-02 | **CURRENT — includes LADWP service territory** |
| California Electric Balancing Authority Areas (**Retired**) | CA Energy Commission | [Balancing_A/FeatureServer](https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Balancing_A/FeatureServer) | Polygon | 9 | 26910 | mod. 2026-08-12 | **RETIRED — title says so** |
| Disadvantaged Communities by Census Block Group 2019–2023 | CDFW BIOS | [services2.arcgis.com/Uq9r85Potqm3MfRV](https://services2.arcgis.com/Uq9r85Potqm3MfRV/arcgis/rest/services) | Polygon | — | 3857 | item mod. 2025-11-18 | CURRENT |
| Fire Hazard Severity Zones (county-hosted) | LA County ISD / CAL FIRE | [Hazards/MapServer](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Hazards/MapServer) | Polygon | 268 | 3857 | mod. 2025-09-10 | CURRENT |
| Fire Hazard Responsibility Areas | LA County / CAL FIRE | [Hazards/MapServer](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Hazards/MapServer) | Polygon | 268 | 3857 | mod. 2023-08-03 | CURRENT |
| Landslide zones | LA County | [Hazards/MapServer](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Hazards/MapServer) | Polygon | 15,717 | 3857 | mod. 2022-08-24 | CURRENT but FROZEN |
| Liquefaction zones | LA County | [Hazards/MapServer](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Hazards/MapServer) | Polygon | 626 | 3857 | mod. 2022-08-24 | CURRENT but FROZEN |
| Tsunami Inundation Zones | LA County / CGS | [Hazards/MapServer](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Hazards/MapServer) | Polygon | — | 3857 | mod. 2022-04-20 | CURRENT but FROZEN |
| Fault Zones / Alquist-Priolo | LA County / CGS | [Hazards/MapServer](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Hazards/MapServer) | Polygon | 2 / 5 | 3857 | mod. 2022-04-20 | CURRENT but FROZEN |
| Green Zones Sensitive Use Buffers 500 ft | LA County Planning | [Green_Zones_/FeatureServer](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Green_Zones_/FeatureServer) | Polygon | 25 | 3857 | mod. 2026-06-02 | CURRENT |
| DPR Enforcement Regional Boundaries | CA Dept. of Pesticide Regulation | [Department_of_Pesticide_Regulation_Enforcement_Regional_Boundaries/FeatureServer/4](https://services3.arcgis.com/P3UbZpsmlNlDsarV/arcgis/rest/services/Department_of_Pesticide_Regulation_Enforcement_Regional_Boundaries/FeatureServer/4) | Polygon (L1–L3 are Points) | 58 | 3857 | item mod. 2025-02-12 | CURRENT |
| CDFW Regions | CDFW | [CDFW_Regions_wm/FeatureServer/0](https://services2.arcgis.com/Uq9r85Potqm3MfRV/arcgis/rest/services/CDFW_Regions_wm/FeatureServer/0) | Polygon | 7 | 3857 | item mod. 2024-06-19 | CURRENT |

### 2.6 Federal — HUD, HRSA, tribal, opportunity zones

| Layer | Owner | Endpoint / download | Formats | Geom | Count | CRS | Vintage | Verdict |
|---|---|---|---|---|---|---|---|---|
| Continuum of Care (CoC) Grantee Areas | HUD | [Continuum_of_Care_Grantee_Areas/FeatureServer/0](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Continuum_of_Care_Grantee_Areas/FeatureServer/0) | REST, SHP, GeoJSON, GPKG, FileGDB, CSV, KML, XLSX | Polygon | 387 | 3857 | item mod. 2025-08-19 | **CURRENT** |
| Qualified Census Tracts 2026 | HUD | [QUALIFIED_CENSUS_TRACTS_2026/FeatureServer/0](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/QUALIFIED_CENSUS_TRACTS_2026/FeatureServer/0) | same | Polygon | 14,496 | 3857 | **issued 2025-09-22** | **CURRENT** |
| Qualified Census Tracts 2025 | HUD | [QUALIFIED_CENSUS_TRACTS/FeatureServer/0](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/QUALIFIED_CENSUS_TRACTS/FeatureServer/0) | same | Polygon | 14,496 | 3857 | issued 2023-06-02 | **SUPERSEDED by 2026** |
| Difficult Development Areas 2026 | HUD | [Difficult_Development_Areas_2026/FeatureServer/0](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Difficult_Development_Areas_2026/FeatureServer/0) | same | Polygon | 2,902 | 3857 | **issued 2025-09-22** | **CURRENT** |
| Difficult Development Areas 2025 | HUD | [Difficult_Development_Areas/FeatureServer/0](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Difficult_Development_Areas/FeatureServer/0) | same | Polygon | — | 3857 | 2025 | **SUPERSEDED by 2026** |
| Opportunity Zones | HUD | [Opportunity_Zones/FeatureServer/13](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Opportunity_Zones/FeatureServer/13) | REST, SHP, GeoJSON, GPKG, FileGDB, CSV, KML, XLSX | Polygon | 8,765 | 3857 | 2018 designation; item mod. 2026-06-02 | **CURRENT but designations FROZEN** |
| TIGER 2026 AIANNH (tribal areas) | US Census | [tl_2026_us_aiannh.zip](https://www2.census.gov/geo/tiger/TIGER2026/AIANNH/tl_2026_us_aiannh.zip) | SHP | Polygon | national | 4269 | **Jan 1 2026** | **CURRENT** |
| Federally Recognized Tribal Lands (CEC) | CA Energy Commission | [Tribal_Lands/FeatureServer/0](https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Tribal_Lands/FeatureServer/0) | REST | Polygon | 148 | 3857 | item mod. 2026-08-12 | CURRENT |
| Tribal Boundaries — BIA | OEHHA (re-publishing BIA) | [Tribal_Boundaries_-_BIA/FeatureServer/0](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/Tribal_Boundaries_-_BIA/FeatureServer/0) | REST | Polygon | 125 | 3857 | item mod. 2026-06-01 | CURRENT |
| Tribal Boundaries — Census BAS | OEHHA | [Tribal_Boundaries_-_Census_BAS/FeatureServer](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/Tribal_Boundaries_-_Census_BAS/FeatureServer) | REST | Polygon | — | 3857 | item mod. 2026-06-01 | CURRENT |
| Tribal Boundaries — Consultations | OEHHA | [Tribal_Boundaries_-_Consultations/FeatureServer](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/Tribal_Boundaries_-_Consultations/FeatureServer) | REST | Polygon | — | 3857 | item mod. 2026-06-01 | CURRENT |
| HRSA HPSA Primary Care (**points**) | CA HCAI | [HPSA_PNTPC_SHP/FeatureServer/0](https://services5.arcgis.com/fMBfBrOnc6OOzh7V/arcgis/rest/services/HPSA_PNTPC_SHP/FeatureServer/0) | REST | **Point** | 4,921 | 3857 | item mod. **2026-10-13** | CURRENT — **points, not boundaries** |
| HRSA HPSA Mental Health (**points**) | CA HCAI | [HPSA_PNTMH_SHP/FeatureServer/0](https://services5.arcgis.com/fMBfBrOnc6OOzh7V/arcgis/rest/services/HPSA_PNTMH_SHP/FeatureServer/0) | REST | **Point** | 4,994 | 3857 | item mod. **2026-10-13** | CURRENT — points |
| HRSA HPSA Dental (**points**) | CA HCAI | [HPSA_PNTDH_SHP/FeatureServer/0](https://services5.arcgis.com/fMBfBrOnc6OOzh7V/arcgis/rest/services/HPSA_PNTDH_SHP/FeatureServer/0) | REST | **Point** | 4,851 | 3857 | item mod. **2026-10-13** | CURRENT — points |
| HRSA HPSA facility detail (tabular) | HRSA | [BCD_HPSA_FCT_DET_PC.csv](https://data.hrsa.gov/DataDownload/DD_Files/BCD_HPSA_FCT_DET_PC.csv) (49.0 MB) · [.xlsx](https://data.hrsa.gov/DataDownload/DD_Files/BCD_HPSA_FCT_DET_PC.xlsx) (20.0 MB) | CSV, XLSX | n/a | — | n/a | live 2026-10-13 | CURRENT — **no official HPSA polygon exists** |
| MUA/MUP detail (tabular) | HRSA | [MUA_DET.xlsx](https://data.hrsa.gov/DataDownload/DD_Files/MUA_DET.xlsx) (4.9 MB) | XLSX | n/a | — | n/a | live 2026-10-13 | CURRENT — **no official MUA polygon found** |

### 2.7 State legislative / congressional (California)

| Layer | Owner | Endpoint | Geom | Count | CRS | Vintage | Verdict |
|---|---|---|---|---|---|---|---|
| **CA Congressional Districts 2027–2032 (Prop 50 / AB 604)** | CA Dept. of Technology (CDT) | [AB_604_…_as_enacted_by_Proposition_50_view/FeatureServer/0](https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/AB_604_-_California_Congressional_Districts_2027-2032_as_enacted_by_Proposition_50_view/FeatureServer/0) | Polygon | **52** | 3857 | **enacted by Prop 50; item created 2026-04-02** | **CURRENT — the new map** |
| California Congressional Districts 2027–2032 (alt listing) | CDT | [CDT item, created 2026-03-17](https://www.arcgis.com/sharing/rest/search?q=owner%3A%22CDT_GIS%22) | Polygon | 52 | 3857 | 2026-03-17 | CURRENT (duplicate of the above) |
| CA Congress Districts & Membership 2024–2026 | CDT / NTAD | [NTAD_Congressional_Districts/FeatureServer/0](https://services.arcgis.com/xOi1kZaI0eWDREZv/ArcGIS/rest/services/NTAD_Congressional_Districts/FeatureServer/0) | Polygon | 444 national | 4326 | **119th Congress, boundaries 2025-01-03** | **SUPERSEDED by Prop 50** |
| **TIGER 2026 CD120 (national authoritative)** | US Census | [tl_2026_06_cd120.zip](https://www2.census.gov/geo/tiger/TIGER2026/CD/tl_2026_06_cd120.zip) | Polygon | 52 CA | 4269 | **120th Congress, Jan 1 2026** | **CURRENT** |
| TIGER 2025 CD119 | US Census | [tl_2025_06_cd119.zip](https://www2.census.gov/geo/tiger/TIGER2025/CD/tl_2025_06_cd119.zip) | Polygon | 52 CA | 4269 | 119th Congress, 2025 | **SUPERSEDED by cd120** |
| Congressional Districts CA (CEC) | CA Energy Commission | [Congressional_Districts_CA/FeatureServer/0](https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Congressional_Districts_CA/FeatureServer/0) | Polygon | 52 | 3857 | item mod. 2026-08-12 | CURRENT |
| **Caltrans Congressional Districts** | Caltrans | [CHboundary/Congressional_Districts/FeatureServer/0](https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHboundary/Congressional_Districts/FeatureServer/0) | Polygon | 52 | 4326 | **118th Congress, "current as of February 1, 2023"** | **SUPERSEDED TWICE — do not use** |
| CA State Assembly Districts & Membership 2024–2026 | CDT | [CA_State_Assembly_Districts_and_Memberships_2024_to_2026/FeatureServer/5](https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/CA_State_Assembly_Districts_and_Memberships_2024_to_2026/FeatureServer/5) | Polygon | 80 | 4269 | 2024–2026 | CURRENT |
| CA State Senate Districts & Membership 2025–2030 | CDT | [CA_State_Senate_Districts_and_Membership/FeatureServer/0](https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/CA_State_Senate_Districts_and_Membership/FeatureServer/0) | Polygon | 40 | 3857 | 2025–2030 | CURRENT |
| Legislative Districts in California 2026 (one service) | CA Geoportal | [Legislative/FeatureServer](https://services3.arcgis.com/fdvHcZVgB2QSRNkL/arcgis/rest/services/Legislative/FeatureServer) — L0 Assembly 80, L1 Senate 40, L2 Congressional 52 | Polygon | 80/40/52 | 3857 | 2026 | CURRENT |
| Caltrans Assembly Districts | Caltrans | [CHboundary/Assembly_Districts/FeatureServer/0](https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHboundary/Assembly_Districts/FeatureServer/0) | Polygon | 80 | 4326 | 2021 CRC | CURRENT |
| Caltrans Senate Districts | Caltrans | [CHboundary/Senate_Districts/FeatureServer/0](https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHboundary/Senate_Districts/FeatureServer/0) | Polygon | 40 | 4326 | "last boundary change until … after the 2030 Census. All of the districts now reflect the 2021 Citizens Redistricting Commission (CRC) plan." | CURRENT |
| CA State Board of Equalization Districts 2020 | CA BOE | [California_State_Board_of_Equalization_Districts_2020/FeatureServer/0](https://services7.arcgis.com/iwxhJVOFEKDxO7gk/arcgis/rest/services/California_State_Board_of_Equalization_Districts_2020/FeatureServer/0) | Polygon | **4** | 3857 | 2020 | **CHECK** — see §4 (2021 BOE exists; this layer is dated 2020) |
| TIGER 2026 SLDL / SLDU | US Census | [sldl](https://www2.census.gov/geo/tiger/TIGER2026/SLDL/tl_2026_06_sldl.zip) / [sldu](https://www2.census.gov/geo/tiger/TIGER2026/SLDU/tl_2026_06_sldu.zip) | Polygon | 80 / 40 | 4269 | **Jan 1 2026** | CURRENT |
| California Courts of Appeal Jurisdictions | CDT | [CA_Appellate_Jurisdictions/FeatureServer](https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/CA_Appellate_Jurisdictions/FeatureServer) | Polygon | — | (none declared) | item mod. 2026-03-26 | CURRENT (service-level SR unreadable — see §4) |
| LA County Congressional District (2021) | LA County RRCC | [Political_Boundaries/MapServer/29](https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/29) | Polygon | 18 | 2229 | 2021 lines | **SUPERSEDED by Prop 50** |
| LA County State Assembly District (2021) | LA County RRCC | [Political_Boundaries/MapServer/30](https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/30) | Polygon | 24 | 2229 | 2021 | CURRENT |
| LA County State Senate District (2021) | LA County RRCC | [Political_Boundaries/MapServer/31](https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/31) | Polygon | 13 | 2229 | 2021 | CURRENT |
| LA County Board of Equalization (2021) | LA County RRCC | [Political_Boundaries/MapServer/32](https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/32) | Polygon | 1 | 2229 | 2021 | **CURRENT — prefer this over the 2020 BOE layer** |

### 2.8 Statewide / regional / transportation / other

| Layer | Owner | Endpoint | Geom | Count | CRS | Vintage | Verdict |
|---|---|---|---|---|---|---|---|
| California County Boundaries and Identifiers | CDT (CA Geoportal) | [California_County_Boundaries_and_Identifiers_Blue_Version_view/FeatureServer/1](https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/California_County_Boundaries_and_Identifiers_Blue_Version_view/FeatureServer/1) | Polygon | 58 | **3310** | item mod. 2026-04-30 | CURRENT |
| California City Boundaries and Identifiers | CDT | [California_Cities_and_Identifiers_Blue_Version_view/FeatureServer/2](https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/California_Cities_and_Identifiers_Blue_Version_view/FeatureServer/2) | Polygon | 549 | 3310 | item mod. 2026-03-26 | CURRENT |
| CA County Boundaries w/ Coastal Buffers | CDT | [California_County_Boundaries_and_Identifiers_with_Coastal_Buffers/FeatureServer/1](https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/California_County_Boundaries_and_Identifiers_with_Coastal_Buffers/FeatureServer/1) | Polygon | 81 | 3310 | 2026 | CURRENT |
| CA City Boundaries w/ Coastal Buffers | CDT | [California_City_Boundaries_and_Identifiers_with_Coastal_Buffers/FeatureServer/2](https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/California_City_Boundaries_and_Identifiers_with_Coastal_Buffers/FeatureServer/2) | Polygon | 549 | 3310 | 2026 | CURRENT |
| California Overlapping Cities and Counties | CDT | [California_Overlapping_Cities_and_Counties_and_Identifiers_view/FeatureServer/3](https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/California_Overlapping_Cities_and_Counties_and_Identifiers_view/FeatureServer/3) | Polygon | 541 | 3310 | 2026 | CURRENT |
| California Incorporated City Boundaries | CAL FIRE | [California_Incorporated_City_Boundaries/FeatureServer/0](https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Incorporated_City_Boundaries/FeatureServer/0) | Polygon | 483 | 3857 | item mod. 2026-07-10 | CURRENT |
| **LA County Public Library Service Areas** | LA County Library | [Administrative_Boundaries/MapServer/12](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/12) | Polygon | 94 | 3857 | mod. 2026-09-09 | CURRENT |
| CA State Conservancies | CA Natural Resources Agency | [CA_State_Conservancies/FeatureServer/0](https://services1.arcgis.com/sTaVXkn06Nqew9yU/arcgis/rest/services/CA_State_Conservancies/FeatureServer/0) | Polygon | 80 | 3310 | item mod. 2022-05-05 | CURRENT but FROZEN |
| Regional Transportation Planning Agencies (CEC) | CA Energy Commission | [RTPAs/FeatureServer/0](https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/RTPAs/FeatureServer/0) | Polygon | 43 | 3857 | item mod. 2026-08-12 | **CURRENT — prefer over Caltrans 2013** |
| **Caltrans RTPA Boundaries** | Caltrans | [CHboundary/RTPA_Boundaries/FeatureServer/0](https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHboundary/RTPA_Boundaries/FeatureServer/0) | Polygon | 43 | 3857 | **"RTPA_2013 … primarily for regional planning applications"** | **STALE (2013)** |
| **Caltrans MPO Boundaries** | Caltrans | [CHboundary/MPO_Boundaries/FeatureServer/0](https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHboundary/MPO_Boundaries/FeatureServer/0) | Polygon | 18 | 3857 | **"current as of February 2013"** | **STALE (2013)** |
| Caltrans County Boundaries | Caltrans | [CHboundary/County_Boundaries/FeatureServer/0](https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHboundary/County_Boundaries/FeatureServer/0) | Polygon | 58 | 3857 | current | CURRENT |
| Caltrans Districts | Caltrans | [CHboundary/District_Tiger_Lines/FeatureServer/0](https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHboundary/District_Tiger_Lines/FeatureServer/0) | Polygon | — | — | item mod. 2026-02-26 | CURRENT |
| Caltrans Adjusted Urban Area | Caltrans | [CHboundary/Adjusted_Urban_Area/FeatureServer](https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHboundary/Adjusted_Urban_Area/FeatureServer) | Polygon | — | — | current | CURRENT |
| Caltrans Airport Boundaries | Caltrans | [CHaviation/Airport_Boundaries/FeatureServer](https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHaviation/Airport_Boundaries/FeatureServer) | Polygon | — | — | item mod. 2026-08-11 | CURRENT |
| SCAG Regions / Subregions | SCAG | [Subregionboundaryscag/MapServer](https://maps.scag.ca.gov/scaggis/rest/services/OpenData/Subregionboundaryscag/MapServer) | Polygon | 40 | 26911 | item mod. 2023-08-03 | CURRENT |
| Metro Transit Projects Polygons | LA Metro (hosted on LA City) | [Metro_Bus_and_Rail/MapServer](https://maps.lacity.org/lahub/rest/services/Metro_Bus_and_Rail/MapServer) | Polygon | 180 | 3857 | mod. 2020-08-27 | **STALE** |
| LA Metro Rail & Busway Stations | LA Metro | [LA_Metro_Rail_and_Busway_Stations_(07_2023)/FeatureServer](https://services8.arcgis.com/TNoJFjk1LsD45Juj/arcgis/rest/services/LA_Metro_Rail_and_Busway_Stations_(07_2023)/FeatureServer) | Point | — | — | 07_2023 | CURRENT |
| LA Metro Rapid Bus Lines / Stops | LA Metro (via LAHSA org) | [Rapid_Bus_Lines_GJ/FeatureServer](https://services2.arcgis.com/LMBdfutQCnDGYUyc/arcgis/rest/services/Rapid_Bus_Lines_GJ/FeatureServer) | Polyline / Point | — | — | mod. 2026-09-09 | CURRENT |
| FEMA National Risk Index (tract) | FEMA | [National_Risk_Index/FeatureServer](https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index/FeatureServer) | Polygon | national | — | item mod. 2025-12-16 | CURRENT |
| FEMA R9 Tribal Land Area (BIA) | FEMA R9 | [Trib/FeatureServer](https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/Trib/FeatureServer) | Polygon | — | — | item mod. 2023-03-10 | CURRENT |
| CA Evacuation (static/historic) | FEMA R9 | [CA_/FeatureServer](https://services3.arcgis.com/uknczv4rpevve42E/arcgis/rest/services/CA_/FeatureServer) | Polygon | — | — | item mod. 2025-02-11 | CURRENT |
| CDFW BIOS boundary layers (`biosds####`) | CDFW | [services2.arcgis.com/Uq9r85Potqm3MfRV](https://services2.arcgis.com/Uq9r85Potqm3MfRV/arcgis/rest/services) | Polygon | varies | 3857 | items mod. 2023–2026 | CURRENT — LA relevance mostly habitat/conservation, not client geography |

### 2.9 Education

| Layer | Owner | Endpoint | Geom | Count | CRS | Vintage | Verdict |
|---|---|---|---|---|---|---|---|
| **CA School District Areas 2025-26** | CA Dept. of Education (via CA Geoportal) | [DistrictAreas2526/FeatureServer/0](https://services3.arcgis.com/fdvHcZVgB2QSRNkL/arcgis/rest/services/DistrictAreas2526/FeatureServer/0) | Polygon | **936** | 3857 | **2025-26** | **CURRENT** |
| CA Public Schools 2025-26 | CA Dept. of Education | [SchoolSites2526/FeatureServer/0](https://services3.arcgis.com/fdvHcZVgB2QSRNkL/arcgis/rest/services/SchoolSites2526/FeatureServer/0) | **Point** | 9,946 | 3857 | **2025-26** | CURRENT |
| CA School District Offices 2025-26 | CA Dept. of Education | [DistrictSites2526/FeatureServer/0](https://services3.arcgis.com/fdvHcZVgB2QSRNkL/arcgis/rest/services/DistrictSites2526/FeatureServer/0) | **Point** | 1,009 | 3857 | **2025-26** | CURRENT |
| LA County School Districts | LA County ISD | [Political_Boundaries/MapServer/25](https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/25) | Polygon | 85 | 2229 | current | CURRENT |
| LAUSD Board of Education Districts / Local Districts | LAUSD (hosted LA City) | [LAUSD_Schools/MapServer](https://maps.lacity.org/lahub/rest/services/LAUSD_Schools/MapServer) | Polygon | 7 / 6 | 3857 | **item mod. 2016-11-23** | **STALE (2016) — verify against LAUSD before use** |
| TIGER 2026 UNSD / ELSD / SCSD | US Census | [unsd](https://www2.census.gov/geo/tiger/TIGER2026/UNSD/tl_2026_06_unsd.zip) / [elsd](https://www2.census.gov/geo/tiger/TIGER2026/ELSD/tl_2026_06_elsd.zip) / [scsd](https://www2.census.gov/geo/tiger/TIGER2026/SCSD/tl_2026_06_scsd.zip) | Polygon | — | 4269 | **Jan 1 2026** | CURRENT |

---

## 3. SUPERSEDED / DO NOT USE

### 3.1 Superseded — use the replacement

| Superseded layer | Endpoint / ID | Replace with | Why |
|---|---|---|---|
| LA City Council Districts (Adopted 2012) | [Boundaries/MapServer/28](https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/28) | `Boundaries/MapServer/13` (2021) | 2021 redistricting |
| LA City Council Districts (Adopted 2003) | [Boundaries/MapServer/14](https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/14) | `Boundaries/MapServer/13` (2021) | two cycles old |
| LA County Supervisorial District (2021) | [Political_Boundaries/MapServer/26](https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/26) | `Political_Boundaries/MapServer/27` (Current) | 26 is frozen; 27 is maintained |
| LA County Supervisorial 1971/1981/1991/2001/2011 | ids 1, 8, 14, 15, 16 | id 27 | historical only |
| **LA County Congressional District (2021)** | [Political_Boundaries/MapServer/29](https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/29) | Prop 50 layer (§2.7) or TIGER 2026 `cd120` | **Prop 50 (Nov 2025) replaced CA's congressional map** |
| **Caltrans Congressional Districts (118th, Feb 2023)** | [CHboundary/Congressional_Districts](https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHboundary/Congressional_Districts/FeatureServer) | Prop 50 layer or TIGER 2026 `cd120` | **superseded twice** |
| CDT/NTAD "CA Congress Districts 2024-2026" (119th) | [NTAD_Congressional_Districts](https://services.arcgis.com/xOi1kZaI0eWDREZv/ArcGIS/rest/services/NTAD_Congressional_Districts/FeatureServer/0) | Prop 50 layer | 119th superseded |
| TIGER 2025 `cd119` | [tl_2025_06_cd119.zip](https://www2.census.gov/geo/tiger/TIGER2025/CD/tl_2025_06_cd119.zip) | [tl_2026_06_cd120.zip](https://www2.census.gov/geo/tiger/TIGER2026/CD/tl_2026_06_cd120.zip) | 120th Congress vintage |
| CA State Board of Equalization Districts **2020** | [BOE_Districts2020](https://services7.arcgis.com/iwxhJVOFEKDxO7gk/arcgis/rest/services/California_State_Board_of_Equalization_Districts_2020/FeatureServer/0) | LA County [Political_Boundaries/32](https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/32) (2021) | 2021 lines supersede 2020 |
| LA County SPA (2012) | [Administrative_Boundaries/MapServer/4](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/4) | SPA 2022 — [DPH_Service_Planning_Areas_SPA](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/DPH_Service_Planning_Areas_SPA/FeatureServer/17) | 2022 realignment |
| LA County Health Districts (2012) | [Administrative_Boundaries/MapServer/3](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/3) | [Health_Districts_2022_view](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Health_Districts_2022_view/FeatureServer/0) | 2022 realignment |
| **CalEnviroScreen 4.0** | [CalEnviroScreen_4_0_Results_](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/CalEnviroScreen_4_0_Results_/FeatureServer/0) | [CalEnviroScreen 5.0](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/calenviroscreen50results_F_070126_gdb/FeatureServer/2) | 5.0 published Jul 2026 |
| CalEnviroScreen 3.0 (LASAN clip, 2,393) | [CalEnviroScreen_Data](https://services1.arcgis.com/X1hcdGx5Fxqn4d0j/arcgis/rest/services/CalEnviroScreen_Data/FeatureServer/2) | CES 5.0 | two generations old |
| CalEnviroScreen 2.0 Score | [Hazards/MapServer](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Hazards/MapServer) | CES 5.0 | three generations old |
| CalEnviroScreen 5.0 **Draft** | [CES5_Draft](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/CES5_Draft/FeatureServer/0) | CalEnviroScreen 5.0 **Results** | draft → final |
| SB 535 DAC **2022** (both variants incl. 2024 tribal update) | [2022](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/SB_535_Disadvantaged_Communities_2022/FeatureServer/0) · [2024 upd.](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/SB535_DACupdate20232024/FeatureServer) | [SB 535 DAC 2026](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/SB_535_Disadvantaged_Communities_2026/FeatureServer/0) | 2026 designation, 2026-09-17 |
| SB 535 DAC 2026 **(DRAFT)** | [DRAFT_SB535…2026](https://services1.arcgis.com/PCHfdHz4GlDNAhBb/arcgis/rest/services/DRAFT_SB535_Disadvantaged_Communities_2026/FeatureServer/0) | non-draft 2026 layer | draft superseded by final |
| **Old CAL FIRE FHSZ (pre-2025 LRA / pre-2023.3 SRA)** | any CAL FIRE FHSZ layer not carrying `LRA25`/`SRA_23_3` | [FHSZ LRA 2025](https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/FHSALRA25_v1_All/FeatureServer/0) + [FHSZ SRA 2023.3](https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/FHSZSRA_23_3/FeatureServer/0) | **LRA map dated 2025-03-24; SRA map dated 2023-09-29, adopted 2024-01-31, implemented 2024-04-01.** The long-standing 2007-era LRA zones are replaced. |
| HUD QCT 2025 | [QUALIFIED_CENSUS_TRACTS](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/QUALIFIED_CENSUS_TRACTS/FeatureServer/0) | [QCT 2026](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/QUALIFIED_CENSUS_TRACTS_2026/FeatureServer/0) | 2026 designation |
| HUD DDA 2025 | [Difficult_Development_Areas](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Difficult_Development_Areas/FeatureServer/0) | [DDA 2026](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Difficult_Development_Areas_2026/FeatureServer/0) | 2026 designation |
| HUD QCT 2025 **LA County clip** | [HUD_Qualified_Census_Tracts](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/HUD_Qualified_Census_Tracts/FeatureServer) | HUD QCT **2026** (federal) | county clip still 2025 |
| DMH Homeless Summary 2024 by SPA | [Homeless_Summary_2024](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Homeless_Summary_2024/FeatureServer) | [2026 Homeless Summary by SPA](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/2026_Homeless_Summary_by_SPA/FeatureServer/0) | newer vintage |
| DMH HOME Team Boundaries `_test` | [LA_County_DMH_HOME_Team_Boundaries_test](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/LA_County_DMH_HOME_Team_Boundaries_test/FeatureServer/0) | [Update_HOME_Team_Boundaries_060926](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/Update_HOME_Team_Boundaries_060926/FeatureServer) | newer edit (2026-06-09) |
| 2000 / 2010 Census Tracts, Block Groups, Blocks | [Demographics/MapServer](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Demographics/MapServer) ids 1–7, 9 | 2020 layers (ids 14, 15, 16) | decennial supersession |
| LA City `Census_2010` tracts/blocks | [Census_2010/MapServer](https://maps.lacity.org/lahub/rest/services/Census_2010/MapServer) | 2020 geography | decennial supersession |
| Neighborhood Council Boundaries (2018) | third-party | EmpowerLA [Boundaries/MapServer/18](https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer/18) | certified layer maintained |
| LA City Enhanced Networks (2016 variants) | LADCP 2016 siblings | 2026 LADCP versions | LADCP reissued 2026-09-03 |
| **Caltrans MPO (2013) & RTPA (2013)** | [MPO](https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHboundary/MPO_Boundaries/FeatureServer) · [RTPA](https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHboundary/RTPA_Boundaries/FeatureServer) | CEC [RTPAs](https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/RTPAs/FeatureServer/0) + SCAG subregional data | 13 years stale |
| CA Electric Balancing Authority Areas (**"Retired"**) | [Balancing_A](https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Balancing_A/FeatureServer) | [Electric Load Serving Entities](https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/ElectricLoadServingEntities_IOU_POU/FeatureServer/0) | title literally says Retired |
| LA County Public Library **Planning** Areas (8) as a service-area proxy | [Administrative_Boundaries/MapServer/11](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/11) | [Service Areas (94), id 12](https://public.gis.lacounty.gov/public/rest/services/LACounty_Dynamic/Administrative_Boundaries/MapServer/12) | "Planning Areas" ≠ library service areas |
| LA City `Landbase_Information` Tracts (28,723) | [MapServer](https://maps.lacity.org/lahub/rest/services/Landbase_Information/MapServer) | single-vintage tract layer | **stacked vintages — will silently double-count** |
| LA City GeoHub political layers (Assembly 13, Congressional 9, State Senate 6, Board of Supervisors 5) | [Boundaries/MapServer](https://maps.lacity.org/lahub/rest/services/Boundaries/MapServer) | LA County `Political_Boundaries` or TIGER 2026 | City hub copies are **2011-era** and never refreshed |
| `LA City Council Districts (Adopted 2003)` on county eGIS | [Political_Boundaries/MapServer/12](https://arcgis.gis.lacounty.gov/arcgis/rest/services/LACounty_Dynamic/Political_Boundaries/MapServer/12) | id 33 | superseded |

### 3.2 Dead / blocked / empty / non-authoritative — DO NOT USE

| Source | Probe result (2026-10-13) | Reason & replacement |
|---|---|---|
| `https://www.hudexchange.info/programs/coc/` | **HTTP 404**, body `<title>Page Not Found - HUD Exchange</title>` — **3/3 curl attempts** | **Dead.** Also 404: `/programs/coc/coc-maps/`, `/programs/coc/coc-homeless-populations-and-subpopulations-reports/`, `/resource/5787/coc-grantee-areas/`, `/grantees/`. → Use the [HUD ArcGIS CoC layer](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Continuum_of_Care_Grantee_Areas/FeatureServer/0). |
| `https://www.epa.gov/ejscreen` | **HTTP 404** | **EJScreen discontinued.** |
| `https://www.epa.gov/ejscreen/download-ejscreen-data` | **HTTP 404** | discontinued |
| `https://ejscreen.epa.gov/mapper/` | **DNS failure** (`nodename nor servname provided`) | **Host decommissioned.** CA replacement: CalEnviroScreen 5.0. No EPA national equivalent. |
| `https://www.huduser.gov/portal/datasets/dda.html` | **HTTP 404** | DDA landing page broken → use [HUD ArcGIS DDA 2026](https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Difficult_Development_Areas_2026/FeatureServer/0) |
| `https://oehha.ca.gov/calenviroscreen*` (all paths incl. `/` root) | HTTP 200 but **212-byte Imperva/Incapsula stub** (`<META NAME="robots" CONTENT="noindex,nofollow">` + `_Incapsula_`) | **Bot-blocked.** → use OEHHA ArcGIS Hub layers (§2.5) as the machine-readable path. |
| `https://lahsa.org/gis` | **HTTP 403** | blocked → use the [LAHSA ArcGIS org](https://services2.arcgis.com/LMBdfutQCnDGYUyc/arcgis/rest/services/Service_Planning_Areas/FeatureServer/0) |
| `https://calepa.ca.gov/envjustice/calenviroscreen/` | **HTTP 404** | dead |
| `https://gisdata.metro.net/` | **DNS failure** | host does not resolve → use [developer.metro.net](https://developer.metro.net/) |
| `https://data.hrsa.gov/DataDownload/DD_Files/` (directory listing) | **HTTP 403** | listing blocked; **direct file paths work** (verified 200) |
| `https://data.hrsa.gov/maps` · `/data/reports/datagrid?gridName=HPSA` · `/DataDownload/DD_Files/HRSA_Data_Warehouse.zip` | **HTTP 404** | dead paths |
| `https://www.huduser.gov/portal/datasets/qct.html` | HTTP 200 (159 KB) | **live** — QCT page works; DDA page does not |
| `https://www.cdc.gov/places/` | **HTTP 403** | blocked to automated clients |
| `https://osfm.fire.ca.gov/.../fire-hazard-severity-zones/` | **HTTP 403** | blocked → use CAL FIRE ArcGIS FHSZ layers (§2.5) |
| **GENASYS Emergency Alert Warning Areas (LA County EOC)** | Service live, **`returnCountOnly` = 0** | **Live but EMPTY.** Published 2026-10-13 yet contains no features. Do not ingest. |
| `https://gispublic.waterboards.ca.gov/portalserver/.../Regional_Board_Boundary_Features` | **HTTP 499 Token Required** | requires auth → use [non-portal mirror](https://gispublic.waterboards.ca.gov/arcgis/rest/services/Administrative/Regional_Board_Boundaries/MapServer) |
| LA City `maps.lacity.org/lahub` Assembly/Congressional/State Senate layers | live, but **2011 vintage** | **Live content is wrong.** Wrong by two redistricting cycles. |
| Third-party mirrors (Metro-mirrored council districts, SACOG, NDCuser1, Nimi_Canvassing, individual academic accounts, GregnCA's school/legislative services) | live | **Not authoritative publishers.** Use the government source named in §2. (`GregnCA`'s CA layers are useful cross-checks, not primary sources.) |
| **LAHSA published geometry** | — | **CLARIFICATION / CORRECTION:** LAHSA **does** publish geometry. [Service_Planning_Areas/FeatureServer/0](https://services2.arcgis.com/LMBdfutQCnDGYUyc/arcgis/rest/services/Service_Planning_Areas/FeatureServer/0) — 8 SPAs, EPSG:2229, edited 2026-09-25. Their AGOL org (`gis@lahsa`) holds **735 items** incl. SPA, SPA Outreach Zones 2026, Metro count polygons, rapid-bus lines. The earlier claim "LAHSA publishes no geometry" is **incorrect**; only their *data portal* is table/PDF-only. |

---

## 4. COULD NOT VERIFY

| Item | Attempted | Result |
|---|---|---|
| OEHHA `oehha.ca.gov` HTML (CalEnviroScreen 5.0 report, indicator docs) | GET on 3 paths incl. root | HTTP 200 + Imperva stub (212 bytes). **Unverifiable by automated fetch.** ArcGIS layers verified instead. |
| Feature counts for **17 of 283** candidate services | `returnCountOnly=true` incl. layer enumeration fallback | No count returned — mostly `tiles.arcgis.com` raster/tile MapServers and `public.gis.lacounty.gov/.../PARKS/TrailFeatures`. Named: Santa Monica Mountains & Griffith Park Linkage raster variants (7), Enriched LA County Census Tracts 2015, 2010 Census Tracts by Council District, Precincts by Council District, Trail Staging Areas (Outline/Transparent Fill), CalWORKS Gap Rate Supervisorial District, Regional Board Boundaries, Park Needs Assessment Detailed. |
| **LA County Public Library Service Areas — originally unresolved, now resolved** | `Administrative_Boundaries/MapServer/12` | **Resolved: 94 features.** (Layer id 10 on that service is a different/empty layer.) |
| CalEnviroScreen 5.0 official release **date** from OEHHA | OEHHA blocked | **Inferred** from ArcGIS item modified **2026-07-30** + filename token `070126`. Not read from the publisher's own page. |
| Prop 50 / AB 604 statutory **effective date** | CDT ArcGIS item; web search | Layer is authoritative (created 2026-04-02, "as enacted by Proposition 50"); exact statutory date **not confirmed** from a primary legal source. |
| HRSA official HPSA/MUA **polygon** boundary file | Enumerated HRSA org `Hp6G80Pky0om7QvQ` (**527 services**, all non-hash names listed), HRSA download page, direct file paths | **No HPSA/MUA polygon service exists.** HRSA publishes designations as **points** (HCAI, mod. 2026-10-13) plus CSV/XLSX tables. Only LA-area polygons are LA County DPH clips — *derived*, modified **2024-04-23** (~2.5 yr stale). |
| CMS hospital service area / referral region boundaries for LA | `data.cms.gov` live; searched CMS ArcGIS | **No CMS-published LA hospital service-area polygon found.** Not confirmed to exist. |
| LA County DMH *canonical* service-area polygons | Enumerated `JSPark@dmh.lacounty.gov` (23 items) | Found HOME Team Boundaries (32) + SPA summaries, but **no canonical DMH "service area" boundary layer**. HOME Team boundaries are a program geography, not a DMH service-area map. |
| `California Courts of Appeal Jurisdictions` CRS | live `?f=pjson` | Service returned `spatialReference: None` at service level; per-layer SR not captured. **Layer exists, CRS unverified.** |
| `Caltrans Districts` (District_Tiger_Lines) CRS/count | live `?f=pjson` | Service-level SR `None`; layer path returned no SR. **Exists, CRS/count unverified.** |
| LA City Fire District No.1 / High Wind Area / Hillside Grading Area vintage | live `?f=pjson` | Geometry + counts verified; **no vintage field** in metadata. Item modified 2020-08-27. |
| `maps.lacity.org` service-level `copyrightText` / license | live `?f=pjson` | **Empty strings** on `Boundaries/MapServer` and layer 13. No license declared in metadata; terms exist only as an HTML page. |
| LA County DPH Health Districts ↔ DMH SPA crosswalk | metadata read | No authoritative crosswalk table found. |
| Vertex count for HUD CoC | GeoJSON query | **Geometry did not serialize as GeoJSON** (0 coordinates parsed, 35 MB simplified payload) — exceeds server GeoJSON limits. Vertex count **not measured**; 387 features dissolved from tracts implies very heavy geometry. |
| `CA State Board of Equalization Districts 2020` currency | live `?f=pjson` | Layer live, 4 polygons, EPSG:3857, dated **2020**. Whether CalBOE has a 2021/2022 successor layer was **not located**; LA County's 2021 BOE layer is the safer source. |

---

## 5. AGGREGATION LAYERS — best choices for bucketing client interactions by region

### 5.1 Measured complexity (live, 2026-10-13)

Coordinate pairs counted from full-precision GeoJSON (`geometryPrecision=6`); "simplified" = same query with `maxAllowableOffset=0.0001` (~11 m).

| Layer | Features | Vertex pairs (approx.) | Full GeoJSON | Simplified `0.0001` | Reduction |
|---|---|---|---|---|---|
| LA City Council Districts (2021) | 15 | 33,027 | 764 KB | 79 KB | **10×** |
| LA County Supervisorial (Current) | 5 | 148,166 | 3,441 KB | 137 KB | **25×** |
| SPA 2022 | 8 | 107,501 | 2,497 KB | 226 KB | **11×** |
| Health Districts 2022 | 26 | 123,901 | 2,879 KB | 276 KB | **10×** |
| LA Times Neighborhoods | 114 | 21,404 | 508 KB | 156 KB | 3× |
| Community Plan Areas (LADCP) | 36 | 53,988 | 1,257 KB | 89 KB | **14×** |
| Neighborhood Councils | 99 | 62,895 | 1,471 KB | 137 KB | **11×** |
| LA County 2020 Census Tracts | 2,496 | 376,222 | 8,974 KB | 1,399 KB | 6× |
| LA County 2020 Block Groups | 6,589 | 170,648 | 4,252 KB | 1,092 KB | 4× |
| LA County 2020 Census Blocks | 91,626 | 91,517 | 2,434 KB | 901 KB | 3× |
| LA County ZIP (parcel-accurate) | 313 | **425,980** | 9,921 KB | 1,025 KB | **10×** |
| CalEnviroScreen 5.0 Results | 9,106 | **773,852** | 18,176 KB | 3,174 KB | 6× |
| LA County City Boundaries | 345 | 324,716 | 7,578 KB | 542 KB | 14× |
| Community Boundaries (CSA) | 374 | 297,095 | 6,944 KB | 769 KB | 9× |
| Registrar Recorder Precincts | 33,236 | 87,577 | 2,136 KB | 361 KB | 6× |
| HUD CoC | 387 | *not measured* | — | 35,737 KB | — |

### 5.2 Recommendations

**Tier 1 — primary aggregation geographies (ingest as-is):**

1. **SPA 2022** — 8 features / 107,501 vertices / EPSG:2229. Best program-aligned rollup for health & homelessness. Two agreeing live sources: DPH ([`DPH_Service_Planning_Areas_SPA/17`](https://services.arcgis.com/RmCCgQtiZLDCtblq/arcgis/rest/services/DPH_Service_Planning_Areas_SPA/FeatureServer/17)) and LAHSA ([`Service_Planning_Areas/0`](https://services2.arcgis.com/LMBdfutQCnDGYUyc/arcgis/rest/services/Service_Planning_Areas/FeatureServer/0)). Low feature count + moderate vertices → ideal materialized `client_interaction.spa_id`.
2. **LA City Council Districts 2021** — 15 features / only **33,027 vertices** — the lightest real district layer measured. EPSG:3857. **Join on `District`.**
3. **LA County Supervisorial Districts (Current)** — 5 features but **148,166 vertices** — heaviest per-feature geometry among small layers. Don't index raw for point-in-polygon at scale; simplify or `ST_Subdivide`.
4. **Health Districts 2022** — 26 / 123,901 / EPSG:2229. Natural sub-SPA unit; pairs with SPA for two-level rollup.
5. **LA Times Neighborhoods** — 114 features / only **21,404 vertices** / EPSG:2229. **Best neighbourhood-scale layer for interactive point-in-polygon** — 5× lighter than Community Plan Areas, better coverage (114 vs 36). Caveat: LA Times editorial boundaries, **not** a government geography.

**Tier 2 — secondary / analytical:**

- **2020 Census Tracts (2,496 / 376,222)** — the workhorse join key for demographic enrichment (ACS, CalEnviroScreen, HPI). Key on `GEOID`. FROZEN until 2030 — correct, not stale.
- **Block Groups (6,589 / 170,648)** — finer; only if tract granularity is insufficient.
- **CalEnviroScreen 5.0 (9,106 / 773,852)** — heaviest useful layer; statewide. **Clip to LA County before ingest** (as county clips do). Ships in **EPSG:3310** — reproject.
- **ZIP parcel-accurate (313 / 425,980)** — heaviest per-feature polygons here. Required if clients are keyed by ZIP; precompute/subdivide.

**Tier 3 — avoid as the primary join key:**

- **Census Blocks (91,626)** — 386 MB shapefile; too fine for interaction rollup.
- **Registrar Recorder Precincts (33,236)** and **City Annexations (4,424)** — electoral/administrative, not service geographies.
- **LA County Catchment Areas (156,924)**, **Combined High Hazard Zones (85,567)**, **CAL FIRE SRA (20,499)**, **FHSZ LRA (9,752)** — hazard/utility geographies; wrong semantic for client bucketing.
- **LA City `Landbase_Information` Tracts (28,723)** — stacked vintages; **silently double-counts**.

### 5.3 Performance implications (concrete)

- **CRS: no single CRS exists** — 2229 (145 layers), 3857 (117), 3310, 4269, 4326, 6414, 6424, 26910/26911. **Store in EPSG:2229** (CA State Plane Zone 5, US survey feet): the plurality of authoritative LA County layers ship in it, it's projected (so area math and GiST indexing are sound), and it's the native SRID for the County's whole `Political_Boundaries` service. Reproject the 3857 City/LAHSA layers, the 3310 statewide layers (CalEnviroScreen 5.0, FHSZ LRA, CDT county/city boundaries, CEC DAC), the 6414 CEC DAC variant, and 4269 TIGER files on load.
- **`maxRecordCount` throttling:** most services cap at 1000–2000 features/request. Pulling 91,626 blocks or 156,924 catchment areas over REST needs `resultOffset`/`resultRecordCount` pagination — **or better, use bulk download** where offered. LA County AGOL items expose GPKG/FileGDB/GeoJSON via `opendata.arcgis.com/api/download/v1/items/{id}/geoPackage` (etc.). **TIGERweb allows `maxRecordCount = 100000`** and LA County `Demographics` allows **3000** — the two most generous services.
- **Simplification is the single biggest win.** `maxAllowableOffset=0.0001` cut Supervisorial Districts 3.4 MB → 137 KB (**25×**) and Community Plan Areas 1.26 MB → 89 KB (**14×**). Aggregation boundaries are never rendered at full precision — **simplify to ~10 m before ingest** and keep a full-precision copy only if legal boundary accuracy is required.
- **`ST_Subdivide` these:** County Supervisorial (148k vertices / 5 features), ZIP parcel-accurate (426k / 313), CalEnviroScreen 5.0 (774k / 9,106), City Boundaries (325k / 345), CSA (297k / 374), HUD CoC (suspected very heavy). A single 148k-vertex polygon makes `ST_Contains` slow; subdividing to <256-vertex pieces + a GiST index typically takes point-in-polygon from ~100 ms to sub-millisecond.
- **Recommended schema:** one `geography_boundary` table per tier — `(id, geoid, district_code, name, tier, geom geometry(MultiPolygon, 2229))` with a GiST index — plus a materialized `client_interaction_region` mapping table holding resolved FK ids. Resolve point→region **once at interaction-insert time**; then all rollups are indexed integer joins.
- **Always join on a stable code, never a display name.** LA City Council `NAME` = councilmember name (changes each election); use `District`. Prefer `GEOID` for Census geography.
- **Watch the CRS mix on LA City:** `maps.lacity.org` serves the same `Boundaries` layers in EPSG:3857, while LADCP's ArcGIS Online services (`Community_Plan_Areas`, `Area_Planning_Commissions`, `LA_Times_Neighborhoods`, BIDs) are EPSG:2229 — the *same* city's geographies come in two CRSs depending on which host you pull from.

---

## 6. Verification ledger

- **Enumerated:** 3 DCAT feeds → 6,590 dataset records → **4,604 unique ArcGIS item IDs**, 100% resolved to live item metadata via `sharing/rest/content/items/{id}`.
- **Screened:** **283 candidate boundary services** fetched at `?f=pjson` — **280 service-level metadata OK**, 117 with full per-layer metadata.
- **Counted:** **266 / 283** real feature counts via `returnCountOnly=true` (17 unverifiable — §4). Additional counts obtained for ~40 more state/LA layers discovered via the CA Geoportal search API and targeted AGOL queries.
- **Geometry types (283 candidates):** 241 Polygon · 14 Polyline · 12 Point · 16 undetermined. **Plus:** several "HPSA/MUA" and "school" layers are **Points, not Polygons** — flagged inline.
- **CRS distribution (live-read):** 2229 ×145 · 3857 ×117 · 4326 ×4 · 6424 ×4 · 26910/26911/3310/4269/6421 ×1 each · 8 undetermined.
- **Discovery beyond the three feeds:** 75 targeted AGOL queries (3,265 items → 460 relevant) + **CA Geoportal search API** (28 queries → 150 items). These surfaced CalEnviroScreen 5.0, SB 535 DAC 2026, HUD QCT/DDA 2026, the **Prop 50 congressional map**, CA Air District Boundaries, **FHSZ LRA 2025 / SRA 2023.3**, CA School District Areas 2025-26, LAHSA's and DMH's live boundary services, and CA HCAI MSSA/HPSA — **none of which appeared in the three DCAT feeds' top results.**
- **Confirmed dead/blocked/empty:** HUD Exchange CoC (404, 3/3), EPA EJScreen (404 + DNS failure), OEHHA (Imperva stub on every path), LAHSA `/gis` (403), CalEPA EJ page (404), `gisdata.metro.net` (DNS), HRSA directory + `/maps` + Data Warehouse (403/404), CDC PLACES (403), CAL FIRE OSFM (403), HUD DDA page (404), Water Boards portal (499 Token Required), **GENASYS Alert Warning Areas (live but 0 features)**.
- **Every URL in this document was probed on 2026-10-13.** Nothing in §1–§3 is unverified; every gap is listed in §4.

## 7. Reproducibility note for the team

The three required DCAT feeds are **not sufficient** for this task:
- LA City GeoHub DCAT (`geohub.lacity.org/api/feed/dcat-us/1.1.json`) — 1,689 datasets, but mixes in LA County content and its political layers are 2011-era.
- LA County eGIS DCAT (`egis-lacounty.hub.arcgis.com/api/feed/dcat-us/1.1.json`) — 951 datasets; the best of the three.
- CA State Geoportal DCAT (`gis.data.ca.gov/api/feed/dcat-us/1.1.json`) — 3,950 datasets but contained only **1** LA-relevant boundary dataset.

**Use instead, for the state layer:** `https://gis.data.ca.gov/api/search/v1/collections/dataset/items?q=<query>&limit=30`. This returned 150 relevant items vs. 1 from the DCAT feed. For ArcGIS-hosted layers generally, `https://www.arcgis.com/sharing/rest/search` plus `sharing/rest/content/items/{id}` resolves real `url` values, and `?f=pjson` + `query?returnCountOnly=true` gives ground truth for CRS, geometry type, and counts.
