# Better Angels End-to-End Tests

This directory contains the **Maestro E2E test suite** for the Better Angels mobile app.

Maestro is a cross-platform mobile UI testing framework that works with both **iOS simulators** and **Android emulators**.

[Maestro CLI overview](https://docs.maestro.dev/maestro-cli)

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

## Running Tests Locally

### 1. Start the development server

Start the Better Angels Expo dev server:

```bash
yarn ba
```

(or any command to run the app locally)

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

```
apps/betterangels/.maestro/scripts/maestro-e2e.sh
```

The script:

- reads `.env.local`
- converts variables into `-e KEY=value`
- runs the Maestro CLI

---

## Running on a specific platform

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

Maestro does **not** read `.env` files automatically.

The wrapper script loads variables from:

```
.maestro/.env.local
```

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

## Directory Structure

```
.maestro/
  tests/
    landing.yml

  flows/
    (reusable flows)

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

### `flows/`

Reusable helper flows used by tests.

**Example:**

```
flows/login.yml
flows/open_app.yml
```

---

## Running Tests in CI

TBD

---

## Writing Tests

TBD

---

## Reference Links

[Maestro Environment variables](https://docs.maestro.dev/maestro-cli/environment-variables)

[Maestro CLI commands and options](https://docs.maestro.dev/maestro-cli/maestro-cli-commands-and-options)

[Run E2E tests on EAS Workflows and Maestro](https://docs.expo.dev/eas/workflows/examples/e2e-tests/)
