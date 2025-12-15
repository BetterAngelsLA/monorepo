import enum

import strawberry


@strawberry.enum
class TaskStatusEnum(enum.IntEnum):
    TO_DO = 0
    IN_PROGRESS = 1
    COMPLETED = 2


@strawberry.enum
class TaskScopeEnum(enum.StrEnum):
    HMIS = "HMIS"
    STANDARD = "STANDARD"
    GENERAL = "GENERAL"
