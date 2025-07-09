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

### Steps

1. **Use the Static Website Terraform Module**

   All static sites should use the [`static-website` Terraform module](https://github.com/BetterAngelsLA/infrastructure/tree/main/modules/services/static-website) in the `infrastructure` repo.

2. **Reference the Shelter Web Example**

   See [`shelter-web` production config](https://github.com/BetterAngelsLA/infrastructure/blob/main/environments/production/us-west-2/static-sites/shelter-web/terragrunt.hcl) as a reference for the necessary files and structure.

3. **Create a Common Service Config**

   In [`environments/_envcommon/services/`](https://github.com/BetterAngelsLA/infrastructure/tree/main/environments/_envcommon/services), create a new HCL config for your site (e.g., `my-site.hcl`).

   **Example (`my-site.hcl`):**

   ```hcl
   terraform {
     source = "${get_repo_root()}//modules/services/static-website"
   }

   dependency "logging" {
     config_path = "${get_terragrunt_dir()}/../../s3/logging"
   }

   locals {
     environment_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
     region_vars      = read_terragrunt_config(find_in_parent_folders("region.hcl"))

     env        = local.environment_vars.locals.environment
     aws_region = local.region_vars.locals.aws_region
   }

   inputs = {
     app_name            = "my-site"
     logging_bucket_name = dependency.logging.outputs.s3_bucket_id
     static_bucket_name  = "${local.env}-${local.aws_region}-my-site"
   }
   ```

4. **Create Environment-Specific Configs**

   For each environment (e.g., `dev`, `production`), create a `terragrunt.hcl` referencing the common config.

   **Example for production:**

   ```
   environments/production/us-west-2/static-sites/my-site/terragrunt.hcl
   ```

   ```hcl
   include "root" {
     path = find_in_parent_folders()
   }

   include "envcommon" {
     path   = "${dirname(find_in_parent_folders())}/_envcommon/services/my-site.hcl"
     expose = true
   }

   dependency "cf_cert" {
     config_path = "${get_terragrunt_dir()}/../../../us-east-1/acm"
   }

   dependency "route53" {
     config_path = "${get_terragrunt_dir()}/../../../_global/route53"
   }

   locals {
     zone_name = "prod.betterangels.la"
   }

   inputs = {
     cloudfront_config = {
       zone_id             = dependency.route53.outputs.route53_zone_zone_id[local.zone_name]
       cert_arn            = dependency.cf_cert.outputs.acm_certificate_arn
       service_record_name = "my-site.${local.zone_name}"
       aliases = [
         "my-site.betterangels.la"
       ]
     }
   }
   ```

5. **Update DNS & Certificates as Needed**

   - Set the `zone_name`, `aliases`, and `cert_arn` for your actual domain.
   - Coordinate with the infra team if you need to add new DNS records or certificates.

---

**For more details, refer to:**

- [`shelter-web` config example](https://github.com/BetterAngelsLA/infrastructure/blob/main/environments/production/us-west-2/static-sites/shelter-web/terragrunt.hcl)
- [static website module README](https://github.com/BetterAngelsLA/infrastructure/tree/main/modules/services/static-website) in the infrastructure repository

---

## 6. Resources

- [Nx Documentation](https://nx.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Nx React Plugin](https://nx.dev/packages/react)
