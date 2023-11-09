from typing import Tuple

from accounts.models import User
from django.template import loader
from django.urls import reverse
from post_office import mail
from post_office.models import Email
from sesame.utils import get_query_string

SUBJECT_LINE = "Your One-Click Login Link for the BetterAngels app"


def send_magic_link(email: str, base_url: str) -> Tuple[Email, str]:
    user = User.objects.find_by_email(email)

    query_string = get_query_string(user)
    link = base_url + reverse("magic-auth-login") + query_string
    context = {"magic_login_link_url": link}
    subject = SUBJECT_LINE

    template = loader.get_template("email_magic_link.html")
    html_message = template.render(context)

    text_template = loader.get_template("email_magic_link.txt")
    text_message = text_template.render(context)

    return (
        mail.send(
            email,
            "info@betterangels.la",
            subject=subject,
            html_message=html_message,
            message=text_message,
        ),
        query_string,
    )
