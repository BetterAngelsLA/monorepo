from allauth.account.models import EmailAddress
from allauth.socialaccount.providers.base import ProviderAccount
from allauth.socialaccount.providers.oauth2.provider import OAuth2Provider


class Scope(object):
    MILITARY = "military"
    VETERAN = "veteran"
    STUDENT = "student"
    RESIDENT = "resident"
    GOVERNMENT = "government"
    TEACHER = "teacher"
    FIRST_RESPONDER = "first_responder"
    NURSE = "nurse"
    DOCTOR = "doctor"
    NONPROFIT = "nonprofit"


class IdmeAccount(ProviderAccount):
    def get_profile_url(self):
        return self.account.extra_data.get("profile_url")

    def get_avatar_url(self):
        return self.account.extra_data.get("avatar_url")

    def to_str(self):
        dflt = super(IdmeAccount, self).to_str()
        return self.account.extra_data.get("name", dflt)


class IdmeProvider(OAuth2Provider):
    id = "idme"
    name = "id.me"
    account_class = IdmeAccount

    def get_default_scope(self):
        scope = [Scope.NONPROFIT]
        return scope

    def extract_uid(self, data):
        return str(data["id"])

    def extract_common_fields(self, data):
        return dict(
            email=data.get("email"),
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            name=data.get("name"),
        )

    def extract_email_addresses(self, data):
        ret = []
        email = data.get("email")
        if email:
            ret.append(EmailAddress(email=email, verified=True, primary=True))
        return ret
