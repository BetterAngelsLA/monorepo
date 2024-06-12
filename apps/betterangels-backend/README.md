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
