# betterangels-backend

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
   - **Windows/WSL Users:** Ensure "WSL Integration" for your specific distro is enabled in Docker Desktop Settings > Resources and click **Apply & Restart**.
1. Clone the monorepo repo from github
1. Open it in a VSCode workspace
1. Cmd + Shift + P and select "Dev Containers: Rebuild and Reopen in Container" (this command take a few minutes to complete). It will close and reopen a new VSCode workspace
1. Apply migrations:

   ```bash
   yarn nx run betterangels-backend:migrate
   ```

1. Install dependencies (if you just built the container, this step might already be done)

   ```bash
   poetry install
   ```

1. Add/Update `.env.local` file in the `apps/betterangels-backend` project to manage `local-only` environment variables.

### Running the Backend

#### Starting Django

To start the Django backend server:

```bash
yarn nx start betterangels-backend
```

Once started, you can access the Django development server at

- default address: [http://localhost:8000/admin/](http://localhost:8000/admin/)
  - or the port you've configured.
- Login using creds

  - email: `admin@example.com`
  - psw: `password`

  > **Connecting from Android Emulator:**
  >
  > If you are running the frontend on a Windows Android Emulator, `localhost` refers to the emulator itself.
  >
  > Update your frontend `apps/betterangels/.env` to use: `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000`

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
   python manage.py test accounts/tests/test_user_manager.py::UserManagerTestCase::test_create_user
   ```

To use VSCode's debugger:

<img width="1230" alt="image" src="https://github.com/BetterAngelsLA/monorepo/assets/4707640/2d8d6351-1cf3-44cb-912c-7d069e597095">

1. Select the `Testing` (test tube) icon on the left
1. Add a breakpoint (red dot) on the line you would like to break at
1. Navigate through the test directory to find the test you want to run and click the `Debug Test` (🐞 :arrow_forward:) button
1. Once the breakpoint is hit, you will be moved to the `Run and Debug` screen where you can step through your code
1. To access the interactive shell and run commands directly, go to the `Debug Console` tab of the terminal on the bottom

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

### Local File Storage (MinIO)

We use [MinIO](https://min.io/) as a local S3-compatible object store so that file uploads work the same way locally as they do in production (where we use AWS S3). MinIO runs automatically as part of the Docker Compose stack — no extra setup is required.

#### How It Works

- **MinIO** provides an S3-compatible API on port `9000` and an admin console on port `9001`.
- When `IS_LOCAL_DEV=True` (set in `.compose/local.shared.env`), Django uses the `LocalS3Storage` backend (`common/storage.py`) instead of the production `S3Storage`. This backend signs read URLs with the public MinIO endpoint (`localhost:9000`) so your browser/device can access files, while Django itself talks to MinIO over the Docker network (`minio:9000`).
- The `minio-setup` service automatically creates the `betterangels-local` bucket on first startup.

#### MinIO Admin Console

You can browse uploaded files and manage buckets via the MinIO web console:

- **URL:** [http://localhost:9001](http://localhost:9001)
- **Username:** `admin`
- **Password:** `password`

#### Environment Variables

All MinIO-related environment variables are committed in `.compose/local.shared.env` and applied automatically:

| Variable                         | Value                   | Purpose                                                 |
| -------------------------------- | ----------------------- | ------------------------------------------------------- |
| `AWS_S3_STORAGE_BUCKET_NAME`     | `betterangels-local`    | Local bucket name                                       |
| `LOCAL_S3_INTERNAL_ENDPOINT_URL` | `http://minio:9000`     | Docker-internal MinIO endpoint (used by Django)         |
| `LOCAL_S3_PUBLIC_ENDPOINT_URL`   | `http://localhost:9000` | Browser-reachable MinIO endpoint (used for signed URLs) |
| `AWS_ACCESS_KEY_ID`              | `admin`                 | MinIO root user                                         |
| `AWS_SECRET_ACCESS_KEY`          | `password`              | MinIO root password                                     |

You do **not** need to add any MinIO variables to your `.env.local` unless you want to override the defaults (e.g., to point at a real AWS bucket).

#### Android Emulator Access

If you are running the Android emulator, you need to forward port `9000` so the emulator can reach MinIO on `localhost`:

```bash
adb reverse tcp:9000 tcp:9000
```

See the [Frontend Development Guide](frontend_readme.md#starting-android) for the full list of `adb reverse` commands.

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
   pghistory.UpdateEvent("your_model.update"),
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
Context.objects.filter(metadata__tracked_model_id=tracked_model_id).order_by("metadata__timestamp")
```

---

### Supplemental Scripts

#### Seeding Shelters

To populate the database with test shelters:

```bash
cd apps/betterangels-backend/shelters/scripts/
poetry run python seed_shelters.py 10
```

### Troubleshooting

#### Aliases

For a list of command aliases, refer to [.bash_aliases](https://github.com/BetterAngelsLA/monorepo/blob/main/.bash_aliases)

##### `ynx-reset_db`

_WARNING:_ This is a destructive action and the local database will be dropped. Therefore, all data from all tables will be removed but it will allow you to run all migrations again. Use this command on the off chance that your local database doesn't reflect the new migration(s).
