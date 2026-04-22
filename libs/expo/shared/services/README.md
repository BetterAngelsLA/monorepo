# expo-shared-services

Platform-level service modules shared across Expo/React Native apps. This library is the home for standalone, framework-agnostic utilities that talk to external systems (APIs, cloud storage, device capabilities, etc.) but are **not** React hooks or components.

## What belongs here

- **Cloud / API services** – e.g. S3 uploads, presigned-URL helpers, REST or GraphQL client wrappers that aren't tied to a UI framework.
- **Device services** – camera, file-system, notification, or geolocation helpers that wrap Expo SDK modules behind a clean interface.
- **Auth utilities** – token refresh logic, credential storage, or session management helpers.
- **Background tasks** – upload queues, sync workers, or retry logic.

## What does NOT belong here

| Instead of here…                    | Put it in…                                         |
| ----------------------------------- | -------------------------------------------------- |
| React hooks (`useXxx`)              | `libs/expo/shared/hooks` or a feature-specific lib |
| UI components                       | `libs/expo/shared/ui` or a feature lib             |
| GraphQL documents / generated types | `libs/apollo` or the relevant feature lib          |
| Pure data transforms with no I/O    | `libs/shared` (platform-independent utilities)     |

## Structure

Each service lives in its own folder under `src/lib/` and re-exports through barrel files:

```
src/
  lib/
    s3/
      index.ts
      s3Upload.service.ts
    <your-service>/
      index.ts
      yourService.service.ts
  index.ts          # re-exports lib/
```

## Usage

```ts
import { uploadFileToS3WithPresignedPost } from '@betterangels/expo-shared-services';
```
