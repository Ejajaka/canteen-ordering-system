# Amrita Canteen Tokenized Ordering System

A digital ordering platform for the college canteen. Students order and pay from their phone and collect a token instead of standing in line, while canteen staff get a dashboard to manage the menu, orders, and daily sales.

**Live demo (student app):** https://marvelous-pie-031cc1.netlify.app/

## Why two apps

Peak canteen hours meant long queues, cash handling, and no easy way for staff to see what was selling or to track inventory. The project splits the problem into two applications that share one Firebase backend: one for students to order, one for staff to run the counter.

## Repository structure

```
canteen-ordering-system/
├── user-app/     student-facing ordering app (the one deployed on Netlify)
└── owner-app/    canteen staff / admin dashboard
```

Each folder is a standalone Vite app. See the README inside each for its own setup notes.

## Tech stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend and data: Firebase (Firestore, Auth, Storage)
- Hosting: Netlify (student app)

## Features

Student app:

- Browse the daily menu with photos, prices, and a favourites list
- Add to cart and check out digitally; the cart syncs across devices
- Wallet-based payment, with balance loaded at the counter
- Order history and profile management

Owner / staff dashboard:

- Add and manage menu items, with scheduling for availability
- Live orders tab to track and fulfil incoming orders
- Analytics tab for sales trends and popular items
- Wallet management for student balances

## Running locally

Each app is independent:

```bash
cd user-app
npm install
npm run dev      # http://localhost:5000

cd ../owner-app
npm install
npm run dev
```

Firebase configuration lives in `src/firebaseconfig.*` in each app. Add your own project settings there before running against a real backend.

## Status

Built as a course project. The student-facing app is deployed and usable; the owner dashboard runs locally and can be deployed the same way through Netlify or Vercel.
