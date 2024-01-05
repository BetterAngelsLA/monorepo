import os

from betterangels_backend.schema import schema


def run() -> int:
    print("Generating graphql schema...")
    schema_str = str(schema)
    with open("tmp/schema.graphql", "w") as file:
        file.write(schema_str)

    result = compare_files()

    return result


def compare_files() -> int:
    file1 = "tmp/schema.graphql"
    file2 = "schema.graphql"
    with open(file1) as f1:
        content1 = normalize_text(f1.read())

    with open(file2) as f2:
        content2 = normalize_text(f2.read())

    if content1 == content2:
        return 0
    else:
        return 1


def normalize_text(text: str) -> str:
    # Remove all whitespace
    text = "".join(text.split())
    # Remove all newlines
    text = text.replace("\n", "")
    # Remove all tabs
    text = text.replace("\t", "")
    return text


# def compare_files() -> int:
#     file1 = "tmp/schema.graphql"
#     file2 = "schema.graphql"
#     # Compare the files
#     print("Comparing files...")
#     with open(file1) as f1:
#         f1_text = f1.readlines()
#     with open(file2) as f2:
#         f2_text = f2.readlines()
#     diff = difflib.unified_diff(f1_text, f2_text, fromfile=file1, tofile=file2)
#     print("".join(diff))
#     if len(list(diff)) == 0:
#         return 0  # files are the same
#     else:
#         return 1  # files are different


def cleanup() -> None:
    os.remove("tmp/schema.graphql")
