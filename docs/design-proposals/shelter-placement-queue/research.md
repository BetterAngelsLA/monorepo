# Research: Shelter Eligibility & Coordinated Entry Standards

## National Framework: HUD Coordinated Entry

All Continuums of Care (CoCs) receiving federal funding must implement a Coordinated Entry (CE) system per [HUD Notice CPD-17-01](https://www.hud.gov/sites/documents/17-01cpdn.pdf). The four core elements:

1. **Access** — Population-specific access points (adult, family, youth, survivors)
2. **Assessment** — Standardized tool to evaluate vulnerability and needs
3. **Prioritization** — Most vulnerable served first, regardless of entry point
4. **Referral** — Matched to appropriate housing/shelter based on assessment

Key assessment tools used nationally: VI-SPDAT (Vulnerability Index - Service Prioritization Decision Assistance Tool), Next Step Tool, and locally-developed assessments.

---

## Los Angeles (LAHSA CES)

The Better Angels system already models LA's shelter criteria comprehensively. See `shelters/enums.py` for the complete list.

**LA Coordinated Entry structure:**
- Adult CES, Family CES, Youth CES (TAY) — separate tracks
- VI-SPDAT assessment for prioritization
- "By-name" database of homeless individuals
- SPA-level (Service Planning Area) geographic organization
- Shelter acceptance criteria captured in the app: demographics, special situations, accessibility, entry requirements, pets, parking, storage, referral type, medical needs, shelter type, program type, vaccination requirements

**What's already in the system:** 15 enums covering demographics, special situations, accessibility, entry requirements, pets, parking, storage, shelter types, room styles, vaccination, programs, referral requirements, exit policies, medical needs, funders.

---

## San Francisco (HSH CES)

**Structure:**
- Access Points by subpopulation: Adult (18+), Family (with minors), TAY (18-24), Survivors (DV/violence)
- Population-specific primary assessments (not one-size-fits-all)
- Centralized "One System" data platform
- Formal Prioritization Memo defining Housing Referral Status tiers
- Coordinated Entry Written Standards (adopted 2023)

**Assessment dimensions (from SF Adult/Youth Housing Primary Assessment):**
- Housing history and homelessness duration
- Disability and chronic health conditions
- Substance use and mental health
- Domestic violence / trauma history
- Criminal justice involvement
- Income and benefits
- Risk of harm (age, medical conditions, weather exposure)

**Prioritization (from HSH Prioritization Memo, June 2026):**
- Housing Referral Status determined by composite vulnerability score
- Permanent Supportive Housing (PSH) and Rapid Rehousing (RRH) referrals based on score thresholds
- Transparent, published prioritization methodology

---

## New York City (DHS)

**Structure:**
- Separate systems for families and single adults
- DHS intake centers for immediate shelter access
- Right-to-shelter mandate (unique to NYC)
- Homebase program for prevention
- Street outreach via Joint Command Center

**Assessment dimensions:**
- Length of homelessness
- Disability status
- Veteran status
- Domestic violence
- Chronic health conditions
- Family composition and ages of children

---

## Common Patterns Across All Cities

| Dimension | LA | SF | NYC |
|---|---|---|---|
| Population segmentation | ✅ Adult/Family/Youth | ✅ Adult/Family/TAY/Survivor | ✅ Family/Single Adult |
| Vulnerability-based prioritization | ✅ VI-SPDAT | ✅ Housing Referral Status | ✅ Acuity + length of stay |
| Centralized by-name list | ✅ | ✅ | ✅ |
| Standardized assessment | ✅ | ✅ | ✅ |
| Demographics matching | ✅ | ✅ | ✅ |
| Special population tracks | ✅ Veterans, DV, TAY | ✅ Veterans, DV, TAY, Justice | ✅ Veterans, DV |
| Geographic zones | ✅ SPA-based | ✅ City-wide | ✅ Borough-based |

---

## Implications for the Queue Design

### What We Have
The Better Angels system already captures shelter-level acceptance criteria exceptionally well — 15 enums covering demographics, special situations, accessibility, entry requirements, and more. This exceeds what most coordinated entry systems model at the shelter level.

### What to Add
1. **Population segmentation** — Adult, Family, TAY should be an explicit field on referrals, not just implicit in criteria. Aligns with every city's CE structure.
2. **Simple priority tiers** — Not a full VI-SPDAT, but a caseworker-assigned priority (Standard/Elevated/Urgent) that the queue sorts by. Aligns with HUD's prioritization mandate.
3. **Criteria coverage** — Extend eligibility criteria to cover all shelter M2Ms (not just demographics and accessibility). Entry requirements, medical needs, pets, parking, and storage are all relevant for matching.

### What to Defer
- Full VI-SPDAT or Next Step assessment integration (requires formal assessment tool licensing/training)
- Automated vulnerability scoring (complex algorithm, better done by caseworkers for now)
- Geographic zone-based routing (already in shelter model via SPA, can be added later)
