#!/bin/bash
set -e
echo "Proton outreach worker — local daemon installer (launchd example for macOS)"
echo "Edit the plist if paths differ. Then: launchctl load ~/Library/LaunchAgents/com.erosolar.outreach.plist"

PLIST="$HOME/Library/LaunchAgents/com.erosolar.outreach.plist"
cat > "$PLIST" <<'PL'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.erosolar.outreach</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/node</string>
    <string>WORKER_ABS_PATH/worker.mjs</string>
  </array>
  <key>WorkingDirectory</key><string>WORKER_ABS_PATH</string>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>WORKER_ABS_PATH/logs/out.log</string>
  <key>StandardErrorPath</key><string>WORKER_ABS_PATH/logs/err.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
PL

echo "Edit $PLIST and replace WORKER_ABS_PATH with $(pwd)"
echo "mkdir -p logs; npm i"
echo "Then launchctl bootout gui/$(id -u)/com.erosolar.outreach 2>/dev/null || true"
echo "launchctl load $PLIST"
