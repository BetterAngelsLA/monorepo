import unittest
from .config import VCR as VCR
from _typeshed import Incomplete

class VCRMixin:
    vcr_enabled: bool
    cassette: Incomplete
    def setUp(self) -> None: ...

class VCRTestCase(VCRMixin, unittest.TestCase): ...
