# Nx Monorepo: Adding a Vite React App and Shared Library (TypeScript)

This repository is managed with [Nx](https://nx.dev/), enabling scalable, modular development with Vite and React (TypeScript).

## 1. Creating a New Vite React App (TypeScript)

To generate a new React app using Vite and TypeScript:

    yarn nx g @nx/react:app my-app --bundler=vite

During the interactive prompts, select:

    Would you like to add routing?: Yes
    Which unit test runner should be used?: jest
    Which E2E test runner would you like to use?: playwright

## 2. Creating a New Shared Library (TypeScript)

To generate a shared UI library (can contain React components, utilities, etc.):

    yarn nx g @nx/react:lib shared-ui --bundler=vite

## 3. Running Common Nx Tasks

Serve the app in development mode:

    yarn nx my-app:serve
    # or
    yarn nx my-app:dev

Build the app:

    yarn nx my-app:build

Run unit tests:

    yarn nx my-app:test
    yarn nx shared-ui:test

Lint a project:

    yarn nx my-app:lint
    yarn nx shared-ui:lint

E2E tests:

    yarn nx my-app-e2e:e2e

List all projects in the workspace:

    yarn nx show projects

## 4. Example Project Structure

After generating the app and library, your workspace will look like:

    apps/
      my-app/
    libs/
      shared-ui/

## 5. Adding a New Static Site: Infrastructure Setup

When adding a new static site to this monorepo, you **must** provision the necessary cloud infrastructure using our standard Terraform setup.

**Please see the [static-website Terraform module README](https://github.com/BetterAngelsLA/infrastructure/tree/main/modules/services/static-website/README.md) for full setup instructions, example configs, and production DNS details.**

- All static sites must use the [`static-website` Terraform module](https://github.com/BetterAngelsLA/infrastructure/tree/main/modules/services/static-website).
- For a working example, see the [`shelter-web` config](https://github.com/BetterAngelsLA/infrastructure/tree/main/environments/production/us-west-2/static-sites/shelter-web).
- For production, any necessary CNAMEs for `betterangels.la` domains should be added in GoDaddy. Subdomains on `prod.betterangels.la` are mapped automatically in Terraform if the correct zone is used.

> **Reference the [Terraform module README](https://github.com/BetterAngelsLA/infrastructure/tree/main/modules/services/static-website/README.md) for the authoritative source on how to configure static sites.**

## 6. Resources

- [Nx Documentation](https://nx.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Nx React Plugin](https://nx.dev/packages/react)
