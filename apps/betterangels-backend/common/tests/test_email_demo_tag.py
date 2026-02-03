from common.utils import strip_demo_tag


def test_strip_demo_tag_trailing_demo() -> None:
    assert strip_demo_tag("paul+demo@example.com") == "paul@example.com"


def test_strip_demo_tag_other_plus_untouched() -> None:
    assert strip_demo_tag("paul+other@example.com") == "paul+other@example.com"


def test_strip_demo_tag_no_at_left_unchanged() -> None:
    assert strip_demo_tag("paul+demo") == "paul+demo"
