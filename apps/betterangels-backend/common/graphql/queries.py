from typing import Type

import strawberry_django

from .types import ChoiceEnum, EnumValueDisplay


def get_enum_labels(enum: Type[ChoiceEnum]) -> list[EnumValueDisplay[ChoiceEnum]]:
    def resolver() -> list[EnumValueDisplay[ChoiceEnum]]:
        return [EnumValueDisplay(key=item, label=item.label) for item in enum]

    return strawberry_django.field(resolver=resolver)
