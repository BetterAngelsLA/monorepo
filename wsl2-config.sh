
     sudo apt install wslu
     WINDOWS_HOME="$(wslpath "$(wslvar USERPROFILE)")"

     {
         echo "WINDOWS_HOME=\"$WINDOWS_HOME\""
         echo "export ANDROID_HOME=\$WINDOWS_HOME/AppData/Local/Android/Sdk"
         echo "export PATH=\$PATH:\$ANDROID_HOME/emulator"
         echo "export PATH=\$PATH:\$ANDROID_HOME/tools"
         echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
     } >> ~/.bashrc

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
