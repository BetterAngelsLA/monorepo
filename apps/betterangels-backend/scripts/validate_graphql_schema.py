import os

from betterangels_backend.schema import schema


def run() -> int:
    print("Generating a copy of the graphql schema...")
    schema_str = str(schema)
    with open("copy_schema.graphql", "w") as file:
        file.write(schema_str)

    result = compare_files()

    cleanup()
    return result


def compare_files() -> int:
    file1 = "copy_schema.graphql"
    file2 = "schema.graphql"
    print("Comparing the generated schema with the existing schema...")
    with open(file1) as f1:
        content1 = normalize_text(f1.read())

    with open(file2) as f2:
        content2 = normalize_text(f2.read())

    if content1 == content2:
        print("Schema is up to date!")
        return 0
    else:
        print("Schema is out of date!")
        return 1


def normalize_text(text: str) -> str:
    # Remove all whitespace
    text = "".join(text.split())
    # Remove all newlines
    text = text.replace("\n", "")
    # Remove all tabs
    text = text.replace("\t", "")
    return text


def cleanup() -> None:
    os.remove("copy_schema.graphql")
