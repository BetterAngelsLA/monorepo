from typing import Any, Dict

import boto3
from django.contrib.gis.db.backends.postgis.base import (
    DatabaseWrapper as PostGISDatabaseWrapper,
)


class DatabaseWrapper(PostGISDatabaseWrapper):
    def get_connection_params(self) -> Dict[str, Any]:
        # Original connection parameters
        conn_params: Dict[str, Any] = super().get_connection_params()

        # If IAM authentication is enabled in settings, generate an authentication token
        if self.settings_dict.get("IAM_AUTH", False):
            region_name: str = self.settings_dict["REGION_NAME"]
            db_hostname: str = self.settings_dict["HOST"]
            db_port: str = self.settings_dict["PORT"]
            db_username: str = self.settings_dict["USER"]

            # Generate IAM auth token using boto3
            rds_client = boto3.client("rds", region_name=region_name)
            token = rds_client.generate_db_auth_token(
                DBHostname=db_hostname,
                Port=db_port,
                DBUsername=db_username,
                Region=region_name,
            )

            # Update connection parameters with the generated token as the password
            conn_params["password"] = token

        return conn_params
