import logging
from typing import Optional

from common.logging.filters import IgnoreELBHealthCheck
from django.test import SimpleTestCase


class IgnoreELBHealthCheckTests(SimpleTestCase):
    def make_record(self, msg: object, user_agent: Optional[str] = None) -> logging.LogRecord:
        """
        Build a LogRecord with either:
         - a .user_agent attribute, or
         - a dict msg containing "user_agent"
        """
        record = logging.LogRecord(
            name="test",
            level=logging.INFO,
            pathname=__file__,
            lineno=1,
            msg=msg,
            args=(),
            exc_info=None,
        )
        if user_agent is not None:
            record.user_agent = user_agent
        return record

    def test_filter_drops_on_user_agent_attr(self) -> None:
        f = IgnoreELBHealthCheck()
        rec = self.make_record(msg="ignored", user_agent="ELB-HealthChecker/2.0")
        self.assertFalse(f.filter(rec))

    def test_filter_keeps_normal_user_agent_attr(self) -> None:
        f = IgnoreELBHealthCheck()
        rec = self.make_record(msg="ok", user_agent="Mozilla/5.0")
        self.assertTrue(f.filter(rec))

    def test_filter_drops_when_msg_dict_has_elb(self) -> None:
        f = IgnoreELBHealthCheck()
        rec = self.make_record(msg={"user_agent": "ELB-HealthChecker/2.0"})
        self.assertFalse(f.filter(rec))

    def test_filter_keeps_when_msg_dict_without_elb(self) -> None:
        f = IgnoreELBHealthCheck()
        rec = self.make_record(msg={"foo": "bar"})
        self.assertTrue(f.filter(rec))

    def test_filter_non_dict_msg_and_no_attr(self) -> None:
        f = IgnoreELBHealthCheck()
        rec = self.make_record(msg="just a string")
        self.assertTrue(f.filter(rec))

    def test_attr_precedence_over_msg_dict(self) -> None:
        f = IgnoreELBHealthCheck()
        rec = self.make_record(
            msg={"user_agent": "ELB-HealthChecker/2.0"},
            user_agent="Mozilla/5.0",
        )
        self.assertTrue(f.filter(rec))
