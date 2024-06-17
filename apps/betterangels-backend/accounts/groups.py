from enum import StrEnum

import strawberry


@strawberry.enum
class GroupTemplateNames(StrEnum):
    CASEWORKER = "Caseworker"
