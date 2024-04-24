from typing import Optional

import strawberry
from strawberry.directive import DirectiveLocation


# Define the @rest directive
@strawberry.directive(locations=[DirectiveLocation.FIELD_DEFINITION])
def rest(type: str, path: str, method: str = "GET", bodyKey: Optional[str] = None) -> None:
    # This is only to define the directive for usage in SDL
    return None
