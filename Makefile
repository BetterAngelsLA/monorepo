generate-schema:
	yarn nx affected -t generate-graphql-schema

generate-types:
	yarn nx affected -t generate-graphql-types

makemigrations:
	yarn nx run betterangels-backend:makemigrations

migrate:
	yarn nx run betterangels-backend:migrate

start-be:
	yarn nx start betterangels-backend

test-be:
	yarn nx test betterangels-backend
