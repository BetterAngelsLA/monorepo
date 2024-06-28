from typing import Type

import strawberry_django

from .types import ChoiceEnum, EnumLabel


def get_enum_labels(enum: Type[ChoiceEnum]) -> list[EnumLabel[ChoiceEnum]]:
    def resolver() -> list[EnumLabel[ChoiceEnum]]:
        return [EnumLabel(key=item, label=item.label) for item in enum]

    return strawberry_django.field(resolver=resolver)
