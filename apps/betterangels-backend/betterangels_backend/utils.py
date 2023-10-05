import boto3


def is_running_on_aws() -> bool:
    try:
        sts = boto3.client("sts")
        sts.get_caller_identity()
        return True
    except Exception:
        return False
