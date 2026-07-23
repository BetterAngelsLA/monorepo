alias rebash="source .bash_aliases" # run this if you change this file

# precommit
alias ynx-precommit="ynx-lint && ynx-typecheck && ynx-validate-schema && ynx-check-migrations"

# migrations
alias ynx-check-migrations="yarn nx affected -t check-migrations"
alias ynx-makemigrations="yarn nx run betterangels-backend:makemigrations"
alias ynx-makemigrations="yarn nx run betterangels-backend:makemigrations"
alias ynx-migrate="yarn nx run betterangels-backend:migrate"

# graphql
alias ynx-generate-schema="yarn nx run-many -t generate-graphql-schema"
alias ynx-generate-types="yarn nx run-many -t generate-graphql-types"
alias ynx-generate="ynx-generate-schema && ynx-generate-types"
alias ynx-validate-schema="yarn nx run-many -t validate-graphql-schema"

# validations: format, lint etc...
alias ynx-format-be="yarn nx affected -t format betterangels-backend"
alias ynx-lint-be="yarn nx lint betterangels-backend"
alias ynx-lint-fe="yarn nx lint betterangels"
alias ynx-lint="yarn nx affected -t lint"
alias ynx-lint-all="yarn nx run-many -t lint"
alias ynx-typecheck="yarn nx affected -t typecheck"

# db
alias ynx-reset-db="yarn nx run betterangels-backend:reset_db"

# uv installs
alias ynx-uv-add="yarn nx run betterangels-backend:add --name"
alias ynx-uv-sync="yarn nx run betterangels-backend:install"

# service start
alias ynx-start-be="yarn nx start betterangels-backend"
alias ynx-start-fe="yarn nx start betterangels"

# other
alias ynx-splus="yarn nx run betterangels-backend:shell-plus"


# tests
alias ynx-test-fe="yarn nx test betterangels"

ynx-test-be() {
  # Usage: ynx-test-be [file]
  #   ynx-test-be                          - run all backend tests via nx
  #   ynx-test-be <file>                   - run a single test file via pytest
  #
  # <file> can be any of these path forms (all equivalent):
  #   shelters/tests/test_service_utils.py                                    - relative to apps/betterangels-backend/
  #   apps/betterangels-backend/shelters/tests/test_service_utils.py          - relative to workspace root
  #   /workspace/apps/betterangels-backend/shelters/tests/test_service_utils.py  - absolute path

  if [[ -n "$1" ]]; then
    local filepath

    filepath=$(echo "$1" | sed 's|.*/apps/betterangels-backend/||; s|^apps/betterangels-backend/||')

    if [[ ! -f "apps/betterangels-backend/$filepath" ]]; then
      echo "Error: file not found - '$filepath'"
      echo ""
      echo "Accepted path forms:"
      echo "  shelters/tests/test_service_utils.py                                       - relative to apps/betterangels-backend/"
      echo "  apps/betterangels-backend/shelters/tests/test_service_utils.py             - relative to workspace root"
      echo "  /workspace/apps/betterangels-backend/shelters/tests/test_service_utils.py  - absolute path"
      return 1
    fi

    cd apps/betterangels-backend && uv run pytest "$filepath"
    cd -
  else
    yarn nx test betterangels-backend
  fi
}

# help

ynx() {
  echo ""
  echo "Available ynx commands:"
  echo ""
  echo "  General"
  echo "    ynx                      - help"
  echo "    rebash                   - reload this file after changes"
  echo ""
  echo "  Precommit"
  echo "    ynx-precommit            - lint + typecheck + validate schema + check migrations"
  echo ""
  echo "  Migrations"
  echo "    ynx-check-migrations     - check for missing migrations (affected projects)"
  echo "    ynx-makemigrations       - generate new migrations"
  echo "    ynx-migrate              - apply migrations"
  echo ""
  echo "  GraphQL"
  echo "    ynx-generate-schema      - generate GraphQL schema"
  echo "    ynx-generate-types       - generate GraphQL types"
  echo "    ynx-generate             - generate schema + types"
  echo "    ynx-validate-schema      - validate GraphQL schema"
  echo ""
  echo "  Lint / Format / Typecheck"
  echo "    ynx-format-be            - format backend (affected)"
  echo "    ynx-lint-be              - lint backend"
  echo "    ynx-lint-fe              - lint frontend"
  echo "    ynx-lint                 - lint all affected projects"
  echo "    ynx-typecheck            - typecheck all affected projects"
  echo ""
  echo "  Database"
  echo "    ynx-reset-db             - reset the database"
  echo ""
  echo "  Dependencies"
  echo "    ynx-uv-add <pkg>       - add a uv dependency"
  echo "    ynx-uv-sync            - sync uv dependencies"
  echo ""
  echo "  Start Services"
  echo "    ynx-start-be             - start backend"
  echo "    ynx-start-fe             - start frontend"
  echo ""
  echo "  Tests"
  echo "    ynx-test-be              - run all backend tests"
  echo "    ynx-test-be <file>       - run a single backend test file"
  echo "    ynx-test-fe              - run all frontend tests"
  echo ""
  echo "  Other"
  echo "    ynx-splus                - open Django shell-plus"
  echo ""
}
