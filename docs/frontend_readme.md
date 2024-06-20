# betterangels

## Frontend Development Guide (Mac)

<hr>

The betterangels_frontend is built in [React Native](https://reactnative.dev/). It uses [Expo](https://docs.expo.dev/) to build and run the application across devices.

### Installation Guide

**Prerequisites:**

- [Xcode](https://developer.apple.com/xcode/resources/)
- [Android SDK Platform-Tools](https://developer.android.com/studio/releases/platform-tools)
- Expo Dev Builds
  - [Android](https://expo.dev/accounts/better-angels/projects/betterangels/builds/d76c28fb-9433-4f49-a062-6dfb961bc59a)
  - [iOS](https://expo.dev/accounts/better-angels/projects/betterangels/builds/eee2cfba-66d7-4cfe-ad56-4bd7cd69e2cb)
  - [iOS Simulator](https://expo.dev/accounts/better-angels/projects/betterangels/builds/905d580b-59fa-4c50-9372-9469b6305b43)

**Setup:**

1. Install [NVM](https://github.com/nvm-sh/nvm) to be able to use different node versions.

   ```bash
   brew install nvm
   ```

1. Follow the instructions in the terminal to configure NVM in your shell profile. It should look similar to:

   e.g. `~/.profile` or `~/.zshrc`:

   ```
   export NVM_DIR="$HOME/.nvm"
   [ -s "/usr/local/opt/nvm/nvm.sh" ] && \. "/usr/local/opt/nvm/nvm.sh" # This loads nvm
   [ -s "/usr/local/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/usr/local/opt/nvm/etc/bash_completion.d/nvm"
   ```

   If these instructions don't appear, run the following:

   ```bash
   brew info nvm
   ```

1. Install node version 20.12.2

   ```bash
   nvm install 20.12.2
   ```

1. Install yarn

   ```
   brew install yarn
   ```

1. Go to the monorepo and run yarn install

   ```bash
   cd monorepo
   yarn install
   ```

1. Optional: Switch your node version back to the latest and make it your default for any new terminal windows:

   ```bash
   nvm install node && nvm alias default node
   ```

### Running the Frontend: Nx Workspace with Expo Application

#### Starting Expo

1. Open a new integrated terminal (local) and run the following to start Expo in your local environment

   Start the Outreach app

   ```bash
   yarn nx start betterangels
   ```

   Start the Shelter app

   ```bash
   yarn nx start shelter
   ```

   If your current node version is incorrect, run the following and try again.

   ```bash
   nvm use 20.12.2
   ```

1. Press "w" to open the web version of the application :tada:

#### Starting the iOS emulator

1. Make sure Xcode is fully installed and hit "i" while Expo is running

#### Starting Android

1. Give Android port access to your local machine to allow the API to work locally:

   **Important** For OAuth redirects to work locally for **Android** emulator, run:

   ```
   adb reverse tcp:8000 tcp:8000
   ```

   Note: This might require you to install adb (Android Debug Bridge) [Android SDK Platform-Tools](https://developer.android.com/studio/releases/platform-tools)

1. Hit "a" while Expo is running

#### Testing

- **Lint** the "betterangels" application:

```
yarn nx lint betterangels
```

- **Test** the "betterangels" application:

```
yarn nx test betterangels
```

#### Starting Storybook

[Storybook](https://storybook.js.org/docs) is a frontend workshop for building UI components.

to run `yarn storybook`
to build `yarn storybook:build`

<details>
<summary>Advanced</summary>

- **Build** the "betterangels" application:

```
yarn nx build betterangels
```

</details>

### Managing GraphQL Schema and Types

In our project, we use GraphQL extensively, and managing the GraphQL schema and types is a crucial part of our development process. This section aims to clarify how we handle GraphQL schema generation and type generation, and why we organize our GraphQL-related files in specific folders.

**Understanding the Folder Structure**

- `graphql`: Contains our GraphQL queries and mutations.
- `rest-graphql`: Containes `apollo-rest-link` queries and mutations. These queries & mutation do not generate TypeScript types, though in the future we can manually create our own GraphQL schema if we desire.
- `gql-types`: Types generated from our Django GraphQL schema. They should always be kept up to date with the latest schema.

**A Note on Organizing Queries and Mutations**

It is a common practice to place GraphQL queries and mutations next to their respective components. This approach facilitates easier understanding and management of which components rely on specific parts of the GraphQL schema. However, at this time, we have diverged from this practice by breaking out these queries and mutations into separate folders. It is important we document why this decision has been made or revert back to colocating querins and mutations with components.

#### Generating GraphQL Schema

The GraphQL schema represents the capabilities of our API in terms of types and the operations that can be performed on those types. Keeping the schema up-to-date is vital for frontend and backend consistency.

**How to Generate the Schema:**

Run the schema generation command:

```bash
yarn nx affected -t generate-graphql-schema
```

This will update the GraphQL schema files based on the latest API changes.

#### Generating GraphQL Types

Run the type generation command:

```bash
yarn nx affected -t generate-graphql-types
```

This will update the TypeScript types in the gql-types folder. If there are any uncommitted changes after running this command, it indicates that the types are out-of-date.

#### Keeping Types Up-to-Date

Our CI pipeline checks if the generated GraphQL schema and types are up-to-date. If there's a discrepancy, the pipeline will fail, prompting you to regenerate and commit these files.

<br>
<br>
