# Shelter DB

Welcome to the BetterAngels Shelter DB project! Our goal is to facilitate the discovery of homeless shelters in Los Angeles county.

## Development

`shelter-web` is a React web app running on a vite server locally.

To run the web app locally:

1. Pull the repo (monorepo)
2. add a .env file (see .env.sample)
3. To start server:

- run this command from the project root: `yarn shelter`
  - `yarn shelter` is an alias for `nx serve shelter-web`
  - app defaults to `http://localhost:8083/`

## Tests

Command to run `shelter-web` tests: `yarn nx test shelter-web`;
