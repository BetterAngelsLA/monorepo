#!/usr/bin/env bash

# -----------------------------
# setup-maestro.sh
# -----------------------------
#
# Auto-detects MAESTRO_DEVICE and MAESTRO_DEEPLINK, then runs Maestro.
#
# Usage (via nx):
#   yarn ba:e2e                              # all tests, iOS
#   yarn ba:e2e:android                      # all tests, Android
#   yarn ba:e2e -- landing                   # single test by name
#   yarn ba:e2e --args="--verbose"           # all tests, verbose
#   yarn ba:e2e --args="--verbose landing"   # single test, verbose
#
# Usage (standalone):
#   MAESTRO_PLATFORM=ios .maestro/scripts/setup-maestro.sh
#   MAESTRO_PLATFORM=ios .maestro/scripts/setup-maestro.sh landing
#   MAESTRO_PLATFORM=ios .maestro/scripts/setup-maestro.sh --verbose landing
#
# Environment:
#   MAESTRO_PLATFORM  — "ios" or "android" (required, set by nx env option)
#
# Host resolution order:
#   1. MAESTRO_DEEPLINK env var     →  use as-is (highest priority)
#   2. MAESTRO_EXPO_HOST env var    →  build deep link with this host
#   3. Auto-detect LAN IP           →  same approach Expo uses
#
# Device resolution:
#   1. MAESTRO_DEVICE env var       →  use as-is (explicit override)
#   2. iOS: first booted simulator  →  via xcrun simctl
#   3. Android: first adb device    →  via adb devices
#
# Nx loads .env files (e.g. apps/betterangels/.env.local) into the
# shell env before running targets, so MAESTRO_DEEPLINK / MAESTRO_EXPO_HOST
# can be set there without any manual file parsing.
#

set -euo pipefail

# Resolve paths relative to the .maestro root (one level above this script)
MAESTRO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TESTS_DIR="$MAESTRO_ROOT/tests"

PLATFORM="${MAESTRO_PLATFORM:?Set MAESTRO_PLATFORM=ios or MAESTRO_PLATFORM=android}"
EXPO_PORT="${MAESTRO_EXPO_PORT:-8081}"

# Ensure Maestro CLI is available
if ! command -v maestro >/dev/null 2>&1; then
  echo "🛑 Maestro CLI not found. Install: brew install mobile-dev-inc/tap/maestro"
  exit 1
fi

# -----------------------------
# Parse arguments
# -----------------------------
#
# Separate flags (--verbose, etc.) from the optional test name.
# Short names like "landing" are resolved to .maestro/tests/landing.yml.
#
MAESTRO_FLAGS=()
TEST_FILE=""

for arg in "$@"; do
  if [[ "$arg" == -* ]]; then
    MAESTRO_FLAGS+=("$arg")
  else
    TEST_FILE="$arg"
  fi
done

# Resolve test path
if [[ -n "$TEST_FILE" ]]; then
  [[ "$TEST_FILE" != *.yml ]] && TEST_FILE="${TEST_FILE}.yml"
  TEST_PATH="${TESTS_DIR}/${TEST_FILE}"
else
  TEST_PATH="$TESTS_DIR"
fi

# -----------------------------
# Resolve device
# -----------------------------
if [[ -z "${MAESTRO_DEVICE:-}" ]]; then
  if [[ "$PLATFORM" == "ios" ]]; then
    MAESTRO_DEVICE=$(xcrun simctl list devices booted -j 2>/dev/null \
      | grep '"udid"' | head -1 | awk -F'"' '{print $4}') || true
    if [[ -z "$MAESTRO_DEVICE" ]]; then
      echo "🛑 No booted iOS simulator found. Start one first."
      exit 1
    fi
  elif [[ "$PLATFORM" == "android" ]]; then
    MAESTRO_DEVICE=$(adb devices 2>/dev/null | awk 'NR==2 && $2=="device" {print $1}') || true
    if [[ -z "$MAESTRO_DEVICE" ]]; then
      echo "🛑 No connected Android device/emulator found. Start one first."
      exit 1
    fi
  fi
  echo "📱 Auto-detected MAESTRO_DEVICE: $MAESTRO_DEVICE"
fi

export MAESTRO_DEVICE

# -----------------------------
# Resolve deep link
# -----------------------------
if [[ -z "${MAESTRO_DEEPLINK:-}" ]]; then
  if [[ -n "${MAESTRO_EXPO_HOST:-}" ]]; then
    HOST="$MAESTRO_EXPO_HOST"
  else
    # Auto-detect LAN IP — same approach Expo uses for the dev server URL.
    if DEFAULT_IF=$(route -n get default 2>/dev/null | awk '/interface:/ {print $2}'); then
      HOST=$(ipconfig getifaddr "$DEFAULT_IF" 2>/dev/null) || HOST="localhost"
    elif HOST=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}'); then
      true
    elif HOST=$(hostname -I 2>/dev/null | awk '{print $1}'); then
      true
    else
      HOST="localhost"
    fi
  fi

  MAESTRO_DEEPLINK="exp+betterangels://expo-development-client/?url=http://${HOST}:${EXPO_PORT}&disableOnboarding=1"
  echo "🔗 Auto-detected MAESTRO_DEEPLINK: $MAESTRO_DEEPLINK"
fi

# Ensure disableOnboarding=1 is present (suppresses Expo dev launcher screen)
if [[ "$MAESTRO_DEEPLINK" != *"disableOnboarding"* ]]; then
  if [[ "$MAESTRO_DEEPLINK" == *"?"* ]]; then
    MAESTRO_DEEPLINK="${MAESTRO_DEEPLINK}&disableOnboarding=1"
  else
    MAESTRO_DEEPLINK="${MAESTRO_DEEPLINK}?disableOnboarding=1"
  fi
fi

export MAESTRO_DEEPLINK

# -----------------------------
# Build and run Maestro command
# -----------------------------
CMD=(maestro --device "$MAESTRO_DEVICE")
[[ ${#MAESTRO_FLAGS[@]} -gt 0 ]] && CMD+=("${MAESTRO_FLAGS[@]}")
CMD+=(test "$TEST_PATH")

printf "🚀 %s\n\n" "${CMD[*]}"
exec "${CMD[@]}"
