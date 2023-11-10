# Monorepo

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ **This workspace has been generated by [Nx, a Smart, fast and extensible build system.](https://nx.dev)** ✨

<details>
<summary>

## Frontend Development Guide

</summary>

## Storybook

to run `yarn storybook`
to build `yarn storybook:build`

# Nx Workspace with Expo Application: BetterAngels

### 1. Set Up Google OAuth Locally:

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
nx test betterangels
```

### Versioning

- Production - x.y.z
- Development - x.y.z-beta.t

</details>

<details>
<summary>

## Backend Development Guide

</summary>

The betterangels_backend is built on Django, a Python web framework. It also utilizes Celery for distributed task processing, enabling the scheduling and execution of tasks.

### Installation Guide

```
Dependencies/Tools

- VSCode
- Docker
- Dev containers
```

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

### Starting Django

To start the Django backend server:

```bash
yarn nx start betterangels-backend
```

Once started, you can access the Django development server at the default address: [http://localhost:8000/admin/](http://localhost:8000/admin/) or the port you've configured.
Login using creds: `admin@ba.la`/`admin`

### Starting a Shell

1. First `cd` into the `betterangels-backend` app directory

   ```bash
   cd apps/betters-angelsbackend/
   ```

2. Start a poetry shell

   ```bash
   poetry shell
   ```

3. Start django admin shell

   ```bash
   django-admin shell --settings betterangels_backend.settings
   ```

### Running Tests

To run the full test suite:

```bash
yarn nx test betterangels-backend
```

To run tests with breakpoints via the terminal, you'll need to use a `poetry shell` as described in the section above, then:

1. Add any breakpoint to your code/tests:

   Example (using `IPython` which is already in the dev dependencies):

   ```
   from IPython import embed; embed()
   ```

2. Run tests using `python manage.py test`

To use VSCode's debugger:

<img width="1230" alt="image" src="https://github.com/BetterAngelsLA/monorepo/assets/4707640/2d8d6351-1cf3-44cb-912c-7d069e597095">

1. Select the test tube icon on the left
1. Add a breakpoint (red dot) on the line you would like to break at
1. Click the "Run and Debug" button next to the test you want to run
1. Go to the Debug Console on the bottom to access the interactive shell

#### Test Options

After the `yarn nx test betterangels-backend` or `python manage.py test` command, add options below:

To run an individual test, add the full path of the test in dot notation. Example:

```bash
python manage.py test accounts.tests.UsersManagersTests.test_create_user
```

### Starting the Celery Beat Scheduler

The scheduler, powered by Celery Beat, is responsible for triggering scheduled tasks. If you'd like to test the scheduled tasks, you will need to run the scheduler.

The scheduler is responsible for triggering scheduled tasks. If you'd like to test the scheduled tasks, you will need to run the scheduler.

To start the scheduler:

```bash
yarn nx run betterangels-backend:start-scheduler
```

### Starting the Worker

Workers handle task execution. They can run without the scheduler if you're not testing scheduled tasks.

To start a worker:

```bash
yarn nx run betterangels-backend:start-worker
```

Note: While workers can run independently of the scheduler, the scheduler requires at least one worker to process the scheduled tasks.

### Testing Emails

Django provides a flexible way to handle email backends. By default, our configuration uses the file-based email backend to capture sent emails as files. This is helpful for local development and testing without actually sending real emails.

#### Using the File-based Email Backend

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

</details>
