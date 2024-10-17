import strawberry
from proxy.types import (
    PlaceAutocompleteInput,
    PlaceAutocompleteResponse,
    PlacesAutocompleteStatus,
)
from strawberry import Info


@strawberry.type
class Query:
    @strawberry.field
    def search_places(
        self,
        info: Info,
        input: PlaceAutocompleteInput,
    ) -> PlaceAutocompleteResponse:
        """
        Search for places based on the input parameters using Google Places Autocomplete API.

        Args:
            info (Info): GraphQL resolver info.
            input (PlaceAutocompleteInput): Input parameters for place search.

        Returns:
            PlaceAutocompleteResponse: Response containing place predictions.
        """
        # The is a stub and logic is handled client-side by Apollo
        return PlaceAutocompleteResponse(predictions=[], status=PlacesAutocompleteStatus(value=200))
