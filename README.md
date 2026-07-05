# Amrita Canteen Tokenized Ordering System

A digital ordering platform built for the college canteen — students order and pay from their phone, get a token instead of standing in line, and canteen staff get a live dashboard to manage the menu, orders, and daily sales.

**Live demo (user app):** [YOUR_NETLIFY_URL_HERE](YOUR_NETLIFY_URL_HERE)

## Why this exists

Busy canteen hours meant long queues, cash-handling delays, and no easy way for staff to see what was selling or track inventory. This project splits the problem into two apps that share the same Firebase backend: one for students to order, one for canteen staff to run the counter.

## Repo structure

```
canteen-ordering-system/
├── user-app/     — student-facing ordering app (this is what's deployed on Netlify)
└── owner-app/    — canteen staff / admin dashboard
```

Each folder is a full standalone Vite app — see the README inside each for setup instructions.

## Tech stack

- **Frontend:** React + TypeScript, Vite, Tailwind CSS
- **Backend / Data:** Firebase (Firestore, Auth, Storage)
- **Hosting:** Netlify (user app)

## Features

**Student app**
- Browse the daily menu with photos, prices, and a favourites list
- Add to cart and check out digitally — cart syncs across devices
- Wallet-based payment (pre-load balance at the counter, spend cash-free)
- Order history and profile management

**Owner / staff dashboard**
- Add and manage menu items, with scheduling for availability
- Live orders tab to track and fulfil incoming orders
- Analytics tab for sales trends and popular items
- Wallet management for student balances

## Status

Built as a course project — the student-facing app is deployed and usable; the owner dashboard runs locally / can be deployed the same way via Netlify or Vercel.
