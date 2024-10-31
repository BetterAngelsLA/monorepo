# betterangels

## Frontend Development Guide (Mac)

<hr>

The betterangels_frontend is built in [React Native](https://reactnative.dev/). It uses [Expo](https://docs.expo.dev/) to build and run the application across devices.

If you are a volunteer be sure to also read the [Volunteer Contributors](#volunteer-contributors) section



### Installation Guide

**Prerequisites:**

- [Xcode](https://developer.apple.com/xcode/resources/)
- [Android SDK Platform-Tools](https://developer.android.com/studio/releases/platform-tools)
- Expo Dev Builds
  - [Android](https://expo.dev/accounts/better-angels/projects/betterangels/builds/d76c28fb-9433-4f49-a062-6dfb961bc59a)
  - [iOS](https://expo.dev/accounts/better-angels/projects/betterangels/builds/eee2cfba-66d7-4cfe-ad56-4bd7cd69e2cb)
  - [iOS Simulator](https://expo.dev/accounts/better-angels/projects/betterangels/builds/905d580b-59fa-4c50-9372-9469b6305b43)

**Setup:**

Run the following on the host machine—**not in the container**:

> [!WARNING]
> If you run the following commands inside the Docker container, they will not function
> correctly. Use your **System Terminal** instead.

1. Install [NVM](https://github.com/nvm-sh/nvm)

   ```bash
   brew install nvm
   ```

1. Install yarn

   ```
   brew install yarn
   ```

1. Follow the instructions in the terminal to configure NVM in your shell profile. If the instructions don't appear, run `brew info nvm`.

   The instructions will look similar to:

   > You should create NVM's working directory if it doesn't exist:
   >
   > ```
   > mkdir ~/.nvm
   > ```

   > Add the following to your shell profile e.g. ~/.profile or ~/.zshrc:

   > ```
   > export NVM_DIR="$HOME/.nvm"
   > [ -s "$(brew --prefix)/opt/nvm/nvm.sh" ] && \. "/usr/local/opt/nvm/nvm.sh" # This loads nvm
   > [ -s "$(brew --prefix)/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/usr/local/opt/nvm/etc/bash_completion.d/nvm"
   > ```

1. Reload your shell profile or restart your terminal for the changes to take effect

   ```bash
   source ~/.zshrc
   ```

1. Install node version 20.12.2

   ```bash
   nvm install 20.12.2
   ```

1. Clone the monorepo
   a. [Setup SSH (optional)](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

   ```bash
   git clone git@github.com:BetterAngelsLA/monorepo.git
   ```

   b. Alternatively use https

   ```bash
   git clone https://github.com/BetterAngelsLA/monorepo.git
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

1. Optional: add a `.env.local` file:
   - See `.env.local.sample` file for refernce
   - .env.local file should override the .env values on your local machine
     - usage example: seting ` EXPO_PUBLIC_API_URL`` and  `EXPO_PUBLIC_DEMO_API_URL` to same domain to avoid CORS issues
   - NX docs on [Environment Variables](https://nx.dev/recipes/tips-n-tricks/define-environment-variables)

### Running the Frontend: Nx Workspace with Expo Application

#### Starting Expo

1. Open a new integrated terminal (local) and run the following to start Expo in your local environment
   _Note: You should have development builds (linked above) installed on your device_

   Start the Outreach app

   ```bash
   yarn nx run betterangels:start
   ```

   Start the Shelter app

   ```bash
   yarn nx start shelter
   ```

   If your current node version is incorrect, run the following and try again.

   ```bash
   nvm use 20.12.2
   ```

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

## Volunteer Contributors

This section provides guidelines to help new volunteer contributors get set up and aligned with our development process.

---

### Getting Started

Follow these steps to get started as a contributor. Begin by following the [Installation Guide](#installation-guide) up to but not including **Step 6: Clone the monorepo**. Complete steps 1-3 below, then continue with the installation guide from **Step 7: Go to the monorepo and run yarn install**.

#### 1. Forking the Repository

To start, **fork** the Better Angels repository:

1. Go to the [Better Angels GitHub repository](https://github.com/BetterAngelsLA/monorepo).
2. Click the **Fork** button in the top right to create a personal copy of the repository under your GitHub account.

#### 2. Cloning Your Fork

Once your fork is created, clone it to your local machine:

```bash
git clone https://github.com/<your-username>/monorepo.git
cd monorepo
```

Replace `<your-username>` with your GitHub username.

#### 3. Adding the Original Repository as an Upstream Remote

This step allows you to pull updates from the original repository and stay in sync with the main project.

```bash
git remote add upstream https://github.com/BetterAngelsLA/monorepo.git
```

### Creating a feature branch and pull requests

#### 1. Keeping Your Fork Updated

To keep your fork up-to-date with the latest changes from the main repository:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

#### 2. Creating a Feature Branch

Check the Jira board for tickets and assign one to yourself, move it to the ***In Progress*** column. Always create a new branch for each feature or bug fix you’re working on. This keeps your work organized and helps with code reviews.


Follow this naming convention when creating branches: **DEV-ticketNumber/short-description**

- Example: `DEV-749/hide_dob`

Using this convention helps everyone identify the purpose of each branch and the related ticket or task.

To create a new branch:

```bash
git checkout -b feature-branch-name
```

#### 3. Committing and Pushing Changes

Stage and commit your changes with a meaningful commit message:

```bash
git add .
git commit -m "Describe your changes here"
git push origin feature-branch-name
```
#### 4. Creating a Pull Request

1. Go to your forked repo on GitHub.
2. You should see an option to **Compare & pull request**. Click it to open a pull request from your branch to the `main` branch of the original repository.
3. Add a description of your changes, why they're necessary, and any context for reviewers.
4. On the Jira board move your ticket from **In Progress** to **Review**
5. In Betterangels' Slack let one of the staff engineers know you have made a pull request with a link and @ them on the #tech-volunteers-engineering channel.

#### 5. After the Pull Request is Merged

Once your PR is approved and merged, delete your local and remote feature branches to keep your workspace clean:

```bash
# Delete the local branch
git branch -d feature-branch-name

# Delete the remote branch
git push origin --delete feature-branch-name
```

Thank you for contributing! Feel free to reach out if you have any questions or need assistance during onboarding.

<br>
<br>
