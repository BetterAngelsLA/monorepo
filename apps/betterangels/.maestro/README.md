# Better Angels End-to-End Tests

This directory contains the **Maestro E2E test suite** for the Better Angels mobile app.

Maestro is a cross-platform mobile UI testing framework that works with both **iOS simulators** and **Android emulators**.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Local Setup](#local-setup)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [Running Maestro Directly (Optional)](#running-maestro-directly-optional)
- [Directory Structure](#directory-structure)
- [Running Tests in CI](#running-tests-in-ci)
- [Writing Tests](#writing-tests)
- [Using Maestro Studio](#using-maestro-studio)
- [Reference Links](#reference-links)

---

## Quick Start

Assumes the local setup has already been completed (Java installed, Maestro CLI installed, and a simulator or emulator available).

Start the app:

    yarn ba

Run the full E2E test suite (defaults to iOS):

    yarn ba:e2e

Run on Android:

    yarn ba:e2e:android

---

## Local Setup

### 1. Install Java

Maestro requires a Java runtime.

Older macOS versions included Java by default, but newer systems do not.

Install Java (recommended version: **Java 17 LTS**):

```bash
brew install openjdk@17
```

Follow the Homebrew instructions printed after installation.
Usually this includes linking the JDK:

```bash
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk \
  /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

Verify Java installation:

```bash
java -version
```

Ensure `JAVA_HOME` is configured. Add to `~/.zshrc` if necessary:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH="$JAVA_HOME/bin:$PATH"
```

Then verify:

```bash
echo $JAVA_HOME
```

---

### 2. Install Maestro CLI

Install using Homebrew:

```bash
brew tap mobile-dev-inc/tap
brew install mobile-dev-inc/tap/maestro
```

Verify installation:

```bash
maestro --version
```

---

## Running Tests

### 1. Start the development server

Start the Better Angels Expo dev server:

```bash
yarn ba
```

---

### 2. Start a simulator or emulator

Start at least one device:

- **iOS:** Xcode Simulator
- **Android:** Android Emulator

Ensure that a dev build is installed in the simulator or emulator (e.g. "BetterAngels (Dev)") before running the tests.

**_Note:_** There are two ways to work with Maestro E2E tests locally:

- **Maestro CLI** — requires local setup, more flexible
- **Maestro Studio** — UI-based, no local setup needed (see [Using Maestro Studio](#using-maestro-studio))

---

### 3. Run tests

The tests run via nx targets defined in `apps/betterangels/project.json`. The `setup-maestro.sh` script auto-detects the device and Expo dev server URL.

**iOS (default):**

```bash
yarn ba:e2e
```

**Android:**

```bash
yarn ba:e2e:android
```

**Equivalent nx commands:**

```bash
yarn nx e2e betterangels -c ios
yarn nx e2e betterangels -c android

# or using the colon syntax:
yarn nx run betterangels:e2e:ios
yarn nx run betterangels:e2e:android
```

**Pass flags through to Maestro:**

```bash
yarn ba:e2e -- --verbose
yarn ba:e2e:android -- --debug-output
```

---

## Environment Variables

The script `setup-maestro.sh` auto-detects two key values:

- **`MAESTRO_DEEPLINK`** — the Expo dev client deep link URL (with `disableOnboarding=1`)
- **`MAESTRO_DEVICE`** — the device ID of the first booted simulator/emulator for the chosen platform

Maestro also auto-reads all `MAESTRO_*` prefixed vars from the shell environment.

Nx automatically loads `.env` files before running targets, so you can set overrides in `apps/betterangels/.env.local`.

### Overrides

No configuration is needed for standard simulator/emulator testing. To override, set any of:

| Variable            | Description                                   | Default              |
| ------------------- | --------------------------------------------- | -------------------- |
| `MAESTRO_DEEPLINK`  | Full deep link URL (highest priority)         | Auto-detected        |
| `MAESTRO_EXPO_HOST` | Dev server host                               | Auto-detected LAN IP |
| `MAESTRO_EXPO_PORT` | Dev server port                               | `8081`               |
| `MAESTRO_DEVICE`    | Device ID (simulator UDID or emulator serial) | First booted device  |

See `apps/betterangels/.env.local.sample` for examples.

For a full list of Maestro CLI environment variables, see the [Maestro CLI Environment Variables docs](https://docs.maestro.dev/maestro-cli/environment-variables).

---

## Running Maestro Directly (Optional)

If you prefer to run the Maestro CLI directly, source the resolve script first:

```bash
cd apps/betterangels
source .maestro/scripts/setup-maestro.sh ios
maestro --device $MAESTRO_DEVICE -p ios test .maestro/tests
```

Or pass everything manually:

```bash
maestro --device <DEVICE_ID> -p ios test apps/betterangels/.maestro/tests \
  -e MAESTRO_DEEPLINK="exp+betterangels://expo-development-client/?url=http://192.168.1.198:8081&disableOnboarding=1"
```

---

## Directory Structure

```
.maestro/
  tests/
    landing.yml          # Test flows

  steps/
    (reusable steps)

  scripts/
    setup-maestro.sh     # Auto-detects device & deep link
```

---

## Running Tests in CI

CI tests run via EAS Workflows. See `.eas/workflows/e2e-test.yml` for the pipeline configuration.

---

## Writing Tests

### Test IDs

Add a `testID` prop to React Native components so Maestro can reliably select them.

Guidelines:

- Use clear, stable names.
- Avoid relying on screen coordinates whenever possible.
- IDs should be:
  - **specific enough** to be unique within the screen
  - **generic enough** to make sense when used in reusable components

Example:

    <TextInput testID="email-input" />

Naming convention examples:

    email-input
    password-input
    login-button
    submit-button

Avoid coordinate-based selectors such as:

    - tapOn:
        point: "50%,62%"

These are fragile and may break when layouts or screen sizes change.

Prefer selectors like:

    - tapOn:
        id: email-input

---

## Using Maestro Studio

### Setup

1. Download and install [Maestro Studio](https://maestro.dev/)
2. Open Maestro Studio.
3. Select **Open Existing Maestro Workspace**.
4. Choose the repository's `.maestro` directory:

   `apps/betterangels/.maestro`

Studio will use this folder as the workspace.

### Open a Test

1. Start the simulator and run the Metro server so the app is loaded.
2. Connect the device inside Maestro Studio.

Steps:

- Click **"No device detected"** (or similar) in the toolbar.
- Select the **booted simulator or emulator** you started.
- Studio will open its own device view.

### Configure Environment Variables

Use the **Environment Manager** in Maestro Studio.

1. Create a new Environment if none exists.
2. Add required variables such as:

   MAESTRO_DEEPLINK

3. Ensure the environment is selected and visible in the top-right corner of Studio.

### Run a Test

1. Open the desired test file.
2. Click **Run Locally**.

Steps:

- Select the test file in the sidebar.
- Click **Run Locally** to execute it on the connected device.

### Edit a Test

1. Open the test file in the Studio editor.
2. Make changes directly in the editor.

Notes:

- Changes should be visible using `git diff` in your terminal.
- You may need to press:

       Cmd + S

  to save the file.

- Saving may also trigger formatting and other configured tooling.

---

## Reference Links

[Maestro CLI overview](https://docs.maestro.dev/maestro-cli)

[Maestro CLI commands and options](https://docs.maestro.dev/maestro-cli/maestro-cli-commands-and-options)

[Run E2E tests on EAS Workflows and Maestro](https://docs.expo.dev/eas/workflows/examples/e2e-tests/)
