"""Custom exceptions for the accounts app."""


class OTPError(Exception):
    """Base exception for OTP-related errors."""

    pass


class OTPDisabledError(OTPError):
    """Raised when OTP login is disabled but an OTP operation is attempted."""

    pass


class OTPInvalidError(OTPError):
    """Raised when an invalid OTP code is provided."""

    pass


class OTPExpiredError(OTPError):
    """Raised when an OTP code has expired."""

    pass


class OTPUserNotFoundError(OTPError):
    """Raised when the user associated with an OTP request is not found."""

    pass


class OTPRequestError(OTPError):
    """Raised when there's an error requesting an OTP."""

    pass
