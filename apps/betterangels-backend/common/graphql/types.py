import dataclasses

import strawberry


@dataclasses.dataclass
@strawberry.input
class DeleteDjangoObjectInput:
    id: int
