import enum

import strawberry


@strawberry.enum
class ReferralStatusEnum(enum.IntEnum):
    PENDING = 0
    ACCEPTED = 1
    DECLINED = 2
