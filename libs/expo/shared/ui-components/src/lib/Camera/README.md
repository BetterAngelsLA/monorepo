# Camera — implementation notes

`CameraView` is a standalone camera surface: it renders the live preview (or
the iOS Simulator placeholder) plus the capture UI, and it owns none of its
presentation. It can be shown however the caller wants — directly in a screen
or in a `Modal` or via some other method.

`CameraSheet` (which renders `CameraView` itself) adds the bottom-sheet presentation.

## iOS Simulator implementation

The iOS Simulator has no actual camera. Mounting the real `ExpoCamera` still creates
an `AVCaptureSession` that can never start (AVFoundation `err -12782`) and
blocks its session queue for ~9s per mount — piling up across open/close cycles
and freezing the flow. This can freeze the UI unnecessarily, which can lead to
confusing the expo Simulator implementation with real code issues.

## Evidence

### expo-camera docs — preview is device-only

> "A React component that renders a preview of the device's front or back
> camera. **Android (device only), iOS (device only)**, Web, Included in Expo Go"
>
> — https://docs.expo.dev/versions/latest/sdk/camera/

expo-camera renders a _preview_ of the camera — it is not the camera itself.
And that preview is only supported on physical devices; there is no simulator
preview path.

### expo-camera native module — simulator capture is a fallback

In
[`CameraViewModule.swift`](https://github.com/expo/expo/blob/main/packages/expo-camera/ios/CameraViewModule.swift),
`takePicture` gates a simulator fallback behind `#if targetEnvironment(simulator)`:
when no video device exists in the simulator it generates a fake photo
(`takePictureForSimulator`) instead of running the real capture pipeline.

```swift
AsyncFunction("takePicture") { (view, options: TakePictureOptions, promise: Promise) in
  #if targetEnvironment(simulator)
  if AVCaptureDevice.default(for: .video) == nil {
    try takePictureForSimulator(self.appContext, view, options, promise)
    return
  }
  #endif
  Task {
    do {
      let result = try await view.takePicturePromise(options: options)
      promise.resolve(result)
    } catch {
      promise.reject(error)
    }
  }
}
```

There is a simulator fallback for _capture_ but none for the _preview_.

### expo-device `isDevice` — how the simulator is detected

`Constants.isDevice` (from `expo-constants`) is backed on iOS by expo-device's
`isDevice()`, which is simply:

```swift
func isDevice() -> Bool {
  #if targetEnvironment(simulator)
  return false
  #else
  return true
  #endif
}
```

— https://github.com/expo/expo/blob/da586c407bd53c4369a994e6ed5d6cf3340420f5/packages/expo-device/ios/DeviceModule.swift#L105

On Android the same constant is `!isRunningOnEmulator`:

```kotlin
Constant("isDevice") {
  !isRunningOnEmulator
}
```

— https://github.com/expo/expo/blob/da586c407bd53c4369a994e6ed5d6cf3340420f5/packages/expo-device/android/src/main/java/expo/modules/device/DeviceModule.kt

That is why our check must be **iOS-only**: the Android emulator has a virtual
camera, so the real preview keeps working there.

## What we do

- `isSimulator.ts` — `isSimulator = Platform.OS === 'ios' && !Constants.isDevice`
  (iOS Simulator only; the Android emulator is deliberately excluded).
- `CameraView.tsx` — renders a black placeholder (not `ExpoCamera`) when
  `isSimulator` is true.
- `useCapturePicture.ts` — fabricates a 1x1 sample JPEG as the captured photo
  when `isSimulator` is true, instead of calling `takePictureAsync`.

The real camera path is untouched on physical devices and the Android emulator.
