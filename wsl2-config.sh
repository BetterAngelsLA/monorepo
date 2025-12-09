#!/bin/bash

echo "Configuring WSL2 for Android Development..."

# Get Windows User Profile
# Find the correct C:\Users\Name path even if username differs

WINDOWS_USER_PROFILE=$(cmd.exe /c "echo %USERPROFILE%" 2>/dev/null | tr -d '\r')

# Check for missing profile
if [ -z "$WINDOWS_USER_PROFILE" ]; then
    echo "Error: Could not detect Windows User Profile via cmd.exe."
    echo "       Ensure you are running this in a valid WSL2 environment."
    exit 1
fi

WINDOWS_HOME=$(wslpath "$WINDOWS_USER_PROFILE")

# Define Paths

ANDROID_HOME="$WINDOWS_HOME/AppData/Local/Android/Sdk"
PLATFORM_TOOLS="$ANDROID_HOME/platform-tools"

# Get Hostname
# Look specifically for the eth0 interface to avoid picking up Docker/VPN IPs

WSL_IP=$(ip addr show eth0 2>/dev/null | awk '/inet\b/ {print $2}' | cut -d/ -f1)

if [ -z "$WSL_IP" ]; then
    # Fallback if eth0 isn't found
    WSL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi

# Check for missing IP
if [ -z "$WSL_IP" ]; then
    echo "Error: Could not determine WSL IP address."
    echo "       This is required for the Android Emulator to connect to Metro."
    echo "       Check your network settings or ensure 'ip' command is available."
    exit 1
fi

# Configure .bashrc

declare -a config_lines=(
    "# Android SDK Setup"
    "export WINDOWS_HOME=\"$WINDOWS_HOME\""
    "export ANDROID_HOME=\"$ANDROID_HOME\""
    "export PATH=\"\$PATH:\$ANDROID_HOME/emulator\""
    "export PATH=\"\$PATH:\$ANDROID_HOME/tools\""
    "export PATH=\"\$PATH:\$ANDROID_HOME/platform-tools\""
    "export REACT_NATIVE_PACKAGER_HOSTNAME=\"$WSL_IP\""
)

echo "Updating .bashrc..."

# Add a blank line to separate new content from existing content.
if ! grep -Fxq "${config_lines[0]}" ~/.bashrc; then
    echo "" >> ~/.bashrc
fi

for line in "${config_lines[@]}"; do
    if ! grep -Fxq "$line" ~/.bashrc; then
        echo "$line" >> ~/.bashrc
        echo "Added: $line"
    fi
done

# Create Shims

create_shim() {
    local target_dir=$1
    local exe_path=$2
    local shim_path="$target_dir/adb"

    echo "Creating shim at $shim_path..."

    if [ "$target_dir" == "$PLATFORM_TOOLS" ]; then
        # Shim 1: Windows Side (Required for Expo/Nx to find ADB)
        cat <<EOF > "$shim_path"
#!/bin/bash
exec "\$(dirname "\$0")/adb.exe" "\$@"
EOF
    else
        # Shim 2: Linux Side (Required for CLI convenience)
        echo '#!/bin/bash' | sudo tee "$shim_path" > /dev/null
        echo "exec \"$exe_path\" \"\$@\"" | sudo tee -a "$shim_path" > /dev/null
    fi

    # Make executable
    if [ -w "$shim_path" ]; then
        chmod +x "$shim_path"
    else
        sudo chmod +x "$shim_path"
    fi
}

# Apply Shim 1 (Windows)
if [ -d "$PLATFORM_TOOLS" ]; then
    create_shim "$PLATFORM_TOOLS" "adb.exe"
    echo "NOTE: If you update Android Studio SDK Tools, this specific shim will be deleted."
    echo "      Simply re-run this script to restore it."
else
    echo "Error: Platform-tools directory not found at $PLATFORM_TOOLS"
fi

# Apply Shim 2 (Linux)
if [ -f "$PLATFORM_TOOLS/adb.exe" ]; then
    create_shim "/usr/local/bin" "$PLATFORM_TOOLS/adb.exe"
fi

echo "Configuration complete."
echo "1. Run 'source ~/.bashrc' to refresh variables."
echo "2. Run 'adb --version' to verify."
