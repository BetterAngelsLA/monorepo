#!/usr/bin/env bash
set -e

OUTPUT_DIR="schema"
APPS=(
  accounts
  clients
  common
  hmis
  legal
  notes
  proxy
  reports
  shelters
  tasks
)

mkdir -p "$OUTPUT_DIR"

for app in "${APPS[@]}"
do
  echo "Generating schema for $app"
  python manage.py graph_models \
    "$app" \
    --group-models \
    -X Permission -X ContentType \
    -o "$OUTPUT_DIR/$app.svg"
done

echo "Done. Diagrams saved to $OUTPUT_DIR/"


# MAKE IT EXECUTABLE
# Inside the container:
# chmod +x scripts/generate_schema_diagrams.sh

# RUN IT
# from:
# apps/betterangels-backend
# run:
# ./scripts/generate_schema_diagrams.sh

# OPEN
# from host machine (not container)
# open apps/betterangels-backend/schema/accounts.svg
# open apps/betterangels-backend/schema/shelters.svg
# etc...

# OPTIONAL - add to end for full diagram?
# python manage.py graph_models \
#   accounts clients common hmis legal notes proxy reports shelters tasks \
#   --group-models \
#   -X Permission -X ContentType \
#   -o "$OUTPUT_DIR/full_system.svg"
