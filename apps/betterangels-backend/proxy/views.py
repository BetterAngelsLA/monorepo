# Create your views here.
import json
from typing import Any, Dict

import requests
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt


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


@csrf_exempt
@login_required
def google_places_api_new(request: HttpRequest, action: str) -> HttpResponse:
    """
    Proxies a request to the Google Places API (New).
    This endpoint supports the new Places API which uses POST requests with JSON body.
    Args:
        request (HttpRequest): The original HTTP request sent to the Django server.
        action (str): The specific action to call on the Places API (e.g., 'autocomplete').
    Returns:
        HttpResponse: The HTTP response returned from the Google Places API,
                      re-packaged as a Django JsonResponse.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Only POST requests are supported"}, status=405)

    try:
        body = json.loads(request.body) if request.body else {}
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON body"}, status=400)

    google_places_api_url = f"https://places.googleapis.com/v1/places:{action}"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": settings.GOOGLE_MAPS_API_KEY,
    }

    # Pass through X-Goog-FieldMask if provided
    field_mask = request.headers.get("X-Goog-FieldMask")
    if field_mask:
        headers["X-Goog-FieldMask"] = field_mask

    try:
        response = requests.post(google_places_api_url, json=body, headers=headers)
        response.raise_for_status()
        response_data = response.json()
    except requests.RequestException as e:
        return JsonResponse({"error": f"An error occurred while contacting Google Places API: {str(e)}"}, status=500)
    except ValueError:
        return JsonResponse({"error": "Invalid response from Google Places API."}, status=500)

    return JsonResponse(response_data, safe=False)
