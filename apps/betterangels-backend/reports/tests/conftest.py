"""Shared fixtures and test configuration for reports app tests."""

from __future__ import annotations

from model_bakery import baker
from organizations.fields import SlugField

# Ensure model_bakery can generate slugs for Organization
baker.generators.add(SlugField, lambda: baker.seq("org-"))  # type: ignore[no-untyped-call]
