# Engineering Roadmap — July–October 2026

> For: CTO & CEO · July 21, 2026

---

## What We're Doing and Why

We have two products in the field — the outreach app (field work, HMIS-connected client tracking, service delivery) and the shelter operator portal (beds, availability, placements). **SELAH** is willing to trial a placement workflow if we can find shelters for their clients. **SBCCOG** wants to trial the outreach app — and is a potential placement partner downstream.

The next 3 months are about closing the loop. We're building the placement layer that connects partner demand to shelter supply, putting the portal through its paces internally while we grow the shelter side of the equation, and completing the platform cleanup that makes cross-organization work reliable.

Four threads:

| Thread | Where We Are | What We're Doing |
|--------|-------------|-----------------|
| **Operator Portal** | Built by Blueprint volunteers. No shelter partners using it yet. | Move BA's internal data team onto the portal as the primary tool. Dogfood daily. Find and fix gaps. Sunset the legacy Django admin. |
| **Outreach App** | Live and in use by SELAH for client tracking, service delivery, and HMIS-connected field work. | Onboard SBCCOG. Address a handful of reported bugs from SELAH. Longer-term: replace the temporary Liquid Glass iOS workaround with a permanent fix. |
| **Placement System** | Doesn't exist yet. SELAH is willing to trial if we can find shelters. SBCCOG is outreach-first, placement is downstream. | Two parallel tracks: support Elissa and the Booz Allen volunteers on ShelterConnect experiments, and run our own placement experiments in the field with willing partners using internal shelter data as the supply side. |
| **Platform Cleanup** | Tech debt from fast-moving builds: half-migrated teams system, dual permission models, legacy dependencies. | Complete the teams cutover. Finish the permission migration. Evaluate removing legacy auth dependency. This enables the three product threads to work across organizations. |

---

## The 3-Month Arc

### Month 1 — Prep the System (July 21 – August 18)

**Operator Portal:** BA data team moves onto the portal for daily shelter data management. Audit every button — wire it up or hide it. Sunsets Django admin for shelter data entry. Along the way we catch gaps from the Blueprint build before external partners touch it.

**Outreach App:** Kick off SBCCOG scoping and produce an onboarding plan. Address reported bugs from SELAH. SELAH meeting July 24 — demo HMIS workflow and explore them as a placement partner.

**Placement System:** Define the client↔shelter mapping — what client fields map to what shelter criteria? Do we have all the data we need? Support Elissa and the Booz Allen volunteers on ShelterConnect experiments. Begin scoping placement experiments with SELAH.

**Platform Cleanup:** Complete the teams migration — remove the old hardcoded team system that's been running alongside the new one. Drop the temporary translation layer and old database columns.

### Month 2 — Open to Partners (August 18 – September 15)

**Placement System:** Continue supporting ShelterConnect experiments with Elissa and Booz Allen. In parallel, run a placement experiment in the field with SELAH — using internal shelter data as supply. SBCCOG is outreach-first, placement as a potential next step.

**Operator Portal:** Add reporting and bed availability dashboard. Shelters and BA team see vacancy outcomes and utilization trends.

**Outreach App:** Onboard SBCCOG. Ship features based on SELAH feedback. Begin work on the permanent Liquid Glass fix so we're not dependent on a temporary Apple compatibility flag.

**Platform Cleanup:** Finish permission migration across all remaining modules. Mobile app gets org awareness to match the admin portal. Strip old permission endpoints.

### Month 3 — Prove It Works (September 15 – October 13)

**Placement System:** Hit 20 clients placed through the pipeline. Cross-shelter coordination — if one can't accept, auto-suggest alternatives. Onboard 5+ shelters to manage beds through the portal.

**Outreach App:** Hit 10% service delivery growth across BA + SELAH teams.

**Platform Cleanup:** Evaluate removing Django Guardian — decide whether our modern permission system fully replaces the legacy third-party dependency. Code health sprint. Long-term fix for the Liquid Glass iOS workaround.

---

## Key Milestones

| When | What |
|------|------|
| **Jul 24** | SELAH partnership meeting |
| **Jul 28 – Aug 1** | Shelter case worker UX research interviews |
| **Aug 18** | Month 1: portal dogfooding, teams cutover done, client↔shelter mapping defined |
| **Sep 15** | Month 2: placement experiment running, permissions migrated, Django admin read-only |
| **Oct 13** | Month 3: 20 placements, 10% service growth, guardian decision |

---

## Master Work Plan

| # | Thread | Initiative | Details | Success Criteria |
|---|--------|-----------|---------|-----------------|
| **1** | Operator Portal | BA data team moves onto portal | Dogfood daily for all shelter data management. Audit and fix every button. Sunset legacy Django admin. | Internal team on portal; Django admin read-only |
| **2** | Outreach App | SBCCOG onboarding plan | Scoping kickoff: understand workflow, data needs, HMIS requirements. Produce timeline. | Onboarding plan documented; timeline agreed |
| **3** | Placement System | Client↔shelter mapping | Define 1:1 mapping between client profile fields and shelter criteria. Identify data gaps. Support Elissa + Booz Allen on ShelterConnect. | Mapping spec; gaps identified; ShelterConnect supported |
| **4** | Outreach App | SELAH demo + placement exploration | Jul 24 meeting: demo HMIS workflow, explore as placement partner. Address reported bugs. | Demo complete; placement experiment scoped |
| **5** | Platform Cleanup | Complete teams cutover | Remove old hardcoded team system running alongside new one. Drop temporary translation layer and old database columns. | Old system fully removed |
| **6** | Outreach App | Bug fixes | Address reported SELAH bugs: task display, profile summary, DOB, date picker icons. | All P1/P2 bugs closed |
| **7** | Operator Portal | Client merge bug fixes | Fix non-target profile persisting after merge. Fix missing conflict items in merge UI. | Both bugs resolved |
| **8** | Placement System | Placement queue + experiment | Build queue in portal. Run field experiment with SELAH using internal shelter data. Continue ShelterConnect support. | Experiment running with SELAH |
| **9** | Platform Cleanup | Complete permission migration | Migrate remaining modules from old permission system to new org-scoped model. Mobile app org cutover. | All features on modern permissions |
| **10** | Operator Portal | Reporting + dashboard | Vacancy outcomes, utilization trends, placement metrics visible to shelters and BA team. | Dashboard live |
| **11** | Outreach App | SBCCOG onboarding | Execute Month 1 plan. SBCCOG team actively using outreach app. Placement as potential next step. | SBCCOG team live |
| **12** | Outreach App | Liquid Glass permanent fix | Replace temporary Apple compatibility workaround with proper solution before Apple removes the flag. | Liquid Glass works without flag |
| **13** | Placement System | 20 placements target | Hit OKR. Onboard 5+ shelters to portal. Cross-shelter coordination. | 20 placements confirmed |
| **14** | Outreach App | 10% service delivery growth | Hit OKR across BA + SELAH teams. | 10% increase confirmed |
| **15** | Platform Cleanup | Evaluate guardian removal | Audit whether modern permission system fully replaces legacy dependency. | Decision document |

---

## Deferred

Items that didn't make the cut for this 3-month window but are tracked for future prioritization:

- **Doc library folders** — create folder organization in the document library. Low urgency, no external dependency.
- **Search by DOB and phone number** — extend client search beyond name. Not a current partner request.

---

## Risks

| Risk | Our Approach |
|------|-------------|
| **Placement system depends on shelter supply** | SELAH is willing to trial placement but needs shelters to place their clients. We're building the supply side by moving BA's data team onto the portal and using internal shelter data. SBCCOG is an opportunity, not yet committed. |
| **Liquid Glass workaround is temporary** | We rely on an Apple compatibility flag that could be removed, blocking updates. Scoping a permanent fix for Month 3. |

---

## How We'll Measure Success

| Metric | Now | Target (Oct 13) |
|--------|-----|-----------------|
| Clients placed via the pipeline | 0 (building it) | 20 |
| Service delivery volume (BA + SELAH) | Current baseline | +10% |
| Shelters actively using the operator portal | 0 | 5+ |
| Open bugs | 6 | 0 |
