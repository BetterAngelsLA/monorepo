import dataclasses

import strawberry


@dataclasses.dataclass
@strawberry.input
class DeleteModelInput:
    id: int
