generate-schema:
	yarn nx affected -t generate-graphql-schema

generate-types:
	yarn nx affected -t generate-graphql-types

migrations:
	cd /workspace/apps/betterangels-backend && python manage.py makemigrations && cd /workspace

migrate:
	yarn nx run betterangels-backend:migrate

start-be:
	yarn nx start betterangels-backend

test-be:
	yarn nx test betterangels-backend
