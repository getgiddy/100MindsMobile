# 100 Minds Mobile

100 Minds Mobile helps users practice real-world interpersonal and professional scenarios through guided role-plays, persona-driven conversations, and actionable feedback. The app is built with Expo and React Native to provide a responsive mobile experience for learning, coaching, and assessment.

## Overview

Practice realistic scenarios (e.g., interviews, clinical encounters, coaching sessions) with configurable personas, prompts, and feedback. Users can create and run scenarios, record or submit responses, review feedback, and track progress over time.

## Key Features

- **Practice Scenarios:** Create, browse, and run scenario-based exercises that mirror real-world interactions.
- **Persona Role‑Play:** Use persona-driven prompts and avatars to make role-plays feel authentic.
- **Feedback & Review:** Collect and view feedback to improve skills iteratively.
- **Progress Tracking:** Monitor completion and improvement across scenarios.
- **Built with Expo:** Cross-platform mobile app using Expo + React Native for fast iteration.

## Getting Started

- **Install dependencies:** `yarn` or `npm install`
- **Run locally:** `npx expo start` (or `yarn start` / `npm run start`)

## Contributing

Contributions, bug reports, and feature requests are welcome — please open an issue or pull request.

## License

See the repository license or contact the maintainers for licensing details.

## Troubleshooting

```bash
# All-in-one script to force complete re-pairing - MacOS/iOS
sudo pkill -9 -f remoted;
sudo pkill -9 -f remotepairingd;
# Remove cached device support
rm -rf ~/Library/Developer/Xcode/iOS\ DeviceSupport/*;
sudo launchctl stop com.apple.usbmuxd;
sudo launchctl start com.apple.usbmuxd;
```

### After Running Commands:

1. Disconnect device (unplug USB)
2. Wait 10 seconds
3. Reconnect device
4. Unlock device - you should see "Trust This Computer?" prompt
5. Tap Trust and enter passcode
6. Check status:

```bash   
xcrun devicectl list devices
```

### On the iOS Device (if needed):
If the Mac-side reset doesn't work, also clear trust on the device:

```txt
Settings → General → Transfer or Reset → Reset → Reset Location & Privacy
OR Settings → Developer → Clear Trusted Computers
```

This combination forces both sides to forget each other and establish a fresh pairing.
