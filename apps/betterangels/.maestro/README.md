# ISSUES - running from terminal

- loading .env

  - can load via script grep etc...
  - running command directly will break (as does maestro needs env vars via kv flags)

- this works from terminal
  maestro test apps/betterangels/.maestro/landing.yml \
   -e EXPO_APP_DEEPLINK="exp+betterangels://expo-development-client/?url=http://localhost:8081" \
   -e MAESTRO_PLATFORM=ios

- package.json scripts:

  - works:
    - "e2e:dev": "maestro test apps/betterangels/.maestro $(grep -v '^#' apps/betterangels/.maestro/.env.local | xargs -I {} echo -e {})",
    - "e2e:dev": "maestro test $(grep -v '^#' apps/betterangels/.maestro/.env.local | sed 's/^/-e /')"
  - works:

    - "e2e:dev": "bash -c 'maestro test apps/betterangels/.maestro/${1:-} $(grep -v \"^#\" apps/betterangels/.maestro/.env.- local | sed \"s/^/-e /\")' --",
    - "e2e:dev:file": "yarn e2e:dev"

  - "e2e:dev": "bash -c 'ENV_ARGS=$(grep -v \"^#\" apps/betterangels/.maestro/.env.local | sed \"s/^/-e /\"); if [[ \"$1\" == -* || -z \"$1\" ]]; then maestro test apps/betterangels/.maestro $ENV_ARGS \"$@\"; else maestro test apps/betterangels/.maestro/$1 $ENV_ARGS \"${@:2}\"; fi' --"

- Run Maestro only from the host machine

## REFERENCE DOCS (temp)

# Maestro cli commands and options

https://docs.maestro.dev/maestro-cli/maestro-cli-commands-and-options

# Maestro cli env vars

https://docs.maestro.dev/maestro-cli/environment-variables

# Expo docs

Run Maestro tests locally (optional)
https://docs.expo.dev/eas/workflows/examples/e2e-tests/

# Maestro docs

QuickStart
https://docs.maestro.dev/get-started/quickstart

Maestro CLI overview
https://docs.maestro.dev/maestro-cli

# 3 Test Splitting Techniques that Cut E2E Times up to 90%

https://nx.dev/blog/test-splitting-techniques

# NX doc links

E2E Testing
https://nx.dev/docs/technologies/test-tools/playwright/introduction#e2e-testing

Testing Applications
https://nx.dev/docs/technologies/test-tools/playwright/introduction#e2e-testing

Fast CI
https://nx.dev/docs/guides/adopting-nx/adding-to-monorepo#fast-ci

## MY STEPS - Install Maestro CLI

https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli

- Prerequisites:

  - Java runtime
    - older macs included it, but new ones no longer do.
    - can install via `brew install openjdk@17` (v17 recommended, but newer LTS versions should work)
  - follow Brew instructions after, expecially `sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk`
    - then confirm in terminal via `java -version`
    - Ensure that the JAVA_HOME environment variable points to your Java 17+ installation. May need to add this to your .zshrc, and then confirm via `echo $JAVA_HOME` in terminal
      - export JAVA_HOME=$(/usr/libexec/java_home -v 17)
      - export PATH="$JAVA_HOME/bin:$PATH"

- Install maestro
  - via homebrew (curl also available - see cli docs)
    - brew tap mobile-dev-inc/tap
    - brew install mobile-dev-inc/tap/maestro

## MY STEPS - Run test

1. open simulator

- manually or via `open -a Simulator`

2. make sure app is loaded

- same as in local/dev env

3. start metro server

4. run test (file or suite)

   - can set params:
     MAESTRO_PLATFORM=ios \
     MAESTRO_PROJECT_ID=XXXX \
     MAESTRO_GROUP_ID=XXXX \
     maestro test apps/betterangels/.maestro/landing.yml

   - run file
     maestro test apps/betterangels/.maestro/landing.yml platform

betterangels/monorepo [e2e-local-setup]$ maestro devices
Anonymous analytics enabled. To opt out, set MAESTRO_CLI_NO_ANALYTICS environment variable to any value before running Maestro.

Unmatched argument at index 0: 'devices'
Did you mean: start-device or test or download-samples?
╭─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
│ │
│ Try out our new Analyze with Ai feature. │
│ │
│ See what's new: │
│ > https://maestro.mobile.dev/cli/test-suites-and-reports#analyze │
│ Analyze command: │
│ $ maestro test flow-file.yaml --analyze | bash │
│ │
│ To disable this notification, set MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED environment variable to "true" before running Maestro. │
│ │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯

betterangels/monorepo [e2e-local-setup]$ maestro start-device
Missing required option: '--platform=<platform>'
Usage: maestro start-device [-h] [--force-create] [--device-locale=<deviceLocale>] [--os-version=<osVersion>] --platform=<platform>
Starts or creates an iOS Simulator or Android Emulator similar to the ones on the cloud
Supported device types: iPhone11 (iOS), Pixel 6 (Android)
--device-locale=<deviceLocale>
a combination of lowercase ISO-639-1 code and uppercase ISO-3166-1 code i.e. "de_DE" for Germany
--force-create Will override existing device if it already exists
-h, --help Display help message
--os-version=<osVersion>
OS version to use:
iOS: 16, 17, 18
Android: 28, 29, 30, 31, 33
--platform=<platform>
Platforms: android, ios

maestro test apps/betterangels/.maestro/landing.yml --platform=ios

betterangels-dev://expo-development-client/?url=https://u.expo.dev/undefined/group/undefined?platform=undefined%26disableOnboarding%3D1

# ORDER

1. yarn e2e:dev -p android --verbose landing
   bad: Unmatched argument at index 3: 'landing'

2. yarn e2e:dev --verbose -p android landing
3. yarn e2e:dev --verbose --platform android landing
   ok

4. yarn e2e:dev --platform android --verbose landing
   Unmatched argument at index 3: 'landing'

# this also works

maestro test apps/betterangels/.maestro \
 -e MAESTRO_PLATFORM=ios \
 -e EXPO_APP_DEEPLINK="exp+betterangels://expo-development-client/?url=http://localhost:8081"
