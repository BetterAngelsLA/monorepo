import json
from typing import Any, Dict, Optional

from django.test import Client, TestCase


class GraphQLTestCaseMixin:
    graphql_url = "/graphql"  # Change this if your GraphQL endpoint is different

    def setUp(self) -> None:
        # Explicitly check if self is an instance of Django's TestCase
        if isinstance(self, TestCase):
            super(TestCase, self).setUp()
        self.graphql_client = Client()

    def execute_graphql(
        self,
        query: str,
        variables: Optional[Dict[str, Any]] = None,
        files: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        # If there are files to upload, prepare multipart/form-data request
        if files:
            # The GraphQL query and variables are added to the form data as 'operations'
            operations = json.dumps({"query": query, "variables": variables or {}})

            # Prepare the data dictionary for multipart encoding
            multipart_data = {"operations": operations}

            # 'map' tells the server how the files in the request map to the variables
            file_map = {
                str(i): [f"variables.{key}"]
                for i, key in enumerate(files.keys(), start=1)
            }
            multipart_data["map"] = json.dumps(file_map)

            # Add files to the data dictionary
            for i, file in enumerate(files.values(), start=1):
                multipart_data[f"{i}"] = file

            response = self.graphql_client.post(
                self.graphql_url, multipart_data, format="multipart"
            )
        else:
            # For non-multipart requests, just send JSON encoded data as usual
            data = {
                "query": query,
                "variables": variables or {},
            }
            response = self.graphql_client.post(
                self.graphql_url, data, content_type="application/json"
            )

        json_data = response.json()
        if not isinstance(json_data, dict):
            raise ValueError("Response JSON is not a dictionary")
        return json_data
