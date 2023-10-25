# Monorepo

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ **This workspace has been generated by [Nx, a Smart, fast and extensible build system.](https://nx.dev)** ✨

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

### Relevant documentation

- About Expo: [Expo Documentation](https://docs.expo.dev/)

## Backend Development

The betterangels_backend is built on Django, a high-level Python web framework. It also utilizes Celery for distributed task processing, enabling the scheduling and execution of tasks.

### Starting Django

To start the Django backend server:

```bash
nx run betterangels-backend:start
```

Once started, you can access the Django development server at the default address: http://localhost:8000/ or the port you've configured.

### Starting the Celery Beat Scheduler

The scheduler, powered by Celery Beat, is responsible for triggering scheduled tasks. If you'd like to test the scheduled tasks, you will need to run the scheduler.

The scheduler is responsible for triggering scheduled tasks. If you'd like to test the scheduled tasks, you will need to run the scheduler.

To start the scheduler:

```bash
nx run betterangels-backend:start-scheduler
```

### Starting the Worker

Workers handle task execution. They can run without the scheduler if you're not testing scheduled tasks.

To start a worker:

```bash
nx run betterangels-backend:start-worker
```

Note: While workers can run independently of the scheduler, the scheduler requires at least one worker to process the scheduled tasks.
