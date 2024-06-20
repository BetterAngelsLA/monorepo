# Create your views here.
from typing import Any, Dict

import requests
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse, JsonResponse


@login_required
def google_maps_api(request: HttpRequest, path: str) -> HttpResponse:
    """
    Proxies a request to the Google Maps API.
    By handling the API key server-side, this approach helps prevent leakage of the
    Google Maps API key to the client.
    Args:
        request (HttpRequest): The original HTTP request sent to the Django server.
        path (str): The specific API endpoint to call on the Google Maps API.
    Returns:
        HttpResponse: The HTTP response returned from the Google Maps API,
                      re-packaged as a Django JsonResponse.
    """

    params: Dict[str, Any] = request.GET.copy()
    params["key"] = settings.GOOGLE_MAPS_API_KEY
    google_maps_api_url: str = f"https://maps.googleapis.com/maps/api/{path}"

    try:
        response = requests.get(google_maps_api_url, params=params)
        response.raise_for_status()
        response_data = response.json()
    except requests.RequestException:
        return JsonResponse({"error": "An error occurred while contacting Google Maps API."}, status=500)
    except ValueError:
        return JsonResponse({"error": "Invalid response from Google Maps API."}, status=500)

    return JsonResponse(response_data, safe=False)
