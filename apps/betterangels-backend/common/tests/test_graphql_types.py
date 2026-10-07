from typing import Any, Callable, Optional, cast

from common.graphql.types import SCALAR_MAP, PhoneNumberScalar
from common.models import Address, PhoneNumber
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from unittest_parametrize import ParametrizedTestCase, parametrize

serialize_phone_number = cast(Callable[[Any], str], SCALAR_MAP[PhoneNumberScalar].serialize)


class PhoneNumberScalarTestCase(ParametrizedTestCase, TestCase):
    @parametrize(
        "stored, expected",
        [
            ("2125551212", "2125551212"),
            ("2125551212x99", "2125551212x99"),
            ("125551212", "125551212"),
            ("abc", ""),
            ("", ""),
        ],
    )
    def test_serialize(self, stored: str, expected: str) -> None:
        content_type = ContentType.objects.get_for_model(Address)
        phone_number = PhoneNumber.objects.create(content_type=content_type, object_id=1, number=stored)
        phone_number.refresh_from_db()

        self.assertEqual(serialize_phone_number(phone_number.number), expected)

    def test_serialize_null(self) -> None:
        number: Optional[str] = None

        self.assertEqual(serialize_phone_number(number), "")
