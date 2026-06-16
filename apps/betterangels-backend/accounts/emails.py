import logging

from accounts.models import Organization, User
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_welcome_email(user: User, organization: Organization) -> None:
    """Send a welcome email to a self-signed-up shelter operator."""
    from shelters.groups import SHELTER_OPERATOR

    template_config = SHELTER_OPERATOR
    html_template = template_config.welcome_html or template_config.invite_html
    txt_template = template_config.welcome_txt or template_config.invite_txt

    if not html_template or not txt_template:
        logger.warning("No welcome email templates configured for Shelter Operator — skipping.")
        return

    context = {
        "user_email": user.email,
        "user_first_name": user.first_name,
        "organization_name": organization.name,
        "dashboard_url": getattr(settings, "SHELTER_OPERATOR_DASHBOARD_URL", "http://localhost:4200/dashboard"),
    }

    msg = EmailMultiAlternatives(
        subject=f"Welcome to BetterAngels, {user.first_name}!",
        body=render_to_string(txt_template, context),
        to=[user.email or ""],
    )
    html_body = render_to_string(html_template, context)
    msg.attach_alternative(html_body, "text/html")
    msg.send(fail_silently=True)