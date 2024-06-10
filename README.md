<h1 align="center">
  <br>
  <a href="https://www.betterangels.la/" target="_blank" rel="noreferrer"><img alt="Better Angels Logo" src="https://avatars.githubusercontent.com/u/137959057?s=100&v=4" width="100"></a>
  <br>
  Better Angels Monorepo
  <br>
</h1>

<p align="center">
   <a href="https://reactnative.dev/docs/getting-started" target="_blank"><img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" hspace="10" /></a>
   <a href="https://storybook.js.org/docs" target="_blank"><img src="https://img.shields.io/badge/storybook-FF4785?style=for-the-badge&logo=storybook&logoColor=white" hspace="10" /></a>
   <a href="https://playwright.dev/docs/intro" target="_blank"><img src="https://img.shields.io/badge/Playwright-45ba4b?style=for-the-badge&logo=Playwright&logoColor=white" hspace="10" /></a>
   <a href="https://graphql.org/code/" target="_blank"><img src="https://img.shields.io/badge/GraphQl-E10098?style=for-the-badge&logo=graphql&logoColor=white" hspace="10" /></a>
   <br><br>
   <a href="https://docs.aws.amazon.com/" target="_blank"><img src="https://img.shields.io/badge/Amazon AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" hspace="10" /></a>
   <a href="https://docs.djangoproject.com/" target="_blank"><img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green" hspace="10" /></a>
   <a href="https://docs.docker.com/" target="_blank"><img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" hspace="10" /></a>
   <a href="https://docs.expo.dev/" target="_blank"><img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=FFFFFF" hspace="10" /></a>
</p>

<br>
<br>

## Frontend Development Guide (Mac)

<hr>

The betterangels_frontend is built in [React Native](https://reactnative.dev/). It uses [Expo](https://docs.expo.dev/) to build and run the application across devices.

### Installation Guide

**Prerequisites:**

- [Xcode](https://developer.apple.com/xcode/resources/)
- [Android SDK Platform-Tools](https://developer.android.com/studio/releases/platform-tools)
- [Expo Go](https://expo.dev/signup) with project access

**Setup:**

1. Install [NVM](https://github.com/nvm-sh/nvm) to be able to use different node versions.

   ```bash
   brew install nvm
   ```

1. Follow the instructions in the terminal to configure NVM in your shell profile. It should look similar to:

   e.g. ~/.profile or ~/.zshrc:
   export NVM_DIR="$HOME/.nvm"
   [ -s "/usr/local/opt/nvm/nvm.sh" ] && \. "/usr/local/opt/nvm/nvm.sh" # This loads nvm
   [ -s "/usr/local/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/usr/local/opt/nvm/etc/bash_completion.d/nvm"

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

## Backend Development Guide

<hr>

The betterangels_backend is built on Django, a Python web framework. It also utilizes Celery for distributed task processing, enabling the scheduling and execution of tasks.

### Installation Guide

**Prerequisites:**

- Visual Studio Code (VSCode)
- Docker
- Development containers

**Setup:**

1. Run Docker
1. Clone the monorepo repo from github
1. Open it in a VSCode workspace
1. Cmd + Shift + P and select "Dev Containers: Rebuild Container"
1. Reopen a new VSCode workspace
1. Apply migrations:

   ```bash
   yarn nx run betterangels-backend:migrate
   ```

1. Install dependencies

   ```bash
   poetry install
   ```

### Running the Backend

#### Starting Django

To start the Django backend server:

```bash
yarn nx start betterangels-backend
```

Once started, you can access the Django development server at the default address: [http://localhost:8000/admin/](http://localhost:8000/admin/) or the port you've configured.
Login using creds: `admin@ba.la`/`admin`

#### Starting a Django Shell

1. Activate a poetry shell

   ```bash
   poetry shell
   ```

1. Navigate to `betterangels-backend` app directory

   ```bash
   cd apps/betterangels-backend/
   ```

1. Start Django admin shell

   ```bash
   django-admin shell --settings betterangels_backend.settings
   ```

### Testing

#### Running Tests

To run the full test suite:

```bash
yarn nx test betterangels-backend
```

To run an individual test, add the full path of the test in dot notation. Example:

```bash
yarn nx test betterangels-backend accounts.tests.UsersManagersTests.test_create_user
```

#### Debugging Tests

To run tests with breakpoints via the terminal, you'll need to use a `poetry shell` as described in the section above, then:

1. Add any breakpoint to your code/tests:

   Example (using `IPython` which is already in the dev dependencies):

   ```
   from IPython import embed; embed()
   ```

1. Run tests using `python manage.py test`. Example:

   ```bash
   python manage.py test accounts.tests.UsersManagersTests.test_create_user
   ```

To use VSCode's debugger:

<img width="1230" alt="image" src="https://github.com/BetterAngelsLA/monorepo/assets/4707640/2d8d6351-1cf3-44cb-912c-7d069e597095">

1. Select the test tube icon on the left
1. Add a breakpoint (red dot) on the line you would like to break at
1. Click the "Run and Debug" button next to the test you want to run
1. Go to the `Debug Console` on the bottom to access the interactive shell

### Celery Integration

#### Starting the Celery Beat Scheduler

The scheduler, powered by Celery Beat, is responsible for triggering scheduled tasks. If you'd like to test the scheduled tasks, you will need to run the scheduler.

The scheduler is responsible for triggering scheduled tasks. If you'd like to test the scheduled tasks, you will need to run the scheduler.

To start the scheduler:

```bash
yarn nx run betterangels-backend:start-scheduler
```

#### Starting the Worker

Workers handle task execution. They can run without the scheduler if you're not testing scheduled tasks.

To start a worker:

```bash
yarn nx run betterangels-backend:start-worker
```

Note: While workers can run independently of the scheduler, the scheduler requires at least one worker to process the scheduled tasks.

### Email Testing

Django provides a flexible way to handle email backends. By default, our configuration uses the file-based email backend to capture sent emails as files. This is helpful for local development and testing without actually sending real emails.

#### File-based Email Backend (Local Testing):

Configure the .env File: Set the email backend in your .env file to use the file-based backend:

```bash
POST_OFFICE_EMAIL_BACKEND=django.core.mail.backends.filebased.EmailBackend
```

Checking Sent Emails: After configuring the backend, any email sent from the application will be stored as a file under tmp/app-emails in the project's directory.

Reading Emails: Navigate to the tmp/app-emails directory and open the email files to view the rendered HTML content. Each file represents an individual email sent from the application.

#### Switching to SES (Amazon Simple Email Service)

Before switching to SES, ensure that you're authenticated to AWS using Single Sign-On (SSO).

```bash
aws sso login
```

Configure the .env File: Update the email backend in your .env file to use the django_ses backend:

```bash
POST_OFFICE_EMAIL_BACKEND=django_ses.SESBackend
```

Sending & Receiving: With the above configuration, any emails sent from the application will now be dispatched through Amazon SES.

### Integrating Django PG History

[Django PG History](https://django-pghistory.readthedocs.io/en/3.0.0/) is used in this project to track changes to model instances over time. The `django-pghistory` should already be added into the project's setting. If you're developing a new model or want to add historical tracking to an existing model, follow these steps:

#### Step 1. Modify Your Model

Update your model to allow pghistory to track events. Edit the model file to include:

```python
import pghistory

@pghistory.track()
class YourModel(models.Model):
   # your fields here
```

Optionally, include specific events to track:

```python
import pghistory

@pghistory.track(
   pghistory.InsertEvent("your_model.add"),
   pghistory.UpdateEvent('your_model.update'),
   pghistory.DeleteEvent("your_model.remove"),
)
class YourModel(models.Model):
   # your fields here
```

#### Step 2. Generate and apply migrations to update your database schema

```bash
   yarn nx run betterangels-backend:makemigrations
   yarn nx run betterangels-backend:migrate
```

#### Step 3. Add pghistory context manager when updating models you want to track

<details>
<summary>

The pghistory library has some unexpected behavior around `pgh_created_at` timestamp.

</summary>
<img width="597" alt="image" src="https://github.com/BetterAngelsLA/monorepo/assets/4707640/81b9bed2-17eb-403c-83ee-1a3ade72709a">
</details>

In order to keep track of the of an event, a custom context manager (`pghistory.context`) needs to be added whenever the tracked model is being modified:

```python
class Mutation:

   def modify_tracked_model_mutation(self, info: Info, data: SomeMutationInput) -> TrackedModelType:
      with transaction.atomic(), pghistory.context(
         tracked_model_id=data.tracked_model_id, timestamp=timezone.now(), label=info.field_name
      ):
         # your mutation logic here
```

#### Step 4. Track events that occurred

To track the historical events for a certain model based on their id and timestamp, query the `Context` table using the custom `tracked_model_id` and `timestamp` metadata fields added in Step 3.

```python
Context.objects.filter(metadata__tracked_model_id=tracked_model_id).order_by('metadata__timestamp')
```

</details>
