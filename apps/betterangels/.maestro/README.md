# Better Angels End-to-End Tests

This directory contains the **Maestro E2E test suite** for the Better Angels mobile app.

Maestro is a cross-platform mobile UI testing framework that works with both **iOS simulators** and **Android emulators**.

---

## Table of Contents

- [Quick Start](#quick-start)
- [About Local Usage](#about-local-usage)
- [Local Setup](#local-setup)
- [Running Tests Locally (CLI)](#running-tests-locally-cli)
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

    yarn e2e:dev

Run a single test:

    yarn e2e:dev landing.yml

---

## About Local Usage

There are two main ways to work with Maestro E2E tests locally, primarily via:

- `Maestro CLI`
  - requires local setup
  - more flexible than Maestro Studio
- `Maestro Studio`
  - should not require any local setup
  - more limited than using the CLI, but adequate (and has some nice UI features)

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

## Running Tests Locally (CLI)

### 1. Start the development server

Start the Better Angels Expo dev server:

```bash
yarn ba
```

(or any command that starts the app locally)

---

### 2. Start a simulator or emulator

Start at least one device:

- **iOS:** Xcode Simulator
- **Android:** Android Emulator

Maestro will automatically select a running device for the chosen platform.

**_Note:_**
Maestro tests run against the **Expo development client** build of the Better Angels app.
Ensure that a dev build is installed in the simulator or emulator (e.g. "BetterAngels (Dev)") before running the tests.

---

### 3. Run tests

Run the full test suite:

```bash
yarn e2e:dev
```

_**Note:** defaults to iOS_

This command runs the wrapper script:

`apps/betterangels/.maestro/scripts/maestro-e2e.sh`

The script:

- reads `.maestro/.env.local`
- converts variables into `-e KEY=value`
- runs the Maestro CLI

**Examples:**

- Run all tests on **iOS** (default)

```bash
yarn e2e:dev
```

- Specify a platform (ios/android)

```bash
yarn e2e:dev -p android
```

- Run a single test file

```bash
yarn e2e:dev landing.yml
```

_**Note:** the `.yml` extension is optional, and paths are relative to the `.maestro/tests/` directory._

- Run with verbose output

```bash
yarn e2e:dev --verbose
```

```bash
yarn e2e:dev --verbose -p android landing.yml
```

---

## Environment Variables

Maestro supports environment variables for configuring the test runtime.

### CLI

The Maestro CLI expects environment variables to already exist in the shell when the `maestro` command runs. It does **not automatically load `.env` files**. The CLI also supports a number of predefined configuration variables documented here:

[CLI Environment variables docs](https://docs.maestro.dev/maestro-cli/environment-variables)

To simplify local usage, this project uses a wrapper script that reads variables from `.maestro/.env.local`.

Create this file by copying the sample:

```bash
cp .env.local.sample .env.local
```

**Example:**

```bash
MAESTRO_DEEPLINK=exp+betterangels://expo-development-client/?url=http://192.168.1.198:8081
```

This deep link tells the Expo development client which local Metro server to connect to.

You can find this value in the Expo CLI output when running the app.

---

## Running Maestro Directly (Optional)

If you prefer to run the Maestro CLI directly instead of using the wrapper script, you can pass environment variables manually using `-e`.

You must also specify the platform using `-p` or `--platform`.

**Example:**

```bash
maestro --verbose -p android test apps/betterangels/.maestro/tests \
  -e MAESTRO_DEEPLINK="exp+betterangels://expo-development-client/?url=http://192.168.1.198:8081" \
  -e SOME_OTHER_VAR=value
```

---

## Directory Structure

```
.maestro/
  tests/
    landing.yml

  steps/
    (reusable steps)

  scripts/
    maestro-e2e.sh

  .env.local
  .env.local.sample
```

### `tests/`

Entry points for E2E tests.

Each file represents a test flow.

**Example:**

```
tests/landing.yml
```

### `steps/`

Reusable steps used by tests.

**Example:**

```
steps/login.yml
steps/open_app.yml
```

---

## Running Tests in CI

TBD

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
