<h1 align="center">
  <br>
  <a href="https://www.betterangels.la/" target="_blank" rel="noreferrer"><img alt="Better Angels Logo" src="https://avatars.githubusercontent.com/u/137959057?s=100&v=4" width="100"></a>
  <br>
  Better Angels Monorepo
  <br>
</h1>

<p align="center">
   <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" hspace="10" />
   <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=FFFFFF" hspace="10" />   
   <img src="https://img.shields.io/badge/storybook-FF4785?style=for-the-badge&logo=storybook&logoColor=white" hspace="10" />
   <img src="https://img.shields.io/badge/Playwright-45ba4b?style=for-the-badge&logo=Playwright&logoColor=white" hspace="10" />
   <img src="https://img.shields.io/badge/Amazon AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white" hspace="10" /> 
   <img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green" hspace="10" /> 
   <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" hspace="10" />
</p>

<details open>
<summary>

## Frontend Development Guide

</summary>

The betterangels_frontend is built in [React Native](https://reactnative.dev/). It uses [Expo](https://docs.expo.dev/) to build and run the application across devices.

### Installation Guide

**Prerequisites:**

- Xcode Fully Installed

**Setup:**

1. Install node version manager

   ```bash
   brew install nvm
   ```

1. Install version 18.17.1

   ```bash
   nvm install 18.17.1
   ```

1. Follow the instructions in the terminal to add your shell profile. It should look similar to:

   e.g. ~/.profile or ~/.zshrc:
   export NVM_DIR="$HOME/.nvm"
   [ -s "/usr/local/opt/nvm/nvm.sh" ] && \. "/usr/local/opt/nvm/nvm.sh" # This loads nvm
   [ -s "/usr/local/opt/nvm/etc/bash_completion.d/nvm" ] && \. "/usr/local/opt/nvm/etc/bash_completion.d/nvm"

1. Go to the monorepo and run yarn install

   ```bash
   cd monorepo
   yarn install
   ```

### Running the Frontend: Nx Workspace with Expo Application

#### Starting Expo

1. The following will start the local environment

   ```bash
   npm run ba
   ```

#### Starting Android

1. Set Up Google OAuth Locally:

   **Important** For OAuth redirects to work locally for **Android** emulator, run:

   ```
   adb reverse tcp:8000 tcp:8000
   ```

   Note: This might require you to install adb (Android Debug Bridge) [Android SDK Platform-Tools](https://developer.android.com/studio/releases/platform-tools)

- **Build** the "betterangels" application:

```
yarn nx build betterangels
```

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

</details>

<details open>
<summary>

## Backend Development Guide

</summary>

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

### Integrating Django Simple History

[Django Simple History](https://django-simple-history.readthedocs.io/en/3.4.0/quick_start.html) is used in this project to track changes to model instances over time. The `django-simple-history` should already be added into the project's setting. If you're developing a new model or want to add historical tracking to an existing model, follow these steps:

#### Step 1: Modify Your Model

Within the container, update your model to include historical records. Edit the model file to include:

```python
from simple_history.models import HistoricalRecords

class YourModel(models.Model):
    # your fields here
    history = HistoricalRecords()
```

#### Step 2 (Optional): Update Admin Interface

If Django admin integration is desired, modify your model's admin class:

```python
from simple_history.admin import SimpleHistoryAdmin

@admin.register(YourModel)
class YourModelAdmin(SimpleHistoryAdmin):
    pass

```

#### Step 3 (Optional): Generate and apply migrations to update your database schema

```bash
   yarn nx run betterangels-backend:migrate
```

#### Step 4: Accessing History in Views/Templates

Use the `history` attribute of your model instance to access historical records.

</details>

<details open>
<summary>

## More

</summary>

### Versioning

- Production - x.y.z
- Development - x.y.z-beta.t

</details>
