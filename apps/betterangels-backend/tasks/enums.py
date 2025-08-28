import enum

import strawberry


@strawberry.enum
class TaskStatusEnum(enum.IntEnum):
    TO_DO = 0
    IN_PROGRESS = 1
    COMPLETED = 2
