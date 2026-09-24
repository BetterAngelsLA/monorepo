from typing import Any

from django import forms
from django.contrib import admin

from .models import Team


class TeamAdminForm(forms.ModelForm):
    """Fix a team's organization once the row exists.

    Notes and tasks validate that their team belongs to their own organization,
    so repointing a team leaves every record already holding it in a state its
    own ``clean()`` rejects -- unsavable, with nothing on this page to say why.
    This form is the only writer that can reach the field: ``UpdateTeamInput``
    carries just ``name`` and ``is_active``.

    ``disabled`` rather than ``ModelAdmin.readonly_fields``: a read-only field is
    dropped from the form, which puts it in the ModelForm's validation
    exclusions, and ``UniqueConstraint.validate`` skips any constraint whose
    expressions reference an excluded field.  That would take
    ``unique_team_name_per_org`` down with it and turn a duplicate rename into an
    unhandled IntegrityError.  A disabled field stays on the form and ignores
    submitted data in favour of its initial value.
    """

    class Meta:
        model = Team
        fields = "__all__"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        if self.instance.pk:
            self.fields["organization"].disabled = True


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    form = TeamAdminForm
    list_display = ("name", "organization", "created_at", "updated_at")
    list_filter = ("organization",)
    search_fields = ("name", "organization__name")
    ordering = ("organization", "name")
