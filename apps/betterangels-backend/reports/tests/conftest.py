"""Shared fixtures and test configuration for reports app tests."""

from __future__ import annotations

from typing import Dict

import pytest
from model_bakery import baker
from organizations.fields import SlugField

# Ensure model_bakery can generate slugs for Organization
baker.generators.add(SlugField, lambda: baker.seq("org-"))  # type: ignore[no-untyped-call]


@pytest.fixture(autouse=True)
def mock_redbeat(monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock RedBeat scheduler to avoid Redis dependency during tests."""
    store: Dict[str, object] = {}

    class FakeSchedule:
        def __init__(self, hour: int, day_of_month: int) -> None:
            self.hour = {hour}
            self.day_of_month = {day_of_month}

    class FakeEntry:
        def __init__(
            self,
            name: str,
            task: str,
            schedule: FakeSchedule,
            args: tuple,
            app: object | None = None,
        ) -> None:
            self.name = name
            self.task = task
            self.schedule = schedule
            self.args = args
            self.app = app

        def save(self) -> None:
            store[self.name] = self

        def delete(self) -> None:
            store.pop(self.name, None)

        @classmethod
        def from_key(cls, name: str, app: object | None = None) -> "FakeEntry":
            if name not in store:
                raise KeyError
            return store[name]  # type: ignore[return-value]

    def fake_crontab(hour: int, day_of_month: int) -> FakeSchedule:
        return FakeSchedule(hour=hour, day_of_month=day_of_month)

    # Patch the redbeat module directly so imports in tests use the fake entry
    import redbeat  # type: ignore[import-untyped]
    import redbeat.schedulers as schedulers  # type: ignore[import-untyped]

    monkeypatch.setattr(redbeat, "RedBeatSchedulerEntry", FakeEntry)
    monkeypatch.setattr(schedulers, "RedBeatSchedulerEntry", FakeEntry)

    # Patch test modules that import RedBeatSchedulerEntry directly
    monkeypatch.setattr("reports.tests.test_models.RedBeatSchedulerEntry", FakeEntry)
    monkeypatch.setattr("reports.tests.test_schedule_manager.RedBeatSchedulerEntry", FakeEntry)

    # Patch schedule_manager module
    import reports.utils.schedule_manager as sm

    monkeypatch.setattr(sm, "RedBeatSchedulerEntry", FakeEntry)
    monkeypatch.setattr(sm, "crontab", fake_crontab)

    # Patch reports.models module
    import reports.models as rm

    monkeypatch.setattr(rm, "RedBeatSchedulerEntry", FakeEntry)
    monkeypatch.setattr(rm, "crontab", fake_crontab)
