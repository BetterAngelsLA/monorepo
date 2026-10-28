"""Tests for the shared regex constants in :mod:`common.constants`."""

import re

from django.test import SimpleTestCase
from unittest_parametrize import ParametrizedTestCase, parametrize

from common.constants import YOUTUBE_URL_REGEX

VALID_YT_ID = "dQw4w9WgXcQ"


class YouTubeUrlRegexTestCase(ParametrizedTestCase, SimpleTestCase):
    """``YOUTUBE_URL_REGEX`` matches the URL shapes YouTube actually serves.

    The regex is used through ``RegexValidator``, which applies
    ``re.search`` — so these assertions use ``re.search`` too.
    """

    @parametrize(
        "url",
        [
            f"https://www.youtube.com/watch?v={VALID_YT_ID}",
            f"https://youtube.com/watch?v={VALID_YT_ID}",
            f"https://m.youtube.com/watch?v={VALID_YT_ID}",
            f"https://music.youtube.com/watch?v={VALID_YT_ID}",
            f"https://www.youtube.com/watch?feature=share&v={VALID_YT_ID}",
            f"https://www.youtube.com/watch?feature=share&v={VALID_YT_ID}&t=42",
            f"https://www.youtube.com/embed/{VALID_YT_ID}",
            f"https://www.youtube.com/shorts/{VALID_YT_ID}",
            f"https://youtu.be/{VALID_YT_ID}",
            f"youtu.be/{VALID_YT_ID}",
            f"https://youtu.be/{VALID_YT_ID}?t=42",
            "https://youtu.be/a-B_c-d_0-9",
        ],
    )
    def test_accepts_youtube_urls(self, url: str) -> None:
        self.assertIsNotNone(re.search(YOUTUBE_URL_REGEX, url))

    @parametrize(
        "url, reason",
        [
            ("", "empty"),
            ("not a url", "no host"),
            (f"https://vimeo.com/watch?v={VALID_YT_ID}", "not YouTube"),
            ("https://www.youtube.com/watch?v=", "no video id"),
            (f"https://youtu.be/{VALID_YT_ID[:-1]}.", "uses a period"),
            (f"https://youtu.be/{VALID_YT_ID[:-1]}/", "uses a slash"),
            (f"https://youtu.be/{VALID_YT_ID[:-1]}?", "uses a question mark"),
            (f"https://youtu.be/{VALID_YT_ID[:-1]}", "id too short"),
            (f"https://www.youtube.com/watch?v={VALID_YT_ID[:-1]}", "id too short"),
            (f"https://youtu.be/{VALID_YT_ID}x", "id too long"),
            (f"https://notyoutube.com/watch?v={VALID_YT_ID}", "lookalike host"),
            (f"https://www.notyoutube.com/watch?v={VALID_YT_ID}", "lookalike host"),
            (f"https://notyoutu.be/{VALID_YT_ID}", "lookalike host"),
            (f"https://youtu.bex/{VALID_YT_ID}", "invalid tld"),
            (f"https://www.youtube.comx/watch?v={VALID_YT_ID}", "invalid tld"),
            ("https://www.youtube.com/@channel", "channel page"),
            ("https://www.youtube.com/playlist?list=PL123", "no video id"),
            ("https://www.youtube.com/embed/", "no video id"),
        ],
    )
    def test_rejects_non_youtube_urls(self, url: str, reason: str) -> None:
        self.assertIsNone(re.search(YOUTUBE_URL_REGEX, url))
