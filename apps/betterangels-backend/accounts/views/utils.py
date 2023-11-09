import base64


def base64url_decode(input_str: str) -> str:
    # Transform base64url string to regular base64 string
    remainder = len(input_str) % 4
    if remainder == 2:
        input_str += "=="
    elif remainder == 3:
        input_str += "="

    return base64.urlsafe_b64decode(input_str).decode("utf-8")
