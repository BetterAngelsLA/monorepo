#!/bin/bash

# Infinite loop to run Django tests until an error occurs
while true; do
    echo "Running Django tests..."
    python manage.py test notes -- notes/tests -k 'test_queries'
    if [ $? -ne 0 ]; then  # Check if the last command returned an error
        echo "Tests failed"
        break  # Exit the loop if tests fail
    fi
    sleep 1  # Optional: Wait for 1 second before running the tests again
done

echo "Exiting script."
