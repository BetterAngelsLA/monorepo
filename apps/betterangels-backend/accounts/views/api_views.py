from typing import TypeVar

from accounts.serializers import MagicLinkSerializer, UserSerializer
from accounts.services import send_magic_link
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

T = TypeVar("T")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request: Request) -> Response:
    """
    Returns details of the currently authenticated user.
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([AllowAny])
def generate_magic_link(request: Request) -> Response:
    """
    Generates a magic login link and sends it to the provided email
    """
    serializer = MagicLinkSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data["email"]
        base_url = request.build_absolute_uri()
        send_magic_link(email, base_url)

    # Always send back a 200 response so users cannot guess a valid email
    return Response({"message": "Email link sent."}, status=status.HTTP_200_OK)
