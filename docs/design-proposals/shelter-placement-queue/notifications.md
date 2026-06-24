# Notifications: Shelter Placement Queue

## Overview

Shelters can subscribe to email notifications about clients in the queue who match their acceptance criteria. This keeps shelters informed without requiring them to manually check the queue.

---

## Model: `QueueNotificationSubscription`

```python
class NotificationFrequency(models.TextChoices):
    DAILY = "daily", "Daily"
    WEEKLY = "weekly", "Weekly"
    ON_DEMAND = "on_demand", "On Demand"

class QueueNotificationSubscription(models.Model):
    shelter = models.ForeignKey(
        Shelter,
        on_delete=models.CASCADE,
        related_name="notification_subscriptions",
    )
    email_recipients = models.TextField(
        help_text="Comma, semicolon, space, or newline separated email addresses",
        validators=[validate_email_list],  # Reuse existing validator from reports
    )
    frequency = models.CharField(
        choices=NotificationFrequency.choices,
        max_length=20,
        default=NotificationFrequency.DAILY,
    )
    is_active = models.BooleanField(default=True)
    last_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [("shelter",)]  # One subscription per shelter
        verbose_name = "Queue Notification Subscription"
        verbose_name_plural = "Queue Notification Subscriptions"
```

### Why a Dedicated Model vs. Extending ScheduledReport

The existing `ScheduledReport` model is designed for **organization-level scheduled data exports** (monthly interaction reports). The placement queue notifications are:

- **Shelter-level**, not org-level
- **On-demand capable** (not just scheduled)
- **Query-driven** (run the matching engine at send time)
- **Single-email digest**, not a report attachment

A dedicated model is simpler and avoids overloading `ScheduledReport` with queue-specific logic.

---

## Celery Task

A periodic task that checks for subscriptions due for delivery and sends digest emails.

```python
# shelters/tasks.py

@app.task
def send_queue_notifications():
    """Send placement queue digest emails to shelters due for notification."""
    now = timezone.now()
    subscriptions = QueueNotificationSubscription.objects.filter(
        is_active=True,
    ).select_related("shelter")

    for sub in subscriptions:
        if not _is_due(sub, now):
            continue

        matching_referrals = _get_matching_referrals(sub.shelter)

        if matching_referrals.exists():
            _send_digest_email(sub, matching_referrals)

        sub.last_sent_at = now
        sub.save(update_fields=["last_sent_at"])


def _is_due(sub: QueueNotificationSubscription, now: datetime) -> bool:
    if sub.frequency == NotificationFrequency.ON_DEMAND:
        return False  # Only sent via manual trigger
    if sub.last_sent_at is None:
        return True  # Never sent — send immediately
    if sub.frequency == NotificationFrequency.DAILY:
        return (now - sub.last_sent_at) >= timedelta(days=1)
    if sub.frequency == NotificationFrequency.WEEKLY:
        return (now - sub.last_sent_at) >= timedelta(days=7)
    return False


def _get_matching_referrals(shelter: Shelter) -> QuerySet[Referral]:
    """Find queued referrals matching the shelter's criteria."""
    # Reverse of get_matching_shelters: find referrals that match this shelter
    criteria = shelter.placement_criteria  # computed from shelter M2Ms
    return Referral.objects.filter(
        status=Referral.Status.QUEUED,
        shelter__isnull=True,
        criteria__in=criteria,
    ).distinct().order_by("-created_at")


def _send_digest_email(sub, referrals):
    """Render and send digest email using existing email infrastructure."""
    # Reuses accounts.tasks.send_queued_mail or similar
    ...
```

### Celery Beat Schedule

```python
# betterangels_backend/celery.py
app.conf.beat_schedule = {
    # ... existing tasks ...
    "send-queue-notifications": {
        "task": "shelters.tasks.send_queue_notifications",
        "schedule": crontab(hour=8, minute=0),  # Daily at 8 AM
    },
}
```

The task runs daily. It internally checks each subscription's frequency to determine if that subscription should actually send.

---

## Digest Email Format

### Subject
```
[N] matching clients in the Better Angels placement queue
```

Where `N` is the count of matching referrals.

### Body Template

```html
<h2>Placement Queue Update for {{ shelter.name }}</h2>

<p>There are <strong>{{ referral_count }}</strong> clients in the queue
matching your shelter's criteria:</p>

<table>
  <tr>
    <th>Client</th>
    <th>Matched Criteria</th>
    <th>Referred</th>
  </tr>
  {% for referral in referrals %}
  <tr>
    <td>{{ referral.client_profile.full_name }}</td>
    <td>{{ referral.matching_criteria|join:", " }}</td>
    <td>{{ referral.created_at|timesince }} ago</td>
  </tr>
  {% endfor %}
</table>

<p>
  <a href="{{ shelter_queue_url }}">
    View full queue →
  </a>
</p>

<p style="color: #666; font-size: 12px;">
  You're receiving this because {{ shelter.name }} is subscribed to
  placement queue notifications.
  <a href="{{ notification_settings_url }}">Manage settings</a>
</p>
```

### On-Demand

The "Send Now" button in the UI calls the `sendOnDemandNotification` mutation, which runs the same digest logic immediately for that shelter. This bypasses the frequency check.

---

## Email Infrastructure Dependency

The project uses Celery with a `send-queued-mail` task. The queue notification digest leverages this same infrastructure. The digest email is rendered via Django templates and sent via the existing email backend.

---

## Future Enhancements

| Feature | Description |
|---|---|
| **Criteria threshold** | Only send if N+ new clients match since last send |
| **Per-criterion subscriptions** | "Notify me only about veterans and seniors" |
| **SMS/webhook** | Support non-email notification channels |
| **Digest frequency per shelter** | Allow shelters to pick their own send time |
