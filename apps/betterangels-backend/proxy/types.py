from enum import Enum
from typing import List, Optional

import strawberry

# Documentation
# https://developers.google.com/maps/documentation/places/web-service/autocomplete


@strawberry.enum
class PlacesAutocompleteStatus(Enum):
    OK = "OK"
    ZERO_RESULTS = "ZERO_RESULTS"
    INVALID_REQUEST = "INVALID_REQUEST"
    OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT"
    REQUEST_DENIED = "REQUEST_DENIED"
    UNKNOWN_ERROR = "UNKNOWN_ERROR"


@strawberry.input
class PlaceAutocompleteInput:
    input: str  # Required
    components: Optional[str] = None  # e.g., "country:us|country:pr"
    language: Optional[str] = None  # e.g., "en"
    location: Optional[str] = None  # "latitude,longitude"
    locationbias: Optional[str] = None  # e.g., "circle:500@37.76999,-122.44696"
    locationrestriction: Optional[str] = None  # e.g., "rectangle:34.14499,-118.351601|33.94499,-118.151601"
    offset: Optional[int] = None  # Position in input term
    origin: Optional[str] = None  # "latitude,longitude"
    radius: Optional[int] = None  # in meters
    region: Optional[str] = None  # e.g., "us"
    sessiontoken: Optional[str] = None  # UUID v4 string
    strictbounds: Optional[bool] = strawberry.field(default=True)
    types: Optional[str] = None  # e.g., "establishment|geocode"


@strawberry.input
class PlaceAutocompleteMatchedSubstringInput:
    length: int
    offset: int


@strawberry.input
class PlaceAutocompleteStructuredFormatInput:
    main_text: str
    main_text_matched_substrings: List[PlaceAutocompleteMatchedSubstringInput]
    secondary_text: Optional[str] = None
    secondary_text_matched_substrings: Optional[List[PlaceAutocompleteMatchedSubstringInput]] = None


@strawberry.input
class PlaceAutocompleteTermInput:
    offset: int
    value: str


@strawberry.type
class PlaceAutocompleteMatchedSubstring:
    length: int
    offset: int


@strawberry.type
class PlaceAutocompleteStructuredFormat:
    main_text: str
    main_text_matched_substrings: List[PlaceAutocompleteMatchedSubstring]
    secondary_text: Optional[str] = None
    secondary_text_matched_substrings: Optional[List[PlaceAutocompleteMatchedSubstring]] = None


@strawberry.type
class PlaceAutocompleteTerm:
    offset: int
    value: str


@strawberry.type
class PlaceAutocompletePrediction:
    description: str
    matched_substrings: List[PlaceAutocompleteMatchedSubstring]
    place_id: str
    reference: Optional[str] = None  # Deprecated
    structured_formatting: PlaceAutocompleteStructuredFormat
    terms: List[PlaceAutocompleteTerm]
    distance_meters: Optional[int] = None
    types: Optional[List[str]] = None


@strawberry.type
class PlaceAutocompleteResponse:
    predictions: List[PlaceAutocompletePrediction]
    status: PlacesAutocompleteStatus
    error_message: Optional[str] = None
    info_messages: Optional[List[str]] = None
