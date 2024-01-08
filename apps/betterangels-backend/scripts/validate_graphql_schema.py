import os
import tempfile

from betterangels_backend.schema import schema


def run() -> int:
    print("Generating a copy of the graphql schema...")
    schema_str = str(schema)
    temp_file_path = write_to_temp_file(schema_str)

    result = compare_files(temp_file_path, "schema.graphql")

    os.remove(temp_file_path)

    return result


def write_to_temp_file(content: str) -> str:
    with tempfile.NamedTemporaryFile(mode="w", delete=False) as temp:
        temp.write(content)
        return temp.name


def read_file(filename: str) -> str:
    try:
        with open(filename, "r") as file:
            return file.read()
    except FileNotFoundError:
        print(f"File {filename} not found")
        exit(1)


def compare_files(file1: str, file2: str) -> int:
    print("Comparing the generated schema with the existing schema...")
    content1 = normalize_text(read_file(file1))
    content2 = normalize_text(read_file(file2))

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


if __name__ == "__main__":
    exit(run())
