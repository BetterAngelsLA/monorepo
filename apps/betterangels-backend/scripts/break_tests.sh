#!/bin/bash

# This script continuously runs pytest until a test fails or is manually stopped.
# Usage:
# 1. Navigate to the project directory: cd apps/betterangels-backend
# 2. Run the script: ./scripts/break_tests.sh
# To stop the tests manually, press Ctrl+C in the terminal.

while true; do
    echo "Running tests with pytest..."

    # Adjust the test target and -k filter as needed.
    # For verbose output, add -v or -vv.
    uv run pytest notes/tests/ -k 'test_queries'

    # Check if the last command resulted in an error
    if [ $? -ne 0 ]; then
        echo "Tests failed"
        break
    fi
done

echo "Exiting script."
