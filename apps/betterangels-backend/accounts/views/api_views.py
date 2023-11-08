from typing import TypeVar

from accounts.serializers import MagicLinkSerializer, UserSerializer
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
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
def generate_magic_link(request: Request) -> Response:
    """
    Generates a magic login link and sends it to the provided email
    """
    serializer = MagicLinkSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data["email"]
        send_magic_link(email)
        return Response({"message": "Magic link sent."}, status=status.HTTP_200_OK)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
