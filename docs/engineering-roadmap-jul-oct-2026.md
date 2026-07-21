# Better Angels Engineering Roadmap — July–October 2026

> Last updated: 2026-07-21
> Sources: Michelle's handoff doc, BA Tech Team Vision, meeting notes (June 23), Jira audit (all open DEV tickets), full codebase audit (TODOs, deprecations, shims, skipped tests, guardian usage, migration leftovers)

---

## 🧭 Overview

### Primary OKRs (Next 3 Months)

| OKR | Target |
|-----|--------|
| **Placements via tech** | 20 clients housed — end-to-end pipeline: request → match → confirmed |
| **Service delivery growth** | 10% increase across BA + SELAH teams |
| **Tech debt burn-down** | Complete teams cutover + permission migration |

### How This Plan Is Organized

We're a team of 3 engineers. The table below is the full work plan, ranked by priority. It covers immediate actions, what fits in the next 3 months, and what we're deliberately deferring.

### TLDR

**Right now:** collecting loose ends from Michelle's offboarding, kicking off the SBCCOG partnership. The shelter operator portal (Blueprint) is fully wired up — that's the foundation we're building on.

**Month 1:** internal dogfooding the portal, complete the teams cutover, define the client↔shelter mapping, clear bugs, SELAH demo.

**Month 2:** placement queue live with the SELAH/SBCCOG experiment, finish permission migration, reporting dashboard, outreach features.

**Month 3:** 20 placements, 5+ shelters onboarding, self-service GA, guardian decision, code health.

---

## � Master Work Plan — Ranked by Priority

| # | Priority | Domain | Initiative | Details | Success Criteria |
|---|----------|--------|-----------|---------|-----------------|
| **1** | 🔴 Now | Platform | **Michelle Offboarding — Loose Ends** | Collect and triage all outstanding items from Michelle's handoff: open conversations with partners, in-flight requirements, undocumented decisions, pending PRDs. Nothing gets dropped. | All loose ends documented and triaged |
| **2** | 🔴 Now | Placement & Partnerships | **SBCCOG Onboarding Plan** | Highest-priority partnership (per Michelle's handoff). Scoping kickoff: understand workflow, data needs, HMIS requirements. Produce onboarding plan with timeline. | Onboarding plan documented; timeline agreed |
| **3** | ✅ Done | Operator Portal | **Shelter Operator Portal — Wired Up** | Blueprint volunteer work is complete. Core shelter management features (bed creation, placement, reporting) are built and integrated. This is the foundation we're building on. | Portal functional; BA owns the integration |
| **4** | 🟡 Month 1 | Operator Portal | **Internal Dogfooding — Sunset Django Admin** | Move BA's internal data team fully onto the operator portal for all shelter data: beds, availability, placements, reporting. Audit every button — wire it up or hide it. Dogfood before externals. Sunset Django admin for shelter data entry. | Internal team on portal; zero non-functional buttons; Django admin read-only |
| **5** | 🟡 Month 1 | Platform | **Complete Teams Cutover** | Remove the old hardcoded team system that's been running alongside the new flexible team model for months. Delete the temporary translation layer, drop the old database columns, and clean up all remaining references. This has been a known partial migration — time to finish it. | Old team system fully removed |
| **4** | 🟡 Month 1 | Placement & Partnerships | **Unified Placement — Client↔Shelter Mapping** | Foundational data architecture. Define 1:1 mapping between client profile fields and shelter requirements. Identify data model gaps. Prerequisite for any automated placement. | Documented mapping spec; data model gaps identified; prototype matching logic |
| **5** | 🟡 Month 1 | Placement & Partnerships | **SELAH Demo & Partnership Kickoff** | Jul 24 meeting: demo outreach + HMIS. Position SELAH (and SBCCOG) as design partners for Unified Placement experiment. Capture workflow needs. | Successful demo; experiment scope agreed |
| **6** | 🟡 Month 1 | Outreach App | **Bug Smash** | BACS-82 (task display), BACS-93 (profile summary). DEV-2469 (DOB), DEV-2470 (date picker icons). DEV-2452 (copy/paste — ship release). | All P1/P2 bugs closed |
| **7** | 🟡 Month 1 | Operator Portal | **Doc Library Folders (DEV-2465)** | Create folder organization in doc library. Currently Draft — unblock and implement. | Folder CRUD available |
| **8** | 🟡 Month 1 | Outreach App | **Search by DOB & Phone (DEV-2461)** | Extend client search beyond name to include date of birth and phone number. | Search returns matches on DOB and phone |
| **9** | 🟡 Month 1 | Operator Portal | **Client Merge Bug Fixes (DEV-2466, DEV-2467)** | Fix: non-target profile persisting after merge. Fix: missing conflict items in merge UI. | Both merge bugs resolved |
| **10** | 🟡 Month 1 | Outreach App | **SELAH Workflow Alignment** | From SELAH meeting: identify missing fields, UX gaps, or HMIS data sync issues. | Prioritized list of SELAH-specific requests |
| **11** | 🟡 Month 1 | Platform | **Remove Deprecated Fields** | Clean up leftover hardcoded role assignments that were preserved for old mobile clients. All clients have migrated — these can go. Fold into teams cutover work. | Deprecated fields gone |
| **12** | 🟢 Month 2 | Placement & Partnerships | **Unified Placement — Queue & Experiment** | Building on Month 1 mapping: implement placement queue. Shelters view/accept/reject. Run experiment with SELAH and SBCCOG. Measure conversion + time-to-placement. | 3+ shelters accepting; experiment running |
| **13** | 🟢 Month 2 | Platform | **Complete Permission Migration** | Finish migrating the remaining parts of the app (accounts, notes, clients, HMIS, referrals, tasks) from our old permission system to the new org-scoped model. Shelters and reports are already done — this completes the work. | All features using modern permission system |
| **14** | 🟢 Month 2 | Platform | **Mobile App Org Cutover** | The admin portal already knows which organization you're working in. The mobile app doesn't yet — it needs the same awareness so permissions are consistent regardless of which app you're using. | Mobile app sends org context on all calls |
| **15** | 🟢 Month 2 | Operator Portal | **Reporting & Bed Availability Dashboard** | Shelters and BA team see vacancy outcomes, utilization trends, placement metrics. | Dashboard live for pilot shelters |
| **16** | 🟢 Month 2 | Platform | **Strip Old Permission Endpoints** | Audit and remove any API endpoints still using the legacy permission approach that the migration missed. Clean up dead code paths. | All endpoints use modern permission system |
| **17** | 🟢 Month 2 | Operator Portal | **Long-Term Fulfillment Tracking** | Track status, tasks, progress for multi-step service requests. | Service request lifecycle visible in portal |
| **18** | 🟢 Month 2 | Outreach App | **Misc Outreach Features** | Ship 2–3 features from SELAH/field feedback: profile views, service logging shortcuts, offline improvements. | 2–3 features shipped |
| **19** | 🟢 Month 2 | Outreach App | **Notification Signups — Conversion** | Analyze June 2026 data. Improve SMS signup → attendance funnel. | 10% improvement in conversion |
| **20** | 🟢 Month 2 | Operator Portal | **Portal UX from UXR** | Apply shelter case worker interview findings to portal workflows. | 3+ UX improvements shipped |
| **21** | 🟢 Month 2 | Placement & Partnerships | **Supply Expansion — Onboard Shelters** | Begin onboarding additional partner shelters to portal. | 2+ new shelters in pipeline |
| **22** | 🔵 Month 3 | Placement & Partnerships | **20 Placements Target** | Hit OKR: 20 clients housed through Unified Placement pipeline. | 20 placements confirmed |
| **23** | 🔵 Month 3 | Placement & Partnerships | **Supply Expansion — 5+ Shelters** | Onboard 5+ partner shelters. Target 30% increase in reported available beds. | 5 shelters managing beds via portal |
| **24** | 🔵 Month 3 | Placement & Partnerships | **Cross-Shelter Coordination** | If one shelter can't accept, auto-suggest alternatives. | Auto-routing live |
| **25** | 🔵 Month 3 | Operator Portal | **Self-Service Onboarding — GA** | Public signup → guided setup → invite-team → claim-existing-shelter. No BA intervention needed. | < 1 day from signup → first bed |
| **26** | 🔵 Month 3 | Outreach App | **10% Service Delivery Increase** | Hit OKR: 10% growth in tracked service delivery across BA + SELAH. | 10% increase confirmed |
| **27** | 🔵 Month 3 | Outreach App | **SBCCOG Onboarding** | Execute Month 1 onboarding plan. SBCCOG team actively using outreach app. | SBCCOG team live |
| **28** | 🔵 Month 3 | Platform | **Evaluate Django Guardian Removal** | We currently run two overlapping permission systems. Once the migration is complete, audit whether we can remove the third-party dependency entirely — simplifying our authentication stack and eliminating an externally maintained library. | Decision document: keep or remove with plan |
| **29** | 🔵 Month 3 | Platform | **Code Health Sprint** | Resolve accumulated cleanup items from fast-moving development cycles: refactor outdated test utilities, add missing test coverage, fix minor admin UI issues, enable a pending HMIS data field. Individually small; collectively they slow down every future change. | 80% of cleanup items resolved |
| **30** | 🔵 Month 3 | Platform | **Liquid Glass — Long-Term Fix** | Replace temporary Apple compatibility workaround with a proper solution. We're dependent on a flag Apple could remove in any iOS update — if they do, we can't update Expo or apply security patches. | Liquid Glass works without the compatibility flag |
| **31** | 🔵 Month 3 | Operator Portal | **Shelter CM UXR → Tickets** | Research findings converted into prioritized, groomed tickets with acceptance criteria. | 5+ tickets groomed |

> **Capacity note**: 3 engineers (~2 FTE effective, ~8 engineer-weeks/month). Month 1 has 11 items but several are small (bugs, docs, meetings) or fold into the same engineer's workstream. The two largest efforts — teams cutover (#3) and client↔shelter mapping (#4) — are the primary engineering investments.

---

## 🔧 Tech Debt Backlog

### Teams System — Partial Cutover

*We moved from a hardcoded list of teams to a flexible team model months ago, but left the old system wired in as a temporary bridge. These items remove that bridge and complete the migration.*

| # | What's Left | Why It Matters |
|---|------------|---------------|
| **TD-1** | Delete the shim that translates old team references to new ones | Every note and task mutation still routes through this temporary translation layer. Removing it simplifies the code path and eliminates a class of bugs. |
| **TD-2** | Remove the deprecated "team" field from notes and tasks in the API | Mobile clients have migrated to the new fields. The old field is dead weight in the API. |
| **TD-3** | Drop the old team column from the database | The data was migrated to the new team model months ago. The old column is still sitting in the database taking up space. |
| **TD-4** | Delete the old team enum definition entirely | The final step — once nothing references it, remove the 16 hardcoded team choices from the codebase. |
| **TD-5** | Remove hardcoded caseworker role fields from the user type | These were preserved for backward compatibility with old mobile clients. All clients have migrated — time to clean up. |
| **TD-6** | Clean up test code marked "remove after HMIS service cutover" | The HMIS cutover happened. The test workarounds are no longer needed. |

### Permission System — Dual Systems

*We've been migrating from two overlapping permission systems (Django Guardian, a third-party library, plus our own org-scoped permissions) to a single, consistent model. Shelters and reports are done. The rest still run both.*

| # | What's Left | Why It Matters |
|---|------------|---------------|
| **TD-7** | Migrate account management endpoints to the new permission model | Account operations (inviting members, managing roles) still use the legacy permission check. This is the gateway to the rest of the system. |
| **TD-8** | Migrate notes to the new permission model | Notes are our highest-volume data type. Every note query runs through two permission checks instead of one. |
| **TD-9** | Migrate clients, HMIS, referrals, and tasks to the new permission model | The remaining domains. Each one independently runs dual permission checks. |
| **TD-10** | Assign proper permissions when shelters and beds are created | Currently permissions for new shelter resources aren't automatically set — they rely on the legacy system catching them. |
| **TD-11** | Evaluate removing Django Guardian entirely | Once all endpoints use our permission model, we can assess whether to remove the third-party dependency. This would simplify our authentication stack and eliminate a library that requires ongoing maintenance. |

### Test & Code Cleanup

*Accumulated items from fast-moving development cycles. Small individually, but collectively they slow down every change.*

| # | What's Left | Why It Matters |
|---|------------|---------------|
| **TD-12** | Refactor the client profile test setup | Test utilities have temporary workarounds from a profile refactor. Cleaning them up makes tests easier to write and maintain. |
| **TD-13** | Add unit test for the note attachments resolver | A core function that returns files attached to notes has no dedicated test coverage. |
| **TD-14** | Enable a missing data field in the HMIS integration | The HMIS API had a bug preventing one field from working. When they fix it, we can turn it on. |
| **TD-15** | Restore the map display in the admin interface | The location map worked but was disabled during a UI change. It's a useful internal tool for verifying shelter addresses. |
| **TD-16** | Verify database field ordering for performance | Two fields have notes asking whether their current order is optimal for query performance. Quick audit. |
| **TD-17** | Update admin validation for permission templates | The admin form doesn't properly validate template assignments. Low-risk but annoying for internal users. |
| **TD-18** | Clean up a type-check workaround in the mobile app | A GraphQL query includes extra fields solely to satisfy the type checker. Remove them now that the types are stable. |

### Frontend

| # | What's Left | Why It Matters |
|---|------------|---------------|
| **TD-19** | Remove an SDK version TODO in the mobile app | The Expo SDK upgrade resolved this. The TODO comment is stale. |
| **TD-20** | Standardize icon loading in the component library | Storybook still uses a legacy SVG loader. Switching to the standard one used by the apps removes a dependency. |
| **TD-21** | Fix TODOs in the Wildfires survey components | Several navigation and styling TODOs from the initial build. The app works but has rough edges. |
| **TD-22** | Un-skip two tests in the Wildfires app | The tests were skipped during initial development and never re-enabled. |
| **TD-23** | Remove a temporary code suppression in shelter-web | An ESLint suppression was added to allow incremental cleanup. The cleanup happened — the suppression can go. |

### Infrastructure

| # | What's Left | Why It Matters |
|---|------------|---------------|
| **TD-24** | Replace the Liquid Glass workaround with a permanent fix | We rely on an Apple compatibility flag that could be removed in any iOS update. If Apple removes it, we can't update Expo or apply security patches. This needs a proper solution. |
| **TD-25** | Standardize the design system across all apps | Three apps (admin portal, shelter web, shelter operator) use different Tailwind configurations with overlapping color names. Tom is actively consolidating these. |
| **TD-26** | Remove the old team column from the database | (Covered by TD-3 — listed here for migration tracking.) |

---

## 🗓️ Key Dates & Milestones

| Date | Event |
|------|-------|
| **Jul 24** | SELAH meeting — demo outreach + HMIS integration |
| **Jul 28 – Aug 1** | UXR: Shelter case worker interviews |
| **Aug 4** | All-Hands presentation |
| **Aug 18** | Month 1 checkpoint: shelter queue V1 live, data team migration started, teams cutover complete |
| **Sep 15** | Month 2 checkpoint: HasOrgPerm migration complete, mobile org cutover, Django admin read-only |
| **Oct 13** | Month 3 checkpoint: 20 placements, 10% service delivery increase, guardian decision |

---

## 📊 Appendix A: Jira Audit — All Open DEV Tickets (2026-07-21)

### 🔴 In Progress

| Ticket | Summary | Type | Assignee | Updated |
|--------|---------|------|----------|---------|
| **DEV-2450** | Consolidate Tailwind usage across apps + shelter | Task | Tom Glaz | Jul 15 |
| **DEV-2440** | Manage roles | Story | Paul Vecchio | Jun 18 |
| **DEV-2429** | Expo 56 upgrade | Epic | — | Done |

### 🟡 To Do / Draft

| Ticket | Summary | Type | Priority | Created |
|--------|---------|------|----------|---------|
| **DEV-2469** | DOB displays incorrect date (1 day earlier) for affected birth years | Bug | Medium | Jul 20 |
| **DEV-2470** | Date Picker icons display missing assets on Dev-Main | Bug | Medium | Jul 20 |
| **DEV-2467** | Missing items in the Conflict Message (merge UI) | Bug | Medium | Jul 14 |
| **DEV-2466** | Persistent Non-target profile after merge | Bug | Medium | Jul 14 |
| **DEV-2465** | Doc Library — Create folder option | Story | Medium | Jul 9 |
| **DEV-2461** | Client Search — searchable by DOB and phone number | Story | Medium | Jul 3 |

### 🟢 Recently Done (relevant)

| Ticket | Summary | Status | Resolved |
|--------|---------|--------|----------|
| **DEV-2452** | [Outreach Profile] Copy/Paste text selection | Done | Jul 21 |

### 🔗 Related Service Desk (BACS)

| Ticket | Issue | Status |
|--------|-------|--------|
| **BACS-82** | Task not displaying on profile (Mac desktop) | Under investigation |
| **BACS-90** | Copy/Paste phone number and address → covered by DEV-2452 | Fixed, awaiting release |
| **BACS-91** | Can't upload docs from app | Done (6/26/26) |
| **BACS-92** | Search other fields → covered by DEV-2461 | Low urgency |
| **BACS-93** | Tasks not appearing in profile summary | Paul investigating |
| **BACS-94** | Doc Library folders → covered by DEV-2465 | Not started |

---

## � Appendix B: Codebase Audit Summary

### 1. SelahTeamEnum Deprecation (Teams Cutover) — 71 refs, 20 files

| Layer | What's Left | Files |
|-------|------------|-------|
| **Enum definition** | `SelahTeamEnum` still defined with 16 choices | `common/enums.py:15-34` |
| **Shim** | `team_shim.py` bridges old enum → new FK | `common/team_shim.py` (entire file) |
| **DB columns** | `old_team` column still on `notes_note` + `tasks_task` | `notes/models.py:161`, `tasks/models.py:56` |
| **GraphQL types** | Deprecated `team` field on `NoteType`, `TaskType`, input types | `notes/types.py:134,180,250,264`, `tasks/types.py:33,123` |
| **Schema resolvers** | `team_shim.resolve_team_id_from_input` in mutations | `notes/schema.py:18`, `tasks/schema.py:12` |
| **Tests** | 30+ test references to `SelahTeamEnum.WDI_ON_SITE` etc. | `notes/tests/`, `tasks/tests/` |
| **Seed data** | `reports/management/commands/load_report_test_data.py:153` | `reports/` |
| **Migrations** | `old_team` baked into historical migrations | `notes/migrations/0001`, `tasks/migrations/0001` |

### 2. HasOrgPerm Migration (SDB-178 / Org Cutover)

| Status | Location | Detail |
|--------|----------|--------|
| ✅ Done | `shelters/schema.py` | All shelter mutations use `@HasOrgPerm` |
| ✅ Done | `reports/schema.py` | Reports use `@HasOrgPerm` |
| ✅ Done | `betterangels-admin` | Uses `useActiveOrg` + `X-Organization-ID` header |
| ❌ Pending | `accounts/schema.py:63,98` | TODO(SDB-178) — still uses `organization_id` arg |
| ❌ Pending | `notes/schema.py:123-124` | TODO(org-scoping) — still uses `resolve_permission_group()` |
| ❌ Pending | `clients/services/client_document.py:56-59` | TODO(org-scoping) — still uses `resolve_permission_group()` |
| ❌ Pending | `clients/schema.py:605` | Uses `resolve_permission_group()` |
| ❌ Pending | `hmis/schema.py:383` | Uses `resolve_permission_group()` |
| ❌ Pending | `notes/services.py` | Uses `resolve_permission_group()` |
| ❌ Pending | `referrals/schema.py` | Uses `resolve_permission_group()` |
| ❌ Pending | `tasks/schema.py` | Uses `resolve_permission_group()` |
| ❌ Pending | `betterangels` (mobile) | Does NOT send `X-Organization-ID` header yet |

### 3. Django Guardian — 53 references across 8 files

| Usage | Files |
|-------|-------|
| **Models (obj permission bases)** | `accounts/models.py`, `common/models.py`, `notes/models.py` |
| **Settings** | `betterangels_backend/settings.py` (INSTALLED_APPS, AUTHENTICATION_BACKENDS, GUARDIAN_* settings) |
| **Permission assignment** | `common/permissions/utils.py`, `clients/scripts/backfill_attachment_perms.py` |
| **Merge logic** | `clients/services/merge.py` (merge + undo guardian perms) |
| **Tests** | `clients/tests/test_merge_service.py` (GuardianPermissionTests) |

### 4. Other Codebase Findings

| Finding | Detail |
|---------|--------|
| **Waffle feature flags** | Present in codebase (`common/tests/test_queries.py`) but only used in tests. Consider removing if no production flags exist. |
| **Skipped tests** | `apps/wildfires/src/app/app.spec.tsx` — 2 `it.skip` tests |
| **Temporary suppressions** | `apps/shelter-web/src/app/app.spec.tsx:4` — ESLint suppression for "incremental cleanup" |
| **`backfill_attachment_perms.py`** | Management script that directly uses `guardian.shortcuts.assign_perm` — needs updating after guardian removal |
| **`hmis/enums.py`** | `PARTIAL` SSN enum value — verify this is still relevant |
| **`common/enums.py`** | `ImagePresetEnum` defined alongside `SelahTeamEnum` — keep |
| **No feature flag system in frontend** | No `FeatureFlag`/`isEnabled` usage found in TS/TSX — all feature gating is server-side only |

---

## 📋 Appendix C: Self-Service Onboarding — Current State & Gaps

### What Exists Today

- `createOrganization` GraphQL mutation with org type selection (outreach / shelter)
- `allow_public_signup=True` flag on shelter org type
- Organization creation service with owner role assignment + permission group reconciliation
- Invitation backend with email templates for welcome + invite
- `OrganizationMiddleware` + `X-Organization-ID` header plumbing
- `useActiveOrg` hook with org selector dropdown in admin portal

### What "Polish" Means

| # | Gap | Effort |
|---|-----|--------|
| 1 | **Public signup page** — No standalone page for shelters to discover and self-register without BA staff intervention | M |
| 2 | **Invite-team UI** — No UI in operator portal for org admin to send email invites to team members | M |
| 3 | **Guided setup wizard** — After org creation, no step-by-step flow: add shelter profile → create beds → set availability | L |
| 4 | **"Claim existing shelter" flow** — If a shelter is already seeded in DB, new users can't claim it; they'd create duplicates | M |
| 5 | **Email template polish** — Templates exist but need design review and deliverability testing | S |

---

## 🔗 Reference Links

- **Partnership folder**: [Google Drive](https://drive.google.com/drive/u/1/folders/1-3IR0oYUVm9Pix9pSCBGxLd5b_HVBJ4Z)
- **Roadmaps folder**: [Google Drive](https://drive.google.com/drive/u/1/folders/1twXpcCtNglhZWkRkKJdG6XGLgJuki08S)
- **BA Tech Team Vision**: Internal doc (Michelle's May 2026 proposal)
- **Shelter Availability Roll-Out Plan**: [Confluence](https://betterangels.atlassian.net/wiki/spaces/DEV/pages/513343490)
- **Customer Support Portal**: [Jira Service Desk](https://betterangels.atlassian.net/servicedesk/customer/portals)
- **Onboarding Plan (for partners)**: [Google Doc](https://docs.google.com/document/d/1LlseaCml9cyOV0Ru0mBcaGJszf0tUloqOEVSzPke1Gw/edit)
