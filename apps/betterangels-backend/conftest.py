from pathlib import Path

import pytest
from test_utils.vcr_config import scrubbed_vcr


@pytest.fixture(autouse=True)
def _set_relative_vcr_dir(request: pytest.FixtureRequest) -> None:
    """Always override cassette path to module-relative directory."""
    test_file = Path(request.path)
    scrubbed_vcr.cassette_library_dir = str(test_file.parent / "cassettes")
