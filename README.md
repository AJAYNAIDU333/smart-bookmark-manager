# 🔖 Smart Bookmark Manager

A secure, real-time bookmark management application built with Next.js and Supabase. Save your favorite links and watch them sync across all your devices instantly without a page refresh.

## 🚀 Live Demo
**URL:** https://smart-bookmark-manager-alpha.vercel.app/

## 🛠 Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database & Auth:** Supabase (PostgreSQL + Google OAuth)
- **Real-time:** Supabase Realtime (WebSockets)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## ✨ Key Features
- **Google OAuth Only:** Secure login without managing passwords.
- **Private Bookmarks:** Row Level Security (RLS) ensures your links are yours alone.
- **Real-time Sync:** Open the app in two tabs; adding/deleting in one updates the other instantly.
- **Optimistic UI:** Lightning-fast interactions with local state updates.

## 🧠 Challenges & Solutions

### 1. The "Invisible" WebSocket Handshake Failure
**Problem:** During development, I encountered a `WebSocket is closed before the connection is established` error in the browser console. The real-time listener was failing to connect to the database.

**Solution:** I discovered that Supabase Realtime requires explicit permission to broadcast data. Even if the code is correct, the WebSocket handshake will fail if **Row Level Security (RLS)** is enabled without a proper `SELECT` policy. I solved this by:
1. Writing a SQL policy to allow `authenticated` users to `SELECT` their own data.
2. Manually adding the `bookmarks` table to the `supabase_realtime` publication.
3. Setting the table's `REPLICA IDENTITY` to `FULL` via SQL to ensure all row data is broadcasted during changes.

### 2. Real-time Consistency Across Tabs
**Problem:** Initially, the app required a page refresh to show changes made in a different browser session.

**Solution:** I implemented a `supabase.channel` listener in a `useEffect` hook. To avoid "stale" data or infinite loops, I combined this with a `useCallback` for fetching data and ensured the channel was filtered using the user's ID (`user_id=eq.${user.id}`). This prevents the client from receiving broadcast events that don't belong to them, saving bandwidth and improving security.

### 3. Data Privacy Enforcement
**Problem:** Requirement #3 demanded that User A cannot see User B's bookmarks.

**Solution:** Instead of relying solely on client-side filtering (which can be bypassed), I enforced privacy at the database layer using **Postgres RLS Policies**. I used the expression `auth.uid() = user_id`, which strictly limits database engine access to the owner of the record, regardless of the API call.
