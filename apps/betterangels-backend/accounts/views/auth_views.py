import json
from urllib.parse import unquote

from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .utils import base64url_decode


class AuthRedirectView(APIView):
    def get(self, request: Request) -> Response:
        state_param = request.query_params.get("state")
        if state_param:
            decoded_state = unquote(base64url_decode(state_param))
            state = json.loads(decoded_state)
        else:
            state = None
        redirect_uri = state.get("path_back")

        if not redirect_uri:
            # Handle the case where no redirect URI is provided.
            # Respond with an error or provide a default URI.
            return Response({"detail": "path_back not provided."}, status=400)

        # Forward the code (or error) to your app.
        # Assuming your app needs the code to obtain tokens.'
        if request.query_params:
            redirect_uri += "?"
            redirect_uri += "&".join(f"{key}={value}" for key, value in request.query_params.items())
        response = Response(status=302)  # 302 is for temporary redirect
        response["Location"] = redirect_uri
        return response
