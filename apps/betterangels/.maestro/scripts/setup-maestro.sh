#!/usr/bin/env bash

# -----------------------------
# setup-maestro.sh
# -----------------------------
#
# Auto-detects and exports:
#   MAESTRO_DEEPLINK  — deep link URL for Expo dev client
#   MAESTRO_DEVICE    — device ID for Maestro --device flag
#
# Usage:
#   source .maestro/scripts/setup-maestro.sh <platform>
#   maestro --device $MAESTRO_DEVICE -p <platform> test .maestro/tests
#
# Or used via the nx e2e target which sources this automatically.
#
# Arguments:
#   $1  — platform: "ios" or "android" (required)
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

PLATFORM="${1:?Usage: source resolve-deeplink.sh <ios|android>}"
EXPO_PORT="${MAESTRO_EXPO_PORT:-8081}"
EXPO_SCHEME="exp+betterangels"

# -----------------------------
# Resolve device
# -----------------------------
#
# Detect the first booted simulator (iOS) or connected emulator (Android)
# so Maestro targets the correct device.
#
if [[ -z "${MAESTRO_DEVICE:-}" ]]; then
  if [[ "$PLATFORM" == "ios" ]]; then
    MAESTRO_DEVICE=$(xcrun simctl list devices booted -j 2>/dev/null \
      | grep '"udid"' | head -1 | awk -F'"' '{print $4}') || true
    if [[ -z "$MAESTRO_DEVICE" ]]; then
      echo "🛑 No booted iOS simulator found. Start one first."
      return 1 2>/dev/null || exit 1
    fi
  elif [[ "$PLATFORM" == "android" ]]; then
    MAESTRO_DEVICE=$(adb devices 2>/dev/null | awk 'NR==2 && $2=="device" {print $1}') || true
    if [[ -z "$MAESTRO_DEVICE" ]]; then
      echo "🛑 No connected Android device/emulator found. Start one first."
      return 1 2>/dev/null || exit 1
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
    #
    # 1. macOS: find the default route interface, then get its IPv4 address
    # 2. Linux: ip route or hostname -I
    # 3. Fallback: localhost
    #
    if DEFAULT_IF=$(route -n get default 2>/dev/null | awk '/interface:/ {print $2}'); then
      # macOS: get the IP of the default-route interface (works for Wi-Fi, Ethernet, etc.)
      HOST=$(ipconfig getifaddr "$DEFAULT_IF" 2>/dev/null) || HOST="localhost"
    elif HOST=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}'); then
      : # Linux: got IP from ip route
    elif HOST=$(hostname -I 2>/dev/null | awk '{print $1}'); then
      : # Linux fallback
    else
      HOST="localhost"
    fi
  fi

  MAESTRO_DEEPLINK="${EXPO_SCHEME}://expo-development-client/?url=http://${HOST}:${EXPO_PORT}&disableOnboarding=1"
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
