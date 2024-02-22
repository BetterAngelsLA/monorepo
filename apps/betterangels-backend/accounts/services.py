from typing import cast

from accounts.models import User
from django.conf import settings
from django.core.mail import send_mail
from django.template import loader
from django.urls import reverse
from sesame.utils import get_query_string

SUBJECT_LINE = "Your One-Click Login Link for the BetterAngels app"


def send_magic_link(email: str, base_url: str) -> str:
    user = User.objects.find_by_email(email)

    query_string = get_query_string(user)
    link = base_url + reverse("magic-auth-login") + query_string
    context = {"magic_login_link_url": link}
    subject = SUBJECT_LINE

    template = loader.get_template("account/email/email_magic_link.html")
    html_message = template.render(context)

    text_template = loader.get_template("account/messages/email_magic_link.txt")
    text_message = text_template.render(context)
    send_mail(
        subject=subject,
        message=text_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        html_message=html_message,
    )

    return cast(str, query_string)
