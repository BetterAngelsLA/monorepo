from urllib.parse import parse_qsl

import requests
from allauth.socialaccount.providers.oauth.client import (
    OAuthClient,
    OAuthError,
    get_token_prefix,
)
from allauth.utils import get_request_param
from django.utils.http import urlencode
from django.utils.translation import gettext as _
from requests_oauthlib import OAuth1


class IdMeOAuthClient(OAuthClient):
    def get_access_token(self):
        """
        Obtain the access token to access private resources at the API
        endpoint.
        """
        if self.access_token is None:
            request_token = self._get_rt_from_session()
            oauth = OAuth1(
                self.consumer_key,
                client_secret=self.consumer_secret,
                resource_owner_key=request_token["oauth_token"],
                resource_owner_secret=request_token["oauth_token_secret"],
            )
            at_url = self.access_token_url
            # Passing along oauth_verifier is required according to:
            # http://groups.google.com/group/twitter-development-talk/browse_frm/thread/472500cfe9e7cdb9#
            # Though, the custom oauth_callback seems to work without it?
            oauth_verifier = get_request_param(self.request, "oauth_verifier")
            if oauth_verifier:
                at_url = at_url + "?" + urlencode({"oauth_verifier": oauth_verifier})
            import pdb

            pdb.set_trace()
            response = requests.post(url=at_url, auth=oauth)
            if response.status_code not in [200, 201]:
                raise OAuthError(
                    _("Invalid response while obtaining access token" ' from "%s".')
                    % get_token_prefix(self.request_token_url)
                )
            self.access_token = dict(parse_qsl(response.text))

            self.request.session[
                "oauth_%s_access_token" % get_token_prefix(self.request_token_url)
            ] = self.access_token
        return self.access_token
