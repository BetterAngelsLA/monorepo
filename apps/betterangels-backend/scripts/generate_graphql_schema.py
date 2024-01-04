from betterangels_backend.schema import schema


def run() -> None:
    print("Generating graphql schema...")
    schema_str = str(schema)
    with open("schema.graphql", "w") as file:
        file.write(schema_str)
