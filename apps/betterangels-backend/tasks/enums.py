import enum

import strawberry


@strawberry.enum
class TaskScopeEnum(enum.StrEnum):
    ALL = "ALL"
    HMIS_NOTE = "HMIS_NOTE"
    STANDARD_NOTE = "STANDARD_NOTE"
    GENERAL = "GENERAL"


@strawberry.enum
class TaskStatusEnum(enum.IntEnum):
    TO_DO = 0
    IN_PROGRESS = 1
    COMPLETED = 2
