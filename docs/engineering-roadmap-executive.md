# Engineering Roadmap — July–October 2026

> For: CTO & CEO · July 21, 2026

---

## Why This Plan, Why Now

We're a team of 3 engineers (2 with in-progress commitments: Tailwind consolidation, role management). This plan is built for our actual capacity — it prioritizes the highest-impact work and is honest about what fits and what waits.

Everything here answers two questions: **what are we doing, and why.**

---

## 🟢 Support & Stabilize (~30% of effort)

**Why:** Our current partners rely on the product daily. We can't let bugs or rough edges erode trust while we build new features. At the same time, we have an opportunity to simplify our own operations by moving fully onto the operator portal.

### What We're Doing

**SBCCOG onboarding plan (first priority).** One of our highest-priority partnerships. Month 1 is a scoping kickoff: understand their workflow, data needs, and HMIS requirements. Produce a timeline for onboarding.

**Operator portal as the single source of truth.** Rather than maintaining both the operator portal and the legacy Django admin, we're moving BA's internal data team fully onto the portal. This lets us sunset Django admin, simplifies the codebase, and means we're dogfooding the exact same experience shelters will use. Along the way we catch rough edges: non-functional buttons, missing workflows, UX gaps from the Blueprint integration pass.

**Bug fixes.** There are 6 open bugs and 4 service desk tickets. We'll clear them in Month 1.

**Partner support.** SELAH (meeting July 24) is positioned as a design partner for Unified Placement. Both SELAH and SBCCOG are willing to trial the placement system with their teams.

---

## 🟡 Finish What We Started (~30% of effort)

**Why:** We've accumulated technical debt from fast-moving development cycles and partial migrations. Leaving it unaddressed makes every future feature slower to build and harder to maintain. We're paying it down now, during a period when we have engineering capacity and before we onboard more shelter partners.

### What We're Doing

**Complete the teams migration.** Months ago we moved from a hardcoded team enum to a flexible team model — but we left the old system in place as a temporary shim. It's still there, wired into notes, tasks, and the GraphQL API. We're removing it entirely: delete the shim, drop the old database columns, clean up all references.

**Complete the permissions migration.** We've been migrating API endpoints from a legacy permission check to a cleaner org-scoped model. Shelters and reports are done. Notes, clients, HMIS, referrals, and tasks still need to be migrated. Finishing this unlocks two things: consistent security across all products, and the ability to remove a legacy dependency (Django Guardian) that adds complexity to our auth stack.

**Bring the mobile app up to parity.** The admin portal already sends organization context on every request. The mobile app doesn't. Closing this gap means permissions work the same way regardless of which client you're using.

---

## 🔵 Build New Capabilities (~40% of effort)

**Why:** The first two buckets keep us stable and healthy. This one moves the needle on our core mission: getting people into shelter. It's also where we prove the platform can drive measurable outcomes — the evidence we need to expand adoption.

### What We're Doing

**Unified Placement — the client↔shelter mapping.** Today we can filter shelters by attributes (e.g., "accepts men," "has available beds"), but there's no systematic mapping between a client's profile and a shelter's requirements. We know a client's gender, age, household size, and needs — but we can't automatically answer "which shelters can take this person?" Building this mapping is critical foundational work: it defines the data model, surfaces gaps (what are we not capturing?), and is prerequisite for any automated placement features.

- **Month 1:** Define the mapping specification. What client fields map to what shelter criteria? Do we have all the data we need? Prototype the matching logic. **SBCCOG onboarding plan** (first priority). **SELAH** (July 24) positioned as a design partner.
- **Month 2:** Implement the placement queue in the operator portal. Shelters can view, accept, or reject matched clients. Run the experiment with SELAH and SBCCOG.
- **Month 3:** Cross-shelter coordination — if one can't accept, auto-suggest alternatives.

**Target: 20 clients placed by October 13.**

**Self-service onboarding.** Today, setting up a new shelter requires a BA staff member to walk them through it. We're making it self-service: public signup, guided setup wizard, "invite your team" flow. Target: under one day from signup to operational, no BA intervention needed.

**Service delivery tracking.** Beyond immediate distributions, we need to track multi-step service requests (e.g., ID replacement → document collection → application submitted → received). This feeds our 10% service delivery growth target across BA and SELAH teams.

---

## Key Milestones

| When | What |
|------|------|
| **Jul 24** | SELAH partnership meeting |
| **Jul 28 – Aug 1** | Shelter case worker UX research interviews |
| **Aug 18** | Month 1: Unified Placement V1 live, operator portal dogfooding, teams migration complete |
| **Sep 15** | Month 2: placement experiment running with SELAH/SBCCOG, permissions migrated, Django admin read-only |
| **Oct 13** | Month 3: 20 placements, 10% service growth, self-service GA, guardian decision |

---

## Risks We've Planned For

| Risk | Our Approach |
|------|-------------|
| **No PM** — who's prioritizing? | This plan is built from Michelle's handoff, open tickets, and codebase audit. We're not guessing. |
| **Will shelters adopt the placement system?** | SELAH and SBCCOG have indicated willingness to trial it. We start with committed design partners, not cold outreach. UXR interviews in Month 1 inform the UX before we scale. |
| **Blueprint volunteer transition** | If volunteers are done, BA engineering takes full ownership of bed features in Month 1. |
| **SBCCOG timeline uncertainty** | Month 1 is scoping only. No dependency risk for our core targets. |
| **Liquid Glass workaround is temporary** | Our iOS app currently relies on an Apple compatibility flag (`UIDesignRequiresCompatibility`) that could be removed in a future iOS release. If Apple removes it, we'd be blocked from Expo SDK updates and security patches. We're scoping a permanent fix for Month 3. |

---

## How We'll Measure Success

| What We're Tracking | Where We Are | Target (Oct 13) |
|---------------------|-------------|-----------------|
| Clients placed via the pipeline | 0 (building it) | 20 |
| Service delivery volume (BA + SELAH) | Current baseline | +10% |
| Shelters actively using the operator portal | 0 | 5+ |
| Time from shelter signup to first bed created | Days (manual process) | < 1 day |
| Open bugs | 6 | 0 |
