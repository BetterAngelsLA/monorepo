# iOS build credentials — expiry and renewal

## Summary

iOS build credentials expire roughly every 12 months. When they do, the build fails with `Provisioning Profile has expired`, and **CI cannot renew them** — it is configured to never modify credentials. Renewal is manual, through the interactive `eas credentials` menu, and must cover **both** bundles, not just the one that is currently failing.

Renewing one does not renew the other: `preview` was renewed on 2026-10-01 and `production` was not — the next production build failed the same day.

## Background: what these credentials are

When you build an iOS app outside Xcode, two separate things get stored on EAS's servers:

| Thing | What it does | Scope |
| --- | --- | --- |
| **Distribution certificate** | Proves to Apple that your team is allowed to sign an app | Team-wide, shared |
| **Provisioning profile** | Binds that certificate to a specific bundle ID + distribution type (App Store or Ad Hoc) | **Per bundle ID** |

The provisioning profile is scoped to a single bundle ID. This repo ships **two** bundles from one Expo project (`app.config.js:15`):

| eas.json profile | Bundle ID | Distribution | Used by |
| --- | --- | --- | --- |
| `production` | `la.betterangels.app` | store | production releases |
| `preview` | `la.betterangels.dev.app` | Ad Hoc | dev-client / preview builds |

The two profiles have independent expiry dates; either can expire while the other stays valid. On 2026-10-01 the `preview` profile was renewed and the `production` profile was not.

## Why they expire

Apple issues these for a fixed window (~12 months) and caps how many can exist at once. There is no auto-renewal.

A provisioning profile embeds the certificate it was issued against, so rotating the distribution certificate invalidates every profile that references the old one. This is why an expired profile can coexist with a valid certificate, and why both should be renewed together.

## Renewal

Credentials are attached to build profiles — the entries in `eas.json` (`production`, `preview`). There is no config file to edit; renewal happens in the interactive `eas credentials` menu, which has no non-interactive mode. Run it once per profile:

```bash
cd apps/betterangels
npx -y eas-cli credentials:configure-build -p ios -e production
npx -y eas-cli credentials:configure-build -p ios -e preview
```

At the prompts:

1. **Log in to your Apple account** → yes. Choose the **existing App Store Connect API Key** if offered (fall back to Apple ID + 2FA otherwise).
2. **Distribution certificate** → if the existing one is still valid, **reuse it**. Don't regenerate and don't revoke. You'll be shown the serial and expiry — check it before deciding.
3. **Provisioning profile** → if it's expired or invalid, **generate a new one** for the *correct bundle ID* and distribution type (`la.betterangels.app` + store, or `la.betterangels.dev.app` + Ad Hoc).
4. Push Notifications key → leave alone, unrelated.

Then confirm the new profile's expiry is ~12 months out, and repeat for the other profile.

**Dangerous prompt:** EAS will offer to **revoke** certificates when Apple's limit is hit. Only accept this for a certificate whose expiry is already in the past — revoking a valid certificate breaks the bundle that uses it.

**Verify the bundle.** While configuring `production`, if a prompt mentions `la.betterangels.dev.app` or **Ad Hoc**, stop: the profile did not resolve as expected and you are about to modify the wrong bundle's credentials.

## After renewal

```bash
gh run rerun <run-id> --repo BetterAngelsLA/monorepo --failed
```

Confirm the "Build and Push Artifacts" step passes, then check a build was produced:

```bash
npx -y eas-cli build:list --platform ios --build-profile production --limit 3 --non-interactive
```

## Why expiry goes unnoticed

- **CI cannot renew credentials.** The deploy script passes `--freeze-credentials` (`eas-deploy.ts:154`) — deliberate, so CI never modifies the Apple account — and an expiry stays a hard failure until a human renews it.
- **CI often skips the build entirely.** The EAS build is skipped when a build already exists for the current app fingerprint (`eas-deploy.ts:145`). Fingerprints change mostly on version bumps (the version fields in `app.config.js` are part of the fingerprint), so credentials can go unexercised for weeks: the last successful prod build was **Aug 31** (v1.2.11), and the next prod build attempt — **Oct 1** — failed on the expired profile.
- Production builds only run on merges to `main` (`default.yml:25`).

**A green pipeline is not evidence that credentials are valid.**

## Maintenance

- Renew **both bundles in the same sitting**; renewing one and not the other is what caused this outage.
- Keep a calendar reminder, or add a scheduled job that warns ≥30 days before expiry.
- Expect this roughly annually. It is routine maintenance, not an incident.
