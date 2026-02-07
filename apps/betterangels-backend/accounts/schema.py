import logging
import secrets
import string
import uuid
from typing import Optional, Union, cast

import strawberry
import strawberry_django
from accounts.enums import OrgRoleEnum
from accounts.groups import GroupTemplateNames
from accounts.permissions import UserOrganizationPermissions
from allauth.account.adapter import get_adapter
from allauth.account.models import EmailAddress
from common.graphql.types import DeletedObjectType
from common.permissions.utils import IsAuthenticated
from django.conf import settings
from django.contrib.auth import login as django_login
from django.contrib.sites.models import Site
from django.core.cache import cache
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.db.models import Case, CharField, Exists, OuterRef, QuerySet, Value, When
from notes.permissions import NotePermissions
from organizations.backends import invitation_backend
from organizations.models import Organization, OrganizationOwner, OrganizationUser
from strawberry.types import Info
from strawberry_django import auth
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm
from strawberry_django.utils.query import filter_for_user

from .exceptions import (
    OTPDisabledError,
    OTPExpiredError,
    OTPInvalidError,
    OTPRequestError,
    OTPUserNotFoundError,
)
from .models import PermissionGroup, User
from .types import (
    AuthInput,
    AuthPayload,
    AuthResponse,
    CurrentUserType,
    LoginInput,
    OrganizationMemberOrdering,
    OrganizationMemberType,
    OrganizationOrder,
    OrganizationType,
    OrgInvitationInput,
    RemoveOrganizationMemberInput,
    RequestOtpResult,
    UpdateUserInput,
    UserType,
)

logger = logging.getLogger(__name__)


def annotate_member_role(org_id: str) -> Case:
    is_superuser = Exists(
        PermissionGroup.objects.filter(
            organization_id=org_id,
            template__name=GroupTemplateNames.ORG_SUPERUSER,
            group__user=OuterRef("pk"),
        )
    )
    is_admin = Exists(
        PermissionGroup.objects.filter(
            organization_id=org_id,
            template__name=GroupTemplateNames.ORG_ADMIN,
            group__user=OuterRef("pk"),
        )
    )

    return Case(
        When(is_superuser, then=Value(OrgRoleEnum.SUPERUSER)),
        When(is_admin, then=Value(OrgRoleEnum.ADMIN)),
        default=Value(OrgRoleEnum.MEMBER),
        output_field=CharField(),
    )


@strawberry.type
class Query:
    @strawberry_django.field(permission_classes=[IsAuthenticated])
    def current_user(self, info: Info) -> CurrentUserType:
        return get_current_user(info)  # type: ignore

    @strawberry_django.offset_paginated(
        OffsetPaginated[OrganizationType],
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(NotePermissions.ADD)],
    )
    def caseworker_organizations(self, ordering: Optional[list[OrganizationOrder]] = None) -> QuerySet[Organization]:
        queryset: QuerySet[Organization] = Organization.objects.filter(
            permission_groups__name__icontains=GroupTemplateNames.CASEWORKER
        )
        return queryset

    @strawberry_django.field(
        permission_classes=[IsAuthenticated], extensions=[HasPerm(UserOrganizationPermissions.VIEW_ORG_MEMBERS)]
    )
    def organization_member(self, info: Info, organization_id: str, user_id: str) -> OrganizationMemberType:
        current_user = cast(User, get_current_user(info))
        try:
            organization = filter_for_user(
                Organization.objects.filter(users=current_user),
                current_user,
                [UserOrganizationPermissions.VIEW_ORG_MEMBERS],
            ).get(id=organization_id)
        except Organization.DoesNotExist:
            raise PermissionError("You do not have permission to view this organization's members.")

        user: User = (
            organization.users.filter(id=user_id).annotate(_member_role=annotate_member_role(organization_id)).first()
        )
        if not user:
            raise PermissionError("You do not have permission to view this member.")

        return cast(OrganizationMemberType, user)

    @strawberry_django.offset_paginated(
        OffsetPaginated[OrganizationMemberType],
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(UserOrganizationPermissions.VIEW_ORG_MEMBERS)],
    )
    def organization_members(
        self, info: Info, organization_id: str, ordering: Optional[list[OrganizationMemberOrdering]] = None
    ) -> QuerySet[User]:
        current_user = cast(User, get_current_user(info))
        try:
            organization = filter_for_user(
                Organization.objects.filter(users=current_user),
                current_user,
                [UserOrganizationPermissions.VIEW_ORG_MEMBERS],
            ).get(id=organization_id)
        except Organization.DoesNotExist:
            raise PermissionError("You do not have permission to view this organization's members.")

        queryset: QuerySet[User] = organization.users.all()

        return queryset.annotate(_member_role=annotate_member_role(organization_id))


@strawberry.type
class Mutation:
    logout = auth.logout()

    @strawberry.mutation
    def login(self, input: LoginInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry.mutation
    def google_auth(self, input: AuthInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry.mutation
    def apple_auth(self, input: AuthInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry.mutation
    def request_otp(self, info: Info, email: str) -> RequestOtpResult:
        """
        Request an OTP (One-Time Password) code to be sent via email.

        Requires environment variables:
        - ACCOUNT_LOGIN_BY_CODE_ENABLED: Must be True to enable OTP login
        - ACCOUNT_LOGIN_BY_CODE_TIMEOUT: Timeout in seconds (default: 300)
        - EMAIL_BACKEND: Email backend configuration

        If email worker is not running, the OTP code will be logged to console.
        """
        # Check if login by code is enabled
        if not getattr(settings, "ACCOUNT_LOGIN_BY_CODE_ENABLED", False):
            raise OTPDisabledError("OTP login is not enabled. Set ACCOUNT_LOGIN_BY_CODE_ENABLED=True in .env.")

        try:
            email = email.lower().strip()

            # Get or create user with this email
            user, created = User.objects.get_or_create(
                email=email,
                defaults={"username": str(uuid.uuid4()), "is_active": True},
            )

            if created:
                user.set_unusable_password()
                user.save()

            # Get or create EmailAddress record for allauth (required for email sending)
            EmailAddress.objects.get_or_create(
                user=user,
                email=email,
                defaults={"verified": False, "primary": True},
            )

            # Generate a 6-digit OTP code
            code = "".join(secrets.choice(string.digits) for _ in range(6))

            # Store the code in cache with timeout
            timeout_seconds = getattr(settings, "ACCOUNT_LOGIN_BY_CODE_TIMEOUT", 300)
            cache_key = f"otp_code:{email}"
            cache.set(cache_key, code, timeout_seconds)

            # Send the code via email using allauth's adapter
            try:
                adapter = get_adapter(info.context.request)
                timeout_minutes = timeout_seconds // 60

                adapter.send_mail(
                    "account/email/login_code",
                    email,
                    {"code": code, "timeout_minutes": timeout_minutes},
                )
                logger.info(f"OTP email queued for {email}")
            except Exception as email_error:
                # Email sending failed, but we still have the code in cache
                logger.warning(f"Failed to queue OTP email for {email}: {str(email_error)}")

            # Check if Celery workers are available to process emails
            from post_office.settings import get_celery_enabled

            celery_enabled = get_celery_enabled()
            celery_workers_available = False

            if celery_enabled:
                try:
                    from celery import current_app
                    from celery.app.control import Inspect

                    inspector = Inspect(app=current_app)
                    active_workers = inspector.active()
                    celery_workers_available = active_workers is not None and len(active_workers) > 0
                    # Debug logging
                except Exception:
                    # Celery not available or not responding
                    celery_workers_available = False

            # Log code only if Celery workers are NOT available (regardless of backend type)
            # If workers are running, they'll process emails (either to files or via SES)
            # If Celery is not enabled, also log since emails won't be processed
            should_log_code = not celery_enabled or not celery_workers_available

            if should_log_code:
                logger.debug(f"OTP Code for {email}: {code} (expires in {timeout_seconds}s)")

            return RequestOtpResult(success=True)

        except Exception as e:
            logger.error(f"Error requesting OTP for {email}: {str(e)}")
            raise OTPRequestError(f"Error requesting OTP: {str(e)}") from e

    @strawberry.mutation
    def verify_otp(self, info: Info, email: str, code: str) -> AuthPayload:
        """
        Verify an OTP code and return an authentication token.

        Args:
            email: The user's email address
            code: The OTP code received via email

        Returns:
            AuthPayload with token on success

        Raises:
            Exception if verification fails
        """
        email = email.lower().strip()
        code = code.strip()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning(f"OTP verification failed: user not found for {email}")
            raise OTPUserNotFoundError("Invalid email or code")

        cache_key = f"otp_code:{email}"
        stored_code = cache.get(cache_key)

        if not stored_code:
            logger.warning(f"OTP verification failed: no code found in cache for {email}")
            raise OTPExpiredError("Invalid or expired code")

        if stored_code != code:
            raise OTPInvalidError("Invalid code")

        # Log in the user if the code is correct
        request = info.context.request
        django_login(request, user, backend="django.contrib.auth.backends.ModelBackend")

        cache.delete(cache_key)

        # For session-based auth, the session token is in cookies
        # Return a token identifier
        return AuthPayload(token=request.session.session_key or "session")

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_current_user(self, info: Info, data: UpdateUserInput) -> Union[UserType, CurrentUserType]:
        user = cast(User, get_current_user(info))
        if str(user.pk) != str(data.id):
            raise PermissionError("You do not have permission to modify this user.")

        user_data: dict = strawberry.asdict(data)

        user = resolvers.update(
            info,
            user,
            {
                **user_data,
                "id": user.pk,
            },
        )

        return cast(UserType, user)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_current_user(self, info: Info) -> DeletedObjectType:
        user = get_current_user(info)
        if user.pk is None:
            raise RuntimeError("Cannot delete user.")

        user_id = user.pk

        with transaction.atomic():
            user.delete()

        return DeletedObjectType(id=user_id)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated], extensions=[HasPerm(UserOrganizationPermissions.ADD_ORG_MEMBER)]
    )
    def add_organization_member(self, info: Info, data: OrgInvitationInput) -> OrganizationMemberType:
        current_user = get_current_user(info)

        try:
            organization = filter_for_user(
                Organization.objects.filter(users=current_user),
                current_user,
                [UserOrganizationPermissions.ADD_ORG_MEMBER],
            ).get(id=data.organization_id)
        except Organization.DoesNotExist:
            raise PermissionDenied("You do not have permission to add members.")

        with transaction.atomic():
            user, created = User.objects.get_or_create(
                email=data.email,
                defaults={"username": str(uuid.uuid4()), "is_active": True},
            )
            if created:
                user.first_name = data.first_name
                user.last_name = data.last_name
                user.middle_name = data.middle_name
                user.set_unusable_password()
                user.save()

            try:
                OrganizationUser.objects.create(user=user, organization=organization)
            except Exception:
                raise ValidationError(f"{data.first_name} {data.last_name} is already a member of {organization.name}.")

            invitation_backend().create_organization_invite(
                organization=organization, invited_by_user=current_user, invitee_user=user
            )

        site = Site.objects.get(pk=settings.SITE_ID)
        invitation_backend().send_invitation(
            user=user,
            sender=current_user,
            organization=organization,
            domain=site,
        )

        return cast(OrganizationMemberType, user)

    @strawberry_django.mutation(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(UserOrganizationPermissions.REMOVE_ORG_MEMBER)],
    )
    def remove_organization_member(
        self,
        info: Info,
        data: RemoveOrganizationMemberInput,
    ) -> DeletedObjectType:
        current_user = cast(User, get_current_user(info))
        user_id = int(data.id)

        try:
            organization = filter_for_user(
                Organization.objects.filter(users=current_user),
                current_user,
                [UserOrganizationPermissions.REMOVE_ORG_MEMBER],
            ).get(id=data.organization_id)
        except Organization.DoesNotExist:
            raise PermissionDenied("You do not have permission to remove members.")

        try:
            org_user = OrganizationUser.objects.get(
                organization=organization,
                user_id=user_id,
            )
        except OrganizationUser.DoesNotExist:
            raise ValidationError("User is not a member of this organization.")

        if OrganizationOwner.objects.filter(
            organization=organization,
            organization_user=org_user,
        ).exists():
            raise ValidationError("You cannot remove the organization owner. Transfer ownership first.")

        if user_id == current_user.pk:
            raise ValidationError("You cannot remove yourself from the organization.")

        with transaction.atomic():
            org_user.delete()

        return DeletedObjectType(id=user_id)
