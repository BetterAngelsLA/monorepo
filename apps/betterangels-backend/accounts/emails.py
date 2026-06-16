import logging

from accounts.models import Organization, User
from common.permissions.config import TemplateConfig
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_welcome_email(user: User, organization: Organization, template_config: TemplateConfig) -> None:
    """Send a welcome email using the given template config.

    The caller is responsible for selecting which ``TemplateConfig``
    objects to send welcome emails for (e.g. all org templates that
    have ``welcome_html`` set).
    """
    if not template_config.welcome_html or not template_config.welcome_txt:
        logger.warning(f"No welcome email templates for '{template_config.name}' — skipping.")
        return

    context = {
        "user_email": user.email,
        "user_first_name": user.first_name,
        "organization_name": organization.name,
        "dashboard_url": template_config.welcome_dashboard_url or "",
    }

    msg = EmailMultiAlternatives(
        subject=f"Welcome to BetterAngels, {user.first_name}!",
        body=render_to_string(template_config.welcome_txt, context),
        to=[user.email or ""],
    )
    html_body = render_to_string(template_config.welcome_html, context)
    msg.attach_alternative(html_body, "text/html")
    msg.send(fail_silently=True)