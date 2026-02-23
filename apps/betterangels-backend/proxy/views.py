# Create your views here.
import json
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


@login_required
def google_places_api(request: HttpRequest, path: str) -> HttpResponse:
    """
    Proxies a request to the Google Places API (New).
    Supports both GET and POST requests to any endpoint under places/v1/.
    Args:
        request (HttpRequest): The original HTTP request sent to the Django server.
        path (str): The path to append to the Places API base URL.
    Returns:
        HttpResponse: The HTTP response returned from the Google Places API,
                      re-packaged as a Django JsonResponse.
    """
    google_places_api_url = f"https://places.googleapis.com/v1/{path}"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_MAPS_API_KEY,
    }

    # Pass through X-Goog-FieldMask if provided
    field_mask = request.headers.get("X-Goog-FieldMask")
    if field_mask:
        headers["X-Goog-FieldMask"] = field_mask

    try:
        if request.method == "POST":
            try:
                body = json.loads(request.body) if request.body else {}
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON body"}, status=400)
            response = requests.post(google_places_api_url, json=body, headers=headers)
        elif request.method == "GET":
            response = requests.get(google_places_api_url, headers=headers, params=request.GET.dict())
        else:
            return JsonResponse({"error": "Only GET and POST requests are supported"}, status=405)

        response.raise_for_status()
        response_data = response.json()
    except requests.RequestException:
        return JsonResponse({"error": "An error occurred while contacting Google Places API."}, status=500)
    except ValueError:
        return JsonResponse({"error": "Invalid response from Google Places API."}, status=500)

    return JsonResponse(response_data, safe=False)
