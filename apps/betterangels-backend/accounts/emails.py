import logging

from accounts.models import Organization, User
from common.org_types import REGISTRY
from common.permissions.config import TemplateConfig
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_welcome_email(user: User, organization: Organization, template_config: TemplateConfig) -> None:
    """Send a welcome email using the given template config.

    The caller is responsible for selecting which ``TemplateConfig``
    objects to send welcome emails for (e.g. all org templates that
    have ``welcome_html`` set).

    The template receives ``base_url`` (read from the Django setting
    named by ``template_config.base_url_setting``) so that the
    template can compose an absolute dashboard URL (e.g.
    ``{{ base_url }}/operator``).  Email clients require absolute
    URLs.
    """
    if not template_config.welcome_html or not template_config.welcome_txt:
        logger.warning(f"No welcome email templates for '{template_config.name}' — skipping.")
        return

    base_url = getattr(settings, template_config.base_url_setting, "")

    context = {
        "user_email": user.email,
        "user_first_name": user.first_name,
        "organization_name": organization.name,
        "base_url": base_url,
    }

    msg = EmailMultiAlternatives(
        subject=f"Welcome to BetterAngels, {user.first_name}!",
        body=render_to_string(template_config.welcome_txt, context),
        to=[user.email or ""],
    )
    html_body = render_to_string(template_config.welcome_html, context)
    msg.attach_alternative(html_body, "text/html")
    msg.send(fail_silently=False)


def send_welcome_emails_for_org(user: User, organization: Organization) -> None:
    """Send welcome emails for every org template that has ``welcome_html`` set.

    Call this from mutations after ``create_organization_service`` completes
    successfully so that email dispatch happens outside the transaction.
    """
    templates = [t for t in REGISTRY.templates_for(organization) if t.welcome_html]
    for template in templates:
        send_welcome_email(user, organization, template)
