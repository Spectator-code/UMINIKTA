# Local Deployment & Development Guide

Comprehensive guide for setting up, configuring, and running the **UMINIKTA** academic portal locally on your development machine.

---

## 1. Prerequisites

Ensure you have the following installed on your system:

- **Node.js**: `v18+` or `v20+` (LTS recommended)
- **npm** (comes bundled with Node.js) or **yarn** / **pnpm**
- *(Optional for Mobile Testing)*: **Expo Go** app installed on your physical mobile device (available on Google Play Store and Apple iOS App Store).

---

## 2. Configure Environment Variables (`.env`)

UMINIKTA connects to Supabase for authentication, security policies, and database queries. Create a file named `.env` in the root of the project:

```bash 
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```


> [!NOTE]
> In Expo SDK 57, environment variables prefixed with `EXPO_PUBLIC_` are automatically bundled and securely accessible on both Web and Native platforms via `process.env`.

---

## 3. Install Dependencies

Open PowerShell, Command Prompt, or your IDE terminal in the project folder and run:

```bash
npm install
```

---

## 4. Running Locally in Development Mode

You have multiple options depending on how you want to test and develop the application:

### Option A: Run Directly in the Web Browser (Fastest)

```bash
npm run web
# or
npx expo start --web
```

This launches the Metro bundler for Web and automatically opens [http://localhost:8081](http://localhost:8081) in your default browser.

### Option B: Universal Expo Development Server (Web + Mobile)

```bash
npm start
# or
npx expo start
```

Once the interactive Metro terminal menu loads with the QR code:

- Press **`w`** in the terminal to launch the Web version in your browser.
- Press **`a`** to launch in an Android Emulator (or scan the terminal QR code with the Expo Go app on an Android device).
- Press **`i`** to launch in the iOS Simulator (macOS).
- Press **`r`** to reload the application.
- Press **`c`** to clear the Metro cache if you encounter any bundle issues.

> [!TIP]
> If testing on a physical mobile device with Expo Go, ensure both your computer and phone are connected to the same Wi-Fi network. If on separate networks or behind a university firewall, start Metro with tunnel mode:
>
> ```bash
> npx expo start --tunnel
> ```

---

## 5. Local Production Deployment (Simulating Production Web Build)

To build and test the exact production bundle as configured in `vercel.json`:

```bash
# 1. Export static production web assets to the dist/ directory:
npx expo export --platform web

# 2. Serve the generated dist folder locally:
npx serve dist -s -p 3000
# or
npx http-server dist -p 3000
```

Then visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Quick Troubleshooting

| Issue | Resolution |
| :--- | :--- |
| **`npx: command not found`** | Ensure Node.js is installed and added to your Windows system `PATH` environment variable. Restart your terminal session after updating PATH. |
| **Stale bundle or cache errors** | Run `npx expo start -c` to clear the Metro bundler cache. |
| **Supabase Auth errors on startup** | Verify that `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env` are valid and correspond to an active Supabase project. |
| **Port 8081 already in use** | Run `npx expo start --port 8082` or close any existing node/metro processes using task manager. |
