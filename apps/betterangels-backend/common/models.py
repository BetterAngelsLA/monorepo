import json
from dataclasses import dataclass
from typing import Any, ClassVar, Dict, Iterator, Optional, cast

from common.enums import AttachmentType
from common.files.utils import get_unique_file_path
from common.permissions.registry import PermissionSet
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.db.models import PointField
from django.contrib.gis.geos import Point
from django.db import models
from django.db.models import ForeignKey
from django.db.models.functions import Lower
from django_choices_field import TextChoicesField
from guardian.models import GroupObjectPermissionBase, UserObjectPermissionBase
from phonenumber_field.modelfields import PhoneNumberField


class BaseModel(models.Model):
    class perms(PermissionSet):
        pass

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# Access classes (ADR 0004; RFC 0002 §Precondition / ADR 0001 §2.5).
# ``visible``/``writable``/``can_obj``/``can_model`` consult a model's declared
# classes independently of ``org_via`` (its reach).  ORG is the derived default
# for any org-anchored model (``org_via`` not ``None``) and needs no
# declaration; these constants are the explicit values a model names when a
# derived default is not what its rows need.  One slot per model, per direction,
# so every surface answers from the same fact.
WRITE_SHARED = "shared"
"""Platform-shared write class: any holder of the permission anywhere may act."""

WRITE_OBJECT = "object"
"""Object-grant write class: only an object ``Grant`` (or the global tier) may act.

The arm for a row whose organization cannot be derived — a platform-shared or
polymorphic model.  ``Attachment`` declares it: attachments are polymorphic over
``content_object`` with no org column, so no org path exists and a per-record
grant is the only reach that can authorize one.  Declaring it requires the model
to be in ``OBJECT_GRANT_WHITELIST`` (``permissions.E007``).
"""

ACCESS_GLOBAL = "global"
"""GLOBAL read class: only the global tier passes — org reach never widens it.

Declared in ``Access.read`` for models whose rows are platform-staff-only in
authority even though their reach is org-anchored (``org_via`` not ``None``):
the org graph exists for scoping and object-grant cascades, never to widen who
may read.  A scoped Grant holding the very same permission still sees nothing.
"""

WRITE_GLOBAL = "global"
"""GLOBAL write class: only the global tier may act.

The write-side counterpart of :data:`ACCESS_GLOBAL`, declared in
``Access.write`` for org-anchored models whose writes are platform-staff-only
(e.g. BA-only fields).  Scoped Grants lose the ability entirely — a policy the
model declares once, instead of a call-site tier check per surface.
"""


@dataclass(frozen=True)
class Access:
    """Authority classes for a model's rows, per direction (ADR 0004).

    One declaration slot, separate from reach (``org_via``): ``None`` leaves the
    derived rules in charge, explicit values name the class the selectors
    enforce.  The direction resolves by codename convention (``view_*`` →
    ``read``, everything else → ``write``), in one helper in
    ``common.permissions.selectors``.

    ``read`` values:

    * ``None`` — derive by reach: org-scoped rows for an org-anchored model;
      all-or-none for a platform-shared model.
    * :data:`ACCESS_GLOBAL` — only the global tier passes; org scopes never
      widen it.

    ``write`` values:

    * ``None`` — derive: ORG for an org-anchored model (``org_via`` not
      ``None``); fail closed for a platform-shared model (only the global tier
      may act) — the safe default (finding C1).
    * :data:`WRITE_SHARED` — any holder of the permission anywhere may act.
    * :data:`WRITE_GLOBAL` — only the global tier may act (the org-anchored
      narrowing; a scoped Grant loses the ability).
    * :data:`WRITE_OBJECT` — reserved until the object arm wires its first
      consumer.
    """

    read: str | None = None
    write: str | None = None


class ScopedResource(models.Model):
    """Declares how a model reaches the organizations that scope it (ADR 0001).

    ``org_via`` names *relations*, not lookup paths, and is resolved by
    :meth:`org_paths`:

    * ``()``            — the model's own ``organization`` FK
    * ``("shelter",)``  — hop these relations (each single-valued); a row is in
                      scope for every organization it reaches
    * ``None``          — platform-shared; deliberately unscoped

    ``own_org_or`` adds the row's *own* ``organization`` FK as a further reach
    path alongside those hops — the "own org **or** via X" shape, which
    ``org_via`` alone cannot express (it is either ``()`` or a hop tuple, never
    both).  A model whose rows can be NULL in the own-org FK *and* every hop
    matches no org at all: those rows answer to the global tier only, never to
    every org.

    Object-grant ancestors are derived from the same graph, so this one
    declaration drives both the org filter and the object-grant cascade.
    """

    org_via: ClassVar[tuple[str, ...] | None] = ()
    own_org_or: ClassVar[tuple[str, ...]] = ()
    _org_paths: ClassVar[tuple[str, ...] | None] = None

    access: ClassVar[Access] = Access()
    """Authority classes for this model's rows (ADR 0004).

    Read by the selectors — ``visible`` / ``writable`` / ``can_obj`` /
    ``can_model`` — so authority is declared once and every surface answers
    from the same fact:

    * ``access.read = ACCESS_GLOBAL`` — platform-staff-only rows: only the
      global tier passes; a scoped Grant holding the perm sees none.
    * ``access.write`` — platform-shared models choose SHARED or the
      fail-closed default; org-anchored models may narrow to ``WRITE_GLOBAL``.
    * ``permissions.E007`` validates the values — a typo fails the deploy
      rather than silently enforcing nothing.
    """

    class Meta:
        abstract = True

    @classmethod
    def org_paths(cls) -> tuple[str, ...]:
        """Lookup paths from this model to an organization id.

        e.g. ``("shelter__organization_id",)`` for a bed, or
        ``("bed__shelter__organization_id", "room__shelter__organization_id")``
        for a reservation.

        Cached per model — ``cls.__dict__``, not ``getattr``, so a subclass never
        inherits its parent's paths.  A multi-valued or non-``ScopedResource`` hop
        raises ``TypeError``; ``permissions.E004`` surfaces the same condition as
        a deploy-time error.
        """
        # ``cls.__dict__`` (not ``getattr``) so a subclass never inherits its
        # parent's cached paths when it overrides ``org_via``.
        cached = cls.__dict__.get("_org_paths")
        if cached is None:
            cached = tuple(cls._resolve_org_paths())
            cls._org_paths = cached
        return cast(tuple[str, ...], cached)

    @classmethod
    def _resolve_org_paths(cls) -> Iterator[str]:
        if cls.org_via is None:
            return
        hops = cls.org_via
        if not hops:
            field = cls._meta.get_field("organization")
            if not (field.many_to_one or field.one_to_one):
                raise TypeError(f"{cls.__name__}.org_via=() requires a single-valued 'organization' FK.")
            yield f"{field.name}_id"
            return
        for hop in hops:
            field = cls._meta.get_field(hop)
            if not (field.many_to_one or field.one_to_one):
                raise TypeError(
                    f"{cls.__name__}.org_via names {hop!r}, which is multi-valued; "
                    "the scope filter would duplicate rows (permissions.E004)."
                )
            target = field.related_model
            if target is None:
                raise TypeError(f"{cls.__name__}.org_via hop {hop!r} has no related model.")
            if not issubclass(target, ScopedResource):
                raise TypeError(
                    f"{cls.__name__}.org_via hop {hop!r} targets {target.__name__}, which does not declare ScopedResource."
                )
            for sub in target.org_paths():
                yield f"{hop}__{sub}"

        # ``own_org_or`` — the row's own org is an ADDITIONAL reach alongside the
        # hops above, which is what makes "own org or via X" expressible.  The
        # own FK is nullable on the models that need this, so this path simply
        # matches nothing for a NULL row rather than widening it.
        if cls.own_org_or:
            field = cls._meta.get_field("organization")
            if not (field.many_to_one or field.one_to_one):
                raise TypeError(f"{cls.__name__}.own_org_or requires a single-valued 'organization' FK.")
            yield f"{field.name}_id"


class Attachment(ScopedResource, BaseModel):
    """A file attached to any model instance (polymorphic ``content_object``).

    ``org_via = None`` — platform-shared reach: an attachment has no org column
    and its ``GenericForeignKey`` parent is inexpressible as a single-valued org
    path, so there is no org reach to scope a row by.  ``access.write =
    WRITE_OBJECT`` makes that explicit: a row is writable only by the global tier
    or by a user-principal object ``Grant`` naming it (ADR 0001 §2.5), which is
    what replaces the per-file guardian rows this model used to carry.

    Read authority is NOT this model's reach — see ``clients.schema``, which
    scopes the document list through the parent ``ClientProfile`` the attachment
    belongs to.  Per-record object grants are additive on top of that.
    """

    org_via = None
    access = Access(write=WRITE_OBJECT)

    file = models.FileField(upload_to=get_unique_file_path)
    attachment_type = TextChoicesField(choices_enum=AttachmentType)
    mime_type = models.CharField()
    original_filename = models.CharField(max_length=255, blank=True, null=True)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    namespace = models.CharField(max_length=255, blank=True, null=True)

    uploaded_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, related_name="uploaded_attachments"
    )

    def __str__(self) -> str:
        return f"{self.content_object} {self.object_id} - {self.attachment_type} - {self.original_filename}"

    class Meta:
        indexes = [
            models.Index(
                fields=[
                    "object_id",
                    "content_type_id",
                    "namespace",
                    "attachment_type",
                ],
                name="attachment_comp_idx",
            ),
            models.Index(
                fields=["content_type", "object_id"],
                name="attachment_gfk_idx",
            ),
        ]


class Address(BaseModel):
    street = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=10, blank=True, null=True)
    confidential = models.BooleanField(null=True, blank=True)

    formatted_address = models.CharField(max_length=255, blank=True, null=True)

    objects = models.Manager()

    class Meta(BaseModel.Meta):
        indexes = [
            models.Index(
                Lower("street"),
                Lower("city"),
                Lower("state"),
                Lower("zip_code"),
                name="address_lookup_idx",
            )
        ]
        constraints = [
            models.UniqueConstraint(
                Lower("formatted_address"),
                condition=models.Q(formatted_address__isnull=False),
                name="unique_formatted_address",
            )
        ]

    ADDRESS_DEFAULT = "No Address"

    def __str__(self) -> str:
        if self.street and self.city and self.state and self.zip_code:
            return f"{self.street}, {self.city}, {self.state}, {self.zip_code}"
        elif self.formatted_address:
            return self.formatted_address

        return self.ADDRESS_DEFAULT


class Location(BaseModel):
    # 5 decimal places ≈ 1.1 m — filters mobile GPS jitter while
    # preserving individual-building precision.
    GPS_PRECISION = 5

    address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True)
    point = PointField(geography=True)
    point_of_interest = models.CharField(max_length=255, blank=True, null=True)

    objects = models.Manager()

    def __str__(self) -> str:
        if self.address and str(self.address) != Address.ADDRESS_DEFAULT:
            return str(self.address)

        return str(self.point.coords)

    @staticmethod
    def _get_component_value(component: dict, name_type: str) -> Optional[str]:
        """Read a value from an address component, supporting both v1 and legacy formats.

        v1 format uses longText/shortText; legacy format uses long_name/short_name.
        """
        if name_type == "long_name":
            return component.get("longText") or component.get("long_name")
        elif name_type == "short_name":
            return component.get("shortText") or component.get("short_name")
        return None

    @staticmethod
    def parse_address_components(address_components: str) -> dict:
        address_fields = {
            "street_number": "long_name",  # House/building number
            "route": "long_name",  # Street name
            "locality": "long_name",  # City
            "administrative_area_level_1": "short_name",  # State
            "country": "long_name",
            "postal_code": "long_name",
            "point_of_interest": "long_name",
        }

        components = json.loads(address_components)
        parsed_address = {
            field: next(
                (
                    Location._get_component_value(component, name_type)
                    for component in components
                    if field in component.get("types", [])
                ),
                None,
            )
            for field, name_type in address_fields.items()
        }

        return parsed_address

    @staticmethod
    def _clean(value: Optional[str]) -> Optional[str]:
        """Strip leading/trailing whitespace and collapse internal runs.

        Returns None for blank/empty strings.
        """
        if value is None:
            return None
        value = " ".join(value.split()).strip()
        return value or None

    @staticmethod
    def _round_point(point: Point) -> Point:
        """Round a Point's coordinates to GPS_PRECISION decimal places.

        Eliminates sub-metre GPS jitter so that nearby pin-drops resolve
        to the same Location row instead of creating duplicates.
        """
        p = Location.GPS_PRECISION
        return Point(round(point.x, p), round(point.y, p), srid=point.srid)

    @classmethod
    def get_or_create_address(cls, address_data: Dict[str, Any]) -> Optional["Address"]:
        """Get or create an Address, deduplicating by formatted_address.

        ``formatted_address`` is the canonical unique key (case-insensitive).
        Address components (street, city, state, zip) are parsed from
        ``address_components`` when present and stored on the row as metadata
        during initial creation; they are never used as lookup keys.

        When neither ``formatted_address`` nor ``address_components`` is
        provided, returns ``None``.
        """
        raw_components = address_data.get("address_components")
        formatted = address_data.get("formatted_address") or address_data.get("formattedAddress")

        if not raw_components and not formatted:
            return None

        # Parse component fields when available (used as defaults on creation)
        street = city = state = zip_code = None
        if raw_components:
            parsed = cls.parse_address_components(raw_components)
            street_number = parsed.get("street_number")
            route = parsed.get("route")
            street = cls._clean(f"{street_number} {route}".strip() if street_number and route else route)
            city = cls._clean(parsed.get("locality"))
            state = cls._clean(parsed.get("administrative_area_level_1"))
            zip_code = cls._clean(parsed.get("postal_code"))

        # Primary dedup path: formatted_address (unique constraint)
        if formatted:
            address, _ = Address.objects.get_or_create(
                formatted_address__iexact=formatted,
                defaults={
                    "formatted_address": formatted,
                    "street": street,
                    "city": city,
                    "state": state,
                    "zip_code": zip_code,
                },
            )
            return address

        # Fallback: components present but no formatted_address
        fields = {"street": street, "city": city, "state": state, "zip_code": zip_code}
        lookup = {
            (f"{f}__isnull" if v is None else f"{f}__iexact"): (True if v is None else v) for f, v in fields.items()
        }
        address, _ = Address.objects.get_or_create(
            **lookup,
            defaults=fields,
        )
        return address

    @classmethod
    def get_point_of_interest(cls, address_data: Dict[str, Any]) -> Optional[str]:
        raw = address_data.get("address_components")
        if not raw:
            return None
        return cls.parse_address_components(raw).get("point_of_interest")

    @classmethod
    def get_or_create_location(cls, location_data: Dict[str, Any]) -> "Location":
        """Return an existing Location or create a new one.

        Deduplication is based on the triple (point, address, point_of_interest).
        If all three match an existing row, that row is reused — no data is
        overwritten.  Otherwise a new Location is created.
        """
        point = cls._round_point(location_data["point"])

        address_data = location_data.get("address")
        address = Location.get_or_create_address(address_data) if address_data else None

        poi = location_data.get("point_of_interest")
        if poi is None and address_data:
            poi = cls.get_point_of_interest(address_data)

        location, _ = Location.objects.get_or_create(
            point=point,
            address=address,
            point_of_interest=poi,
        )
        return location


class PhoneNumber(models.Model):
    number = PhoneNumberField(region="US", blank=True, null=True)
    is_primary = models.BooleanField(default=False)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object: GenericForeignKey = GenericForeignKey("content_type", "object_id")

    objects = models.Manager()

    class Meta:
        indexes = [
            models.Index(
                fields=[
                    "object_id",
                    "content_type_id",
                ],
                name="phonenumber_comp_idx",
            ),
            models.Index(
                fields=["content_type", "object_id"],
                name="phonenumber_gfk_idx",
            ),
        ]

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.is_primary:
            PhoneNumber.objects.filter(
                content_type=self.content_type, object_id=self.object_id, is_primary=True
            ).update(is_primary=False)

        super().save(*args, **kwargs)


# Permissions
class AttachmentUserObjectPermission(UserObjectPermissionBase):
    content_object: ForeignKey = models.ForeignKey(
        Attachment,
        on_delete=models.CASCADE,
    )


class AttachmentGroupObjectPermission(GroupObjectPermissionBase):
    content_object: ForeignKey = models.ForeignKey(
        Attachment,
        on_delete=models.CASCADE,
    )
