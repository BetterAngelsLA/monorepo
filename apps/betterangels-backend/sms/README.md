# `sms` app

A provider-agnostic SMS abstraction for the Betterangels backend.

> **Status: Demo / evaluation only.** Nothing in this app is wired into
> production code paths yet. Treat everything here as
> exploratory scaffolding — APIs and provider choices may change before
> anything ships.

## What this app is for

We need to send SMS (and eventually manage subscribers / campaigns) for
outreach workflows. Rather than couple the codebase to one vendor's SDK,
this app defines a small set of **capability interfaces** that calling
code depends on, and ships several **provider implementations** behind
those interfaces. Swapping vendors — or using different vendors for
different capabilities — should not require changes in calling code.

## Layout

```
sms/
├── capabilities.py     # ABCs: MessageSender, ContactManager,
│                       #       SubscriptionManager, PhoneValidator
├── types.py            # Provider-agnostic DTOs (Contact, SendResult,
│                       #   PhoneValidationResult)
├── enums.py            # SubscriptionStatus, PhoneType
├── errors.py           # SmsError + ProviderError hierarchy
├── utils/
│   └── phone_number.py # E.164 parsing/validation via `phonenumbers`
├── providers/          # One module per vendor; each mixes in only the
│   │                   #   capabilities it actually supports.
│   ├── local.py            # dev provider — logs to stdout / writes files
│   ├── twilio_provider.py  # MessageSender + PhoneValidator
│   ├── ez_texting.py       # MessageSender + ContactManager + SubscriptionManager
│   └── cheapest_texting.py # MessageSender + ContactManager + SubscriptionManager
├── management/
│   └── commands/       # Django management commands — one per provider.
│                       #   These are *demo* commands, not production tools.
└── tests/
```

### Why segregated capability ABCs?

Vendors differ in what they offer:

| Capability            | Twilio | EZ Texting | CheapestTexting | Local |
| --------------------- | :----: | :--------: | :-------------: | :---: |
| `MessageSender`       |   ✓    |     ✓      |        ✓        |   ✓   |
| `PhoneValidator`      |   ✓    |     —      |        —        |   ✓   |
| `ContactManager`      |   —    |     ✓      |        ✓        |   ✓   |
| `SubscriptionManager` |   —    |     ✓      |        ✓        |   ✓   |

A single fat `SmsProvider` interface would force most providers to stub
out methods they can't implement. Instead, each capability is its own
small ABC, and providers mix in only what they support. Call sites
type-hint the narrowest capability they need
(`def notify(sender: MessageSender, ...)`).

## The `management/commands/*_demo.py` files

Each provider has a paired Django management command:

- `python manage.py twilio_demo ...`
- `python manage.py ez_texting_demo ...`
- `python manage.py cheapest_texting_demo ...`

**Why they exist:**

1. **Vendor evaluation.** We are actively comparing providers on cost,
   API ergonomics, deliverability, and feature coverage (lookup,
   campaigns, opt-in/out semantics). These commands are the cheapest way
   to exercise each vendor's API end-to-end against a real account
   without building any application UI or wiring up models.
2. **Live API smoke tests.** Unit tests use mocks; the demo commands hit
   the real vendor APIs with real credentials, which surfaces auth /
   payload-shape / rate-limit issues that mocks can't catch.
3. **Executable documentation.** Each command's docstring documents the
   minimum env vars needed and shows the canonical call sequence
   (create contact → send → subscribe → status → unsubscribe → remove).
   New engineers can read the file to learn how a vendor works.
4. **Discovery helpers.** Some vendors require IDs (group / campaign /
   trunk number) that aren't easily found in their dashboards. The
   `info` subcommands list those IDs so you can populate the
   corresponding settings.

**What they are NOT:**

- Not production code. They are intentionally thin wrappers around the
  provider classes, with `print` / `stdout` output and no transactional
  guarantees.
- Not invoked from any application code path. Nothing in `accounts/`,
  `clients/`, `notes/`, etc. imports from `sms` yet.
- Not a stable interface. Subcommand names and flags may change as we
  refine the provider abstractions.

When SMS moves out of evaluation, the demo commands will likely be
trimmed down (or removed) and replaced by proper services / Celery
tasks that depend on the capability ABCs rather than concrete providers.

## Configuration

Each provider reads its credentials from Django settings (typically
populated from environment variables). See the module-level docstrings
in each provider file for the exact variables required:

- [providers/twilio_provider.py](providers/twilio_provider.py)
- [providers/ez_texting.py](providers/ez_texting.py)
- [providers/cheapest_texting.py](providers/cheapest_texting.py)
- [providers/local.py](providers/local.py)

The `local` provider requires no credentials and is the default for
local development.

## Adding a new provider

1. Create `sms/providers/<vendor>.py`.
2. Inherit only the capability ABCs the vendor actually supports.
3. Translate vendor responses into the DTOs in `types.py` and wrap
   vendor SDK exceptions in `ProviderError`.
4. (Optional, while in demo mode) Add a
   `management/commands/<vendor>_demo.py` so the vendor can be
   exercised end-to-end without touching application code.
