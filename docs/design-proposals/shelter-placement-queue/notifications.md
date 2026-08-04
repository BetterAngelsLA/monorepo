# Notifications: Shelter Placement Queue (Deferred to v2)

## Status: Deferred

Email notifications for queue updates are deferred to a future version. The
codebase already has the infrastructure needed (`django-post_office` + Celery +
`send_queued_mail`). When shelters request this feature, implementation should
follow this progression:

### Phase 1: Simple Management Command (v2 MVP)

A Django management command that queries matching referrals and sends a digest
via the existing email infrastructure:

```python
# shelters/management/commands/send_queue_digest.py
from django.core.management.base import BaseCommand
from referrals.selectors import get_matching_shelters

class Command(BaseCommand):
    def handle(self, **options):
        for shelter in Shelter.objects.filter(status=APPROVED):
            referrals = Referral.objects.filter(
                status=Referral.Status.QUEUED,
                shelter__isnull=True,
            )
            matching = [r for r in referrals if shelter in get_matching_shelters(r)]
            if matching:
                send_digest_email(shelter, matching)
```

Run via cron or Celery Beat with a single schedule entry.

### Phase 2: Per-Shelter Preferences (v2+)

If shelters request per-frequency preferences, per-recipient settings, or on-demand
digests, graduate to a `QueueNotificationSubscription` model:

```python
class QueueNotificationSubscription(models.Model):
    shelter = models.ForeignKey(Shelter, ..., unique=True)
    email_recipients = models.TextField(...)
    frequency = models.CharField(choices=[DAILY, WEEKLY, ON_DEMAND], ...)
    is_active = models.BooleanField(default=True)
    last_sent_at = models.DateTimeField(null=True)
```

This is intentionally deferred. The original proposal's full notification
subsystem (dedicated model + Celery beat + GraphQL types + email templates) was
premature optimization. Start simple, add complexity only when needed.

### Why Defer

1. **Infrastructure already exists.** `django-post_office` + Celery handles email
   delivery. A management command is ~30 lines.
2. **Unclear demand.** Do shelters actually want email digests, or do they prefer
   checking the queue page? Build the queue page first, then ask.
3. **Simple things should be simple.** A cron job + management command is easier
   to understand, debug, and modify than a dedicated model + GraphQL mutations +
   Celery beat schedule.
