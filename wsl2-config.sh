
     sudo apt install wslu
     if ! sudo apt install wslu; then
        echo "Failed to install wslu. This is required for Windows path conversion."
        exit 1
     fi
     WINDOWS_HOME="$(wslpath "$(wslvar USERPROFILE)")"

     {
         echo "WINDOWS_HOME=\"$WINDOWS_HOME\""
         echo "export ANDROID_HOME=\$WINDOWS_HOME/AppData/Local/Android/Sdk"
         echo "export PATH=\$PATH:\$ANDROID_HOME/emulator"
         echo "export PATH=\$PATH:\$ANDROID_HOME/tools"
         echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
     } >> ~/.bashrc

          # Function to check if a line exists in ~/.bashrc
     line_exists() {
         grep -Fxq "$1" ~/.bashrc
     }
     # Add each line only if it doesn't exist
     if ! line_exists "WINDOWS_HOME=\"$WINDOWS_HOME\""; then
         echo "WINDOWS_HOME=\"$WINDOWS_HOME\"" >> ~/.bashrc
     fi
     if ! line_exists "export ANDROID_HOME=\$WINDOWS_HOME/AppData/Local/Android/Sdk"; then
         echo "export ANDROID_HOME=\$WINDOWS_HOME/AppData/Local/Android/Sdk" >> ~/.bashrc
     fi
     if ! line_exists "export PATH=\$PATH:\$ANDROID_HOME/emulator"; then
         echo "export PATH=\$PATH:\$ANDROID_HOME/emulator" >> ~/.bashrc
     fi
     if ! line_exists "export PATH=\$PATH:\$ANDROID_HOME/tools"; then
         echo "export PATH=\$PATH:\$ANDROID_HOME/tools" >> ~/.bashrc
     fi
     if ! line_exists "export PATH=\$PATH:\$ANDROID_HOME/platform-tools"; then
         echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> ~/.bashrc
     fi

    # List of executable paths
    declare -a exe_paths=(
        "$WINDOWS_HOME/AppData/Local/Android/Sdk/platform-tools/adb.exe"
        # Add more .exe paths here
    )

    # Loop through each path, strip the '.exe', and create a symlink in the same directory
    for path in "${exe_paths[@]}"; do
        if [ -f "$path" ]; then
            directory=$(dirname "$path")  # Get the directory of the .exe file
            exe_name=$(basename "$path" .exe)  # Strip the '.exe' and get base name
            sudo ln -sf "$path" "$directory/$exe_name"  # Create symlink in the same directory
            sudo ln -sf "$path" /usr/local/bin/$exe_name
        else
            echo "$path not found at expected location."
        fi
    done
