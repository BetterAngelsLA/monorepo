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

---

## Operational Models: How Major Metros Manage Shelter Placement

### Three Dominant Models

| Model | Cities | How it works | Shelter role |
|---|---|---|---|
| **Centralized placement** | NYC, Boston, DC | Central assessment center evaluates all clients. System assigns to specific shelter based on assessment + availability. | Shelters report bed counts; accept whoever is sent. Little autonomy. |
| **Coordinated matching** | SF, Seattle, Denver | Multiple access points feed a central system. System matches and refers, but shelters may have some choice. | Shelters report availability; receive system-generated referrals. Moderate autonomy. |
| **Shelter-choice / provider-driven** | LA (hybrid), many mid-size CoCs | Shelters publish their criteria. Caseworkers or the system match. Shelters pull from a shared pool or accept direct referrals. | Shelters control who they accept. High autonomy. |

### Key Operational Differences

| Dimension | Centralized (NYC) | Coordinated (SF) | Shelter-choice (LA) |
|---|---|---|---|
| **Who decides placement?** | Central system | System matches, shelter confirms | Shelter chooses |
| **Bed availability** | Real-time, centrally tracked | Real-time via ONE System | Provider-reported, not always real-time |
| **Shelter autonomy** | Low — must accept referrals | Medium — can decline | High — can accept/decline freely |
| **Intake model** | Central intake centers | Distributed access points | Direct to shelter or via CES |
| **Referral direction** | System → Shelter (push) | System → Shelter (push) | Caseworker → Queue (pull) |
| **Technology maturity** | High (proprietary DHS systems) | High (ONE System) | Varied (Better Angels is improving this) |

### What This Means for Better Angels

The Better Angels design naturally supports **all three models** because:

1. **Centralized placement** — The `PENDING` + targeted referral path lets a central coordinator assign clients to specific shelters. The `ShelterAvailability` model already tracks beds.

2. **Coordinated matching** — The `QUEUED` path + matching engine automates system-recommended matches. Shelters see compatible clients ranked by priority. The system can also push referrals via targeted `PENDING`.

3. **Shelter-choice** — The queue view lets shelters browse and claim compatible clients. This is the default mode for LA but works for any CoC.

### Bed Availability Integration (Future)

The system already has `ShelterAvailability` (per-shelter bed counts: `non_restricted_beds`, `restricted_beds`) and `Bed`/`Room` models with computed status (AVAILABLE, OCCUPIED, RESERVED, etc.).

When shelters begin reliably updating availability, the matching query can add:

```python
# Filter shelters with available beds (future)
Shelter.objects.filter(
    availability__non_restricted_beds__gt=0
) | Shelter.objects.filter(
    availability__restricted_beds__gt=0
)
```

Or at the bed level:

```python
# Match only shelters with at least one available bed
Shelter.objects.filter(
    beds__computed_status=BedStatusChoices.AVAILABLE
).distinct()
```

No design changes needed — availability filtering is a query addition, not a model change.

---

## Django/SQL Patterns for Attribute-Based Matching

Research into how the broader Django ecosystem handles similar matching/eligibility
problems. Four dominant patterns exist, with a clear consensus on when each is
appropriate.

### Pattern 1: django-taggit — Simple Tag M2M

The most widely-used tagging library in Django (3.4k stars). Tags ARE the
vocabulary — no separate config table mapping tags to fields.

```python
class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

class TaggedItem(models.Model):  # through model
    tag = models.ForeignKey(Tag, ...)
    content_object = models.ForeignKey(...)
```

Matching is done via standard ORM filtering:

```python
Model.objects.filter(tags__name__in=["veteran", "family"])
```

**Key insight:** The tag name IS the lookup key. Fifteen years of production use
prove this pattern. If you want an admin-managed vocabulary, a `Tag`-style model
with just `name` + `category` is sufficient. No `shelter_field`/`shelter_value`
mapping strings needed — the matching function uses the tag name to decide which
Shelter M2M to query.

### Pattern 2: PostgreSQL JSONField — Semi-structured Attributes

Increasingly popular for 10-50 dynamic boolean attributes. Django has built-in
`JSONField` since 3.1.

```python
class Referral(BaseModel):
    criteria = models.JSONField(default=dict)
    # {"veteran": true, "senior": true, "family": true, ...}

# Django JSON queries + PostgreSQL GIN indexes:
Referral.objects.filter(criteria__veteran=True)
```

**When to use:** Moderate number of dynamic boolean attributes, schema flexibility
without EAV complexity, database-level queryability needed.

**When NOT to use:** Need referential integrity (FKs), complex joins across JSON
keys, cross-app reuse of attribute vocabulary. Risk: freeform string keys can
cause silent breakage if not controlled by code.

### Pattern 3: EAV (Entity-Attribute-Value) — When NOT to use it

The `django-eav2` library docs are remarkably honest:

> EAV is a trade-off between flexibility and complexity. It should NOT be used
> when system is performance-critical or low complexity is a priority.

> An EAV design should be employed only for that sub-schema of a database where
> sparse attributes need to be modeled. There are relatively few database-design
> problems where sparse attributes are encountered.

EAV is for cases like: "5,000 possible medical attributes per patient, but any
given patient only has 50." That is not this problem — we have ~7-10 attributes
that nearly every client will have values for.

**Warning:** The `EligibilityCriterion` model with `shelter_field`/`shelter_value`
strings is a hand-rolled mini-EAV for matching rules. The django-eav2 docs would
recommend concrete columns or JSONField at this scale.

### Pattern 4: Through-Model M2M — The Django Gold Standard

For any M2M that needs metadata (timestamps, actor, reason), the standard
Django pattern uses an explicit through model:

```python
class ReferralDecline(models.Model):
    referral = models.ForeignKey(Referral, ...)
    shelter = models.ForeignKey(Shelter, ...)
    declined_at = models.DateTimeField(auto_now_add=True)
    declined_by = models.ForeignKey(User, ...)
    reason = models.TextField(blank=True)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["referral", "shelter"],
                name="one_decline_per_shelter",
            )
        ]
```

This is documented in Django's official tutorials and used in virtually every
production Django project. A raw `ManyToManyField` without a through model loses
the timestamp, actor, and reason — information that becomes invaluable for
operational debugging and audit trails.

### The Practical Consensus

| Approach | When | Django pattern |
|---|---|---|
| **Concrete columns** | ≤15 attributes, stable schema | `BooleanField` / `CharField` |
| **JSONField** | 10-50 attributes, somewhat dynamic | `models.JSONField(default=dict)` + GIN index |
| **Tag M2M (django-taggit)** | Shared vocabulary, admin-managed | `Tag` + `through` |
| **EAV** | 100+ sparse, highly dynamic attributes | `django-eav2` |
| **Config table with string field refs** | Almost never | Anti-pattern in relational DBs |

### What This Means for the Proposal

The original proposal's `EligibilityCriterion` with `shelter_field`/`shelter_value`
strings falls into the last category — a config table encoding ORM field paths as
strings. This is fragile (no referential integrity, breaks on field renames) and
unnecessary at this scale.

For 7-10 auto-derivable attributes plus a handful of manual-only tags, the
appropriate pattern is either:

- **Concrete boolean columns** (simplest, type-safe, database-queryable), or
- **A Tag-style M2M** (if an admin-managed vocabulary is genuinely needed, keep
  it to `name` + `category` only — no field mappings)

In both cases, the matching logic lives in a Python function (a `selectors.py` or
`services.py` file), not in database rows. Database-driven matching rules only
make sense when non-engineers need to create/modify rules without code deploys —
and even then, established libraries like `django-rules` exist for this purpose.

The decline tracking should use Pattern 4 (through-model M2M) rather than a raw
`ManyToManyField`. A timestamp and optional reason on each decline costs ~5 extra
lines of code and pays for itself the first time someone asks "when was this
client declined and by whom?"

The notification subsystem (dedicated model + Celery beat + GraphQL types) is
premature for v1. The codebase already has `django-post_office` + Celery for
email. When notifications are needed, a simple queryset + management command is
sufficient. Graduate to a dedicated model when per-shelter per-frequency
preferences are actually requested.
