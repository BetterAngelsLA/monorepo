from typing import Any

import vcr


def scrub_request(request: vcr.request.Request) -> vcr.request.Request:
    return vcr.request.Request(
        body=request.body,
        headers={},
        method=request.method,
        uri="",
    )


def scrub_response(response: dict[str, Any]) -> dict[str, Any]:
    return {
        "status": {"code": response["status"]["code"], "message": response["status"]["message"]},
        "headers": {},
        "body": response["body"],
    }


scrubbed_vcr = vcr.VCR(
    path_transformer=vcr.VCR.ensure_suffix(".yaml"),
    record_mode="once",
    before_record_request=scrub_request,
    before_record_response=scrub_response,
)
