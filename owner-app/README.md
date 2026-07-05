# Canteen Ordering App — Owner / Staff Dashboard

The admin side of the Amrita Canteen Tokenized Ordering System. Built for canteen staff to manage the menu, track incoming orders, and see basic sales analytics — all backed by the same Firebase project as the student app.

## Features

- Add and edit menu items (with images) through a simple modal
- Schedule menu item availability (e.g. mark something available only for lunch)
- Live orders tab to see and fulfil incoming orders
- Analytics tab for sales trends and popular dishes
- Wallet tab to view/manage student balances
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

You'll need your own Firebase project config in `src/firebaseconfig.ts` — this repo's config points to the original project and won't work for a fresh clone.

## Build

```bash
npm run build
```
