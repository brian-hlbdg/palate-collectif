# Palate Collectif — Demo Testing Guide

## Setup

### 1. Add Service Role Key

In `.env.local`, replace `your_service_role_key` with your actual key from:
**Supabase Dashboard > Project Settings > API > `service_role` (secret)**

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 2. Run the Seed Script

```bash
node --env-file=.env.local scripts/seed-demo.mjs
```

The script is safe to re-run — it clears old demo data first.

---

## Demo Accounts & Event Codes

| Role | Credential |
|------|------------|
| Admin email | `demo.admin@palatecollectif.com` |
| Admin password | `DemoAdmin2025!` |
| Booth event | URL: `/booth/BOOTH01` |
| Wine Crawl event | Code: `CRAWL01` at `/join` |
| Wine Festival event | Code: `FEST01` at `/join` |

---

## Scenario 1 — Admin

**Goal:** Show how an organizer manages events, wines, and analytics.

### Steps

1. Go to `/admin/login`
2. Sign in with `demo.admin@palatecollectif.com` / `DemoAdmin2025!`
3. **Dashboard** — review stats: total events, active events, wine count, ratings
4. **Events list** — click "Your Events" to see all 3 demo events
5. Open **Chateau Lumiere Showcase** (Booth event)
   - Review event details, event code, active status
   - Click "Manage Wines" to see the 5 curated wines
   - Show the Booth URL that can be shared or displayed as a QR code
6. Open **Old Town Wine Crawl**
   - Show the 3 location stops and 6 wines distributed across them
7. Open **Grand Harvest Festival**
   - Show the 8 international wines in a single-venue lineup
8. Click "Analytics" to preview ratings dashboards
9. Show "Create Event" flow to demonstrate creating a new booth or crawl event

---

## Scenario 2 — Booth

**Goal:** Show the walk-up kiosk experience where guests enter only their email.

### Steps

1. Open a browser tab and go to `/booth/BOOTH01`
2. The branded entry screen appears for **Chateau Lumiere Showcase**
3. Enter any test email (e.g., `tester@example.com`) and tap **Start Tasting**
4. The wine list loads — 5 wines in tasting order
5. Tap wine #1 **Lumiere Rouge Reserve**
   - View sommelier notes, producer, region
   - Rate the wine (1–5 stars)
   - Toggle "Would Buy" if desired
   - Save the rating
6. Return to the wine list and rate 2–3 more wines
   - Notice the progress bar fills as wines are rated
   - Rated wines show a checkmark and star score
7. Tap a wine card to show wine detail, then go back
8. **To demo a second user:** open a private/incognito window, go to `/booth/BOOTH01`, use a different email — ratings are independent per guest

### Key points to highlight
- No account creation or password required — just email
- Ratings are saved instantly and tied to the guest's email
- Works on mobile for tablet/kiosk use

---

## Scenario 3 — Wine Crawl

**Goal:** Show a multi-stop crawl where attendees move between venues.

### Steps

1. Go to `/join`
2. Enter code `CRAWL01` and tap **Continue**
3. Enter a display name (e.g., "Alex") and optional email, then tap **Join Event**
4. The wine list opens for **Old Town Wine Crawl**
   - Wines are grouped by stop: The Barrel Room, Vine & Dine Bistro, The Cellar Door
5. At **Stop 1 — The Barrel Room** rate the 2 red wines
6. At **Stop 2 — Vine & Dine Bistro** rate the 2 white wines
7. At **Stop 3 — The Cellar Door** rate the final 2 wines
8. Tap **Buddies** in the bottom navigation — a slide-up panel appears
9. After all 6 wines are rated, the progress bar hits 100%
10. If the event is marked closed by the admin, a **Results** button appears showing the group leaderboard

### Buddies flow (demo with two devices or two browser windows)

**Person A — sharing their code:**
1. Open the Buddies panel
2. A personal **4-character code** is generated (e.g., `KRTM`) alongside a **QR code**
3. They can tap "Copy code" to share it with a friend

**Person B — connecting:**
1. Open the Buddies panel on a second device/window (joined as a different guest)
2. Tap **Enter Friend's Code**
3. Type Person A's 4-character code and tap **Connect**
4. A success modal confirms the connection: "You're now tasting buddies!"
5. The modal notes that **ratings stay private until the event ends**

**After the event closes** (event date passes or admin closes it):
- A **Results** button appears in the bottom nav
- The results page shows the group leaderboard (top-rated wines across all tasters)
- Each connected buddy shows a **taste match %** — how closely your ratings aligned
- Tap a buddy to see a side-by-side breakdown:
  - Wines you **agreed on** (ratings within 1 point of each other)
  - Wines you **disagreed on** (bigger spread) — great conversation starter

### Key points to highlight
- Codes are event-specific and expire — no cross-event data leakage
- Ratings are completely private during the event; comparison only unlocks after close
- No login required — just a code and a name

---

## Scenario 4 — Wine Festival

**Goal:** Show a single-venue festival with a diverse international lineup.

### Steps

1. Go to `/join`
2. Enter code `FEST01` and tap **Continue**
3. Enter a display name and optional email, then tap **Join Event**
4. The wine list opens for **Grand Harvest Festival** — 8 wines, no location grouping
5. Use the **search bar** to filter by wine name or producer
6. Tap the **filter icon** and filter by wine type (e.g., show only "white" wines)
7. Rate several wines — show the star rating and "Would Buy" toggle on the detail page
8. Return to the list and show rated vs. unrated wines at a glance
9. Tap **Buddies** in the bottom nav to demo the buddy connect flow (same as Wine Crawl above)
10. Tap **Profile** in the bottom nav to review personal ratings summary
11. Tap **For You** (Sparkles icon) to show personalized wine recommendations based on ratings

### Buddies at a festival

The buddy flow works identically to the Wine Crawl. At a festival it's especially useful — attendees split up across a large venue, rate independently, then reconnect later to compare notes. The taste match % and side-by-side breakdown unlock once the event closes.

### Key points to highlight
- Search and type filtering help guests navigate a large lineup
- Personal taste profile builds as more wines are rated
- Buddy comparisons give the event a social, shareable moment after the fact
- "For You" recommendations personalize the experience

---

## Resetting Demo Data

To wipe and re-seed all demo data, simply re-run the seed script:

```bash
node --env-file=.env.local scripts/seed-demo.mjs
```

This removes all existing ratings and event data for the three demo events and creates fresh records.

> Note: Guest profiles created during walkthroughs are not deleted by the seed script. These are temporary accounts (expire in 7–30 days) and can be manually deleted from the Supabase dashboard if needed.
