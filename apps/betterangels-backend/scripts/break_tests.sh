#!/bin/bash

# This script continuously runs Django tests using pytest with a custom PytestTestRunner.
# The loop will execute until a test fails or until it is manually stopped.
# Usage:
# 1. Navigate to the project directory: cd apps/betterangels-backend
# 2. Run the script: ./test_script.sh
# To stop the tests manually, press Ctrl+C in the terminal.

while true; do
    echo "Running Django tests with pytest..."

    # Specify the Django app and test directory. Adjust or remove 'notes' as needed.
    # Include any pytest-specific arguments after '--'.
    # Example for verbose output: python manage.py test notes -- notes/tests -- -vv
    python manage.py test notes -- notes/tests -k 'test_queries'

    # Check if the last command resulted in an error
    if [ $? -ne 0 ]; then
        echo "Tests failed"
        break
    fi
done

echo "Exiting script."
