# Canteen Ordering App — Student Side

The student-facing app for the Amrita Canteen Tokenized Ordering System. Browse the menu, order, pay from a pre-loaded wallet, and skip the queue.

**Live demo:** [YOUR_NETLIFY_URL_HERE](YOUR_NETLIFY_URL_HERE)

## Features

- Browse the daily menu with dish photos, prices, and a "favourites" shortcut
- Add items to a cart that stays in sync even if you switch devices
- Wallet system — pre-load money at the counter, then pay cash-free
- Order history and profile/account management (edit profile, change password, forgot password flow)
- Login/signup backed by Firebase Auth

## Tech stack

- React + TypeScript
- Vite
- Tailwind CSS
- Firebase (Firestore, Auth, Storage)

## Running locally

```bash
npm install
npm run dev
```

You'll need your own Firebase project config in `src/firebaseconfig.js` — this repo's config points to the original project and won't work for a fresh clone.

## Build

```bash
npm run build
```

Deployed on Netlify — `netlify.toml` in this folder has the build settings.
