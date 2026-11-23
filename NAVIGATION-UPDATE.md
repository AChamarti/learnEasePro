# LearnEase Pro – Navigation Update

This update adds a consistent page-navigation bar below the main header throughout the application.

## What changed
- Added a Back control on every page. It uses browser history when there is an in-app previous page and otherwise returns signed-in users to Dashboard (or signed-out users to Home).
- Added persistent Home and, for signed-in users, Dashboard links.
- Added a page label so users can see where they are.
- Kept the existing header navigation and role-based Admin link.
- Retained the YouTube-compatible lesson player from the previous YouTube playback fix.

## Apply
Replace the matching `client/src/components/Layout.jsx` and `client/src/styles.css` files in your project. The ZIP also includes the complete project tree for convenience. Keep your own `.env` files and do not commit secrets.

## Run
From `client`:

```bash
npm install
npm run dev
```

A production build was not run in this environment because dependencies were not installed here.
