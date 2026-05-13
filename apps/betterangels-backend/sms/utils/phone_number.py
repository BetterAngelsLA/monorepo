import phonenumbers
from sms.errors import InvalidPhoneNumberError


def parse_phone_number(raw_number: str, region: str = "US") -> str:
    """
    Parse and validate a raw phone number string into E.164 format.
    Raises InvalidPhoneNumberError if the input cannot be parsed or is invalid.
    """
    try:
        parsed = phonenumbers.parse(raw_number, region)
    except phonenumbers.NumberParseException as e:
        raise InvalidPhoneNumberError(f"Cannot parse phone number '{raw_number}': {e}") from e

    if not phonenumbers.is_valid_number(parsed):
        raise InvalidPhoneNumberError(f"Invalid phone number: {raw_number}")

    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def is_valid_phone_format(raw_number: str, region: str = "US") -> bool:
    """
    Check whether a phone number has a valid format for the given region.
    This is offline format validation only — it does not hit any provider API.
    """
    try:
        parse_phone_number(raw_number, region)
        return True
    except InvalidPhoneNumberError:
        return False
