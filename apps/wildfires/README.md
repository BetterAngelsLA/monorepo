# Wildfire LA

Welcome to the Wildfire LA project! Our goal is to facilitate the discovery of resources for people impacted by the fires in Los Angeles county.

## Development

`wildfires` is a React web app running on a vite server locally.

To run the web app locally:

1. Pull the repo (monorepo)
2. run command: `yarn`
3. add a `.env` file (see .env.sample)
4. To start server:

- run command from the project root: `yarn fires`
  - `yarn fires` is an alias for `nx serve wildfire`
  - app defaults to `http://localhost:8200/`

## Tests

Command to run tests: `yarn nx test wildfires`;
