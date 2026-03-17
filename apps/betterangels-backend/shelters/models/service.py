"""Data-driven service catalog models.

``ServiceCategory`` and ``Service`` are fully data-driven — administrators
can add, rename, and reorder entries without a code deploy.
"""

from common.models import BaseModel
from django.db import models
from django.db.models import UniqueConstraint
from django.db.models.functions import Lower


class ServiceCategory(BaseModel):
    """A grouping for services (e.g. "Immediate Needs", "Health Services")."""

    name = models.CharField(max_length=255, unique=True)
    display_name = models.CharField(max_length=255)
    priority = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["priority", "display_name"]
        verbose_name_plural = "Service categories"

    def __str__(self) -> str:
        return self.display_name


class Service(BaseModel):
    """A service a shelter can offer, organized by category."""

    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.CASCADE,
        related_name="services",
    )
    name = models.CharField(max_length=255)
    display_name = models.CharField(max_length=255)
    is_other = models.BooleanField(default=False, db_index=True)
    priority = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["category__priority", "is_other", "priority", "display_name"]
        constraints = [
            UniqueConstraint(
                Lower("name"),
                "category",
                name="service_name_category_ci_unique",
            ),
        ]

    def __str__(self) -> str:
        return self.display_name
