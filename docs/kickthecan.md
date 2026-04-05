# Kick the Can — Deferred Work

Things that are known, understood, and intentionally deferred. Not forgotten — just not now.

---

## Payment / Subscription

**What:** Palate Personal subscription ($X/month) for active features — adding wines to a personal cellar, personalized recommendations, local wine discovery.

**What's already in place:**
- Account creation flow is built (`/signup`, `AccountConversion` component)
- Modal messaging is set up (`PalatePersonalModal`) — no price shown yet
- The `AccountConversion` step flow (`benefits → form → success`) has a natural place to insert a `payment` step between `form` and `success`

**What's needed when ready:**
- Stripe integration (Elements for card input, webhooks for subscription state)
- Subscription status on the `profiles` table (`subscription_status`, `stripe_customer_id`)
- Dashboard feature gates — locked features that show an upgrade prompt instead of a wall at signup
- Failed payment / cancellation handling

**Why deferred:** Founding clients are being onboarded personally. Manual billing works for the first 10. Get the product solid first.

---

## Returning User Event Linking

**What:** When a user who already has a permanent account attends a new event (booth or wine crawl), the entry flows don't recognize their existing Supabase session. They get a new temp profile instead of having the event attached to their account. Ratings expire in 7 days unless they go through the Save flow again — which currently redirects to dashboard without migrating.

**The fix (when ready):**
- At the start of `/booth/[eventId]/page.tsx` and `/join/page.tsx`, check for an active Supabase session before creating a temp profile
- If a session exists, skip temp account creation and use the permanent user ID directly for all rating writes

**Files to touch:**
- `src/app/booth/[eventId]/page.tsx` — entry/email submit logic
- `src/app/join/page.tsx` — `handleJoinEvent` function

**Why deferred:** Only affects users who have already been through a full tasting, created an account, and return for a second event. Not a day-one problem.

---

## Curator-Initiated Account Creation

**What:** Two capabilities for the curator to create permanent accounts without the user self-signing up:
1. **Create from scratch** — curator fills in name + email, system creates a permanent profile, Supabase sends a password-reset email so the user sets their own credentials
2. **Promote a temp user from an event** — curator views attendees from a specific event, picks one, and converts their temp profile to a permanent account

**What's needed when ready:**

*From scratch:*
- Form on `/curator/members` with name + email
- `supabase.auth.admin.createUser()` (requires service role key, server-side only — needs an API route)
- Trigger a Supabase password reset email so the user gains access

*Promote from event:*
- Event attendee list on the curator's event detail view or a filter on `/curator/members` showing temp users
- Same `supabase.auth.admin.createUser()` flow using `eventbrite_email` as the account email
- Migrate `user_wine_ratings` and `user_wine_descriptors` from temp ID to new auth ID (same logic as `AccountConversion`)
- Notify the user via email that their tasting data has been saved

**Complications to resolve first:**
- Requires a server-side API route (`/api/curator/create-user`) using the Supabase service role key — can't call `auth.admin` from the browser
- Need user consent consideration once subscriptions are attached (curator creating a paid account on someone's behalf is a grey area)
- Temp users may only have `eventbrite_email` — needs validation that it's a real deliverable address

**Files to touch when ready:**
- Create `src/app/api/curator/create-user/route.ts` (server-side Supabase admin call)
- `src/app/curator/members/page.tsx` — add "Create Member" button and form
- `src/app/curator/events/[eventId]/page.tsx` (or equivalent) — add "Promote to Member" action on attendee rows

**Why deferred:** Requires a server-side API route (service role key), self-service signup works fine for now, and consent questions need to be resolved before curator-created accounts carry a subscription.

---

## Notes

- Different event email vs. account email is **not** a problem — conversion is ID-based (localStorage), not email-based.
- The free tier (≤20 guests, Booth mode) stays free indefinitely — no subscription needed to access it.
