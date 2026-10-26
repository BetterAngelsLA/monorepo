"""``org_or_deny`` — the shared org guard's fail-closed contract."""

from django.core.exceptions import PermissionDenied
from django.test import SimpleTestCase
from strawberry import UNSET

from common.graphql.utils import ORG_PERMISSION_DENIED_MESSAGE, org_or_deny


class OrgOrDenyTestCase(SimpleTestCase):
    def test_an_unset_org_id_denies(self) -> None:
        """An omitted optional filter field carries ``UNSET``, not ``None``.

        Pinned explicitly: the guard must name the sentinel rather than lean on
        ``get_prep_value`` rejecting an opaque object.
        """
        with self.assertRaises(PermissionDenied) as raised:
            org_or_deny(UNSET)

        self.assertEqual(str(raised.exception), ORG_PERMISSION_DENIED_MESSAGE)
