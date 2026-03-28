/**
 * Demo Seed Script - Palate Collectif
 *
 * Creates demo accounts and test events for walkthroughs.
 *
 * Prerequisites:
 *   1. Add your Supabase Service Role Key to .env.local:
 *      SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
 *
 * Run:
 *   node --env-file=.env.local scripts/seed-demo.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === 'your_service_role_key') {
  console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY in .env.local before running this script.')
  console.error('Find it in: Supabase Dashboard > Project Settings > API > service_role key')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Demo credentials ────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'demo.admin@palatecollectif.com'
const ADMIN_PASSWORD = 'DemoAdmin2025!'
const ADMIN_NAME = 'Demo Admin'

// ─── Event codes ─────────────────────────────────────────────────────────────
const BOOTH_CODE = 'BOOTH01'
const CRAWL_CODE = 'CRAWL01'
const FEST_CODE = 'FEST01'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function log(msg) { console.log(`  ${msg}`) }
function section(title) { console.log(`\n>>> ${title}`) }
function ok(msg) { console.log(`  [OK] ${msg}`) }
function skip(msg) { console.log(`  [--] ${msg} (already exists)`) }

// ─── Main ────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('=== Palate Collectif — Demo Seed ===')

  // 1. Create or fetch admin auth user
  section('Admin Account')
  let adminId

  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL)

  if (existing) {
    adminId = existing.id
    skip(`Auth user ${ADMIN_EMAIL}`)
  } else {
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    })
    if (error) { console.error('Failed to create admin auth user:', error.message); process.exit(1) }
    adminId = newUser.user.id
    ok(`Created auth user: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  }

  // 2. Upsert admin profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: adminId,
      display_name: ADMIN_NAME,
      eventbrite_email: ADMIN_EMAIL,
      is_admin: true,
      is_temp_account: false,
    }, { onConflict: 'id' })

  if (profileError) { console.error('Failed to upsert admin profile:', profileError.message); process.exit(1) }
  ok(`Admin profile ready (id: ${adminId})`)

  // 3. Delete stale demo events (so re-running the script is safe)
  section('Clearing Old Demo Events')
  const { data: oldEvents } = await supabase
    .from('tasting_events')
    .select('id')
    .in('event_code', [BOOTH_CODE, CRAWL_CODE, FEST_CODE])

  if (oldEvents?.length) {
    const ids = oldEvents.map(e => e.id)
    await supabase.from('event_wines').delete().in('event_id', ids)
    await supabase.from('tasting_events').delete().in('id', ids)
    log(`Removed ${ids.length} stale demo event(s)`)
  } else {
    log('Nothing to clear')
  }

  // ── BOOTH EVENT ────────────────────────────────────────────────────────────
  section('Booth Event — "Chateau Lumiere Showcase"')

  const { data: boothEvent, error: boothErr } = await supabase
    .from('tasting_events')
    .insert({
      admin_id: adminId,
      event_name: 'Chateau Lumiere Showcase',
      event_code: BOOTH_CODE,
      event_date: '2025-04-15',
      location: 'Grand Hotel Ballroom',
      description: 'An exclusive wine showcase featuring select bottles from Chateau Lumiere.',
      is_active: true,
      is_deleted: false,
      is_booth_mode: true,
      access_type: 'email_only',
      booth_welcome_message: 'Welcome! Enter your email to begin your tasting journey.',
    })
    .select('id')
    .single()

  if (boothErr) { console.error('Failed to create booth event:', boothErr.message); process.exit(1) }
  ok(`Created booth event (code: ${BOOTH_CODE})`)

  const { error: boothWineErr } = await supabase.from('event_wines').insert([
    { event_id: boothEvent.id, wine_name: "Lumiere Rouge Reserve", producer: "Chateau Lumiere", vintage: "2021", wine_type: "red", region: "Bordeaux", country: "France", tasting_order: 1, price_point: "$$$", sommelier_notes: "Deep ruby with notes of black cherry, cedar and subtle earthiness. Long, structured finish." },
    { event_id: boothEvent.id, wine_name: "Blanc de Blancs", producer: "Chateau Lumiere", vintage: "2022", wine_type: "white", region: "Burgundy", country: "France", tasting_order: 2, price_point: "$$", sommelier_notes: "Crisp and mineral with green apple, citrus zest, and a clean, refreshing finish." },
    { event_id: boothEvent.id, wine_name: "Rosé Provençal", producer: "Chateau Lumiere", vintage: "2023", wine_type: "rosé", region: "Provence", country: "France", tasting_order: 3, price_point: "$$", sommelier_notes: "Pale salmon, delicate strawberry and peach aromas with a dry, elegant finish." },
    { event_id: boothEvent.id, wine_name: "Brut Classique", producer: "Chateau Lumiere", vintage: null, wine_type: "sparkling", region: "Champagne", country: "France", tasting_order: 4, price_point: "$$$", sommelier_notes: "Fine bubbles, brioche, green apple, and toasted almond. Persistent and celebratory." },
    { event_id: boothEvent.id, wine_name: "Amber Skin Contact", producer: "Chateau Lumiere", vintage: "2022", wine_type: "orange", region: "Alsace", country: "France", tasting_order: 5, price_point: "$$", sommelier_notes: "Amber hue, tannins from skin contact. Apricot, honey, chamomile, and a dry nuttiness." },
  ])
  if (boothWineErr) { console.error('Booth wine insert error:', boothWineErr.message, boothWineErr.details, boothWineErr.hint); process.exit(1) }
  ok('Added 5 wines to booth event')

  // ── WINE CRAWL EVENT ───────────────────────────────────────────────────────
  section('Wine Crawl Event — "Old Town Wine Crawl"')

  const { data: crawlEvent, error: crawlErr } = await supabase
    .from('tasting_events')
    .insert({
      admin_id: adminId,
      event_name: 'Old Town Wine Crawl',
      event_code: CRAWL_CODE,
      event_date: '2025-04-20',
      location: 'Old Town District',
      description: 'Visit three iconic stops and taste wines curated for each unique venue.',
      is_active: true,
      is_deleted: false,
      is_booth_mode: false,
      access_type: 'event_code',
    })
    .select('id')
    .single()

  if (crawlErr) { console.error('Failed to create crawl event:', crawlErr.message); process.exit(1) }
  ok(`Created wine crawl event (code: ${CRAWL_CODE})`)

  await supabase.from('event_wines').insert([
    // Stop 1 — The Barrel Room (2 reds)
    { event_id: crawlEvent.id, location_name: 'The Barrel Room', location_order: 1, wine_name: "Napa Cabernet Sauvignon", producer: "Ridge Vineyards", vintage: "2020", wine_type: "red", region: "Napa Valley", country: "United States", tasting_order: 1, price_point: "$$$", sommelier_notes: "Bold blackcurrant, dark chocolate, and vanilla oak. Full-bodied with smooth tannins." },
    { event_id: crawlEvent.id, location_name: 'The Barrel Room', location_order: 1, wine_name: "Old Vine Zinfandel", producer: "Seghesio Family", vintage: "2021", wine_type: "red", region: "Sonoma County", country: "United States", tasting_order: 2, price_point: "$$", sommelier_notes: "Jammy blackberry, pepper, and bramble fruit. Rich, spicy, and juicy on the palate." },
    // Stop 2 — Vine & Dine Bistro (2 whites)
    { event_id: crawlEvent.id, location_name: 'Vine & Dine Bistro', location_order: 2, wine_name: "Marlborough Sauvignon Blanc", producer: "Cloudy Bay", vintage: "2023", wine_type: "white", region: "Marlborough", country: "New Zealand", tasting_order: 3, price_point: "$$", sommelier_notes: "Vibrant passionfruit, lime, and freshly cut grass. Zesty and refreshing." },
    { event_id: crawlEvent.id, location_name: 'Vine & Dine Bistro', location_order: 2, wine_name: "Sonoma Chardonnay", producer: "Kistler Vineyards", vintage: "2021", wine_type: "white", region: "Sonoma Coast", country: "United States", tasting_order: 4, price_point: "$$$", sommelier_notes: "Creamy texture, lemon curd, toasted hazelnut, and a long mineral finish." },
    // Stop 3 — The Cellar Door (2 mixed)
    { event_id: crawlEvent.id, location_name: 'The Cellar Door', location_order: 3, wine_name: "Mendoza Malbec", producer: "Achaval Ferrer", vintage: "2021", wine_type: "red", region: "Mendoza", country: "Argentina", tasting_order: 5, price_point: "$$", sommelier_notes: "Deep violet, plum, violets, and mocha. Velvety tannins with a lush finish." },
    { event_id: crawlEvent.id, location_name: 'The Cellar Door', location_order: 3, wine_name: "Rias Baixas Albarino", producer: "Martin Codax", vintage: "2022", wine_type: "white", region: "Rias Baixas", country: "Spain", tasting_order: 6, price_point: "$$", sommelier_notes: "Stone fruit, floral aromas, crisp acidity. Perfect coastal white." },
  ])
  ok('Added 6 wines across 3 locations')

  // ── WINE FESTIVAL EVENT ────────────────────────────────────────────────────
  section('Wine Festival Event — "Grand Harvest Festival"')

  const { data: festEvent, error: festErr } = await supabase
    .from('tasting_events')
    .insert({
      admin_id: adminId,
      event_name: 'Grand Harvest Festival',
      event_code: FEST_CODE,
      event_date: '2025-05-10',
      location: 'Riverside Park Pavilion',
      description: 'The premier wine festival of the season. Taste wines from around the world in one spectacular setting.',
      is_active: true,
      is_deleted: false,
      is_booth_mode: false,
      access_type: 'event_code',
    })
    .select('id')
    .single()

  if (festErr) { console.error('Failed to create festival event:', festErr.message); process.exit(1) }
  ok(`Created wine festival event (code: ${FEST_CODE})`)

  const { error: festWineErr } = await supabase.from('event_wines').insert([
    { event_id: festEvent.id, wine_name: "Barolo DOCG", producer: "Giacomo Conterno", vintage: "2018", wine_type: "red", region: "Piedmont", country: "Italy", tasting_order: 1, price_point: "$$$$", sommelier_notes: "The king of Italian wines. Tar, roses, cherry, and leather with legendary aging potential." },
    { event_id: festEvent.id, wine_name: "Chablis Premier Cru", producer: "William Fevre", vintage: "2021", wine_type: "white", region: "Chablis", country: "France", tasting_order: 2, price_point: "$$$", sommelier_notes: "Pure, flinty minerality with oyster shell, lemon, and green apple. Quintessential Chablis." },
    { event_id: festEvent.id, wine_name: "Rioja Gran Reserva", producer: "Marques de Murrieta", vintage: "2016", wine_type: "red", region: "Rioja", country: "Spain", tasting_order: 3, price_point: "$$$", sommelier_notes: "Brick-red with evolved aromas of dried cherry, tobacco, vanilla, and earthy complexity." },
    { event_id: festEvent.id, wine_name: "Marlborough Pinot Noir", producer: "Ata Rangi", vintage: "2021", wine_type: "red", region: "Martinborough", country: "New Zealand", tasting_order: 4, price_point: "$$$", sommelier_notes: "Elegant and silky. Red cherry, violets, and subtle forest floor. Pinot at its finest." },
    { event_id: festEvent.id, wine_name: "Alsace Gewurztraminer", producer: "Trimbach", vintage: "2020", wine_type: "white", region: "Alsace", country: "France", tasting_order: 5, price_point: "$$", sommelier_notes: "Intensely aromatic — lychee, rose petal, and ginger. Off-dry with a rich, spicy finish." },
    { event_id: festEvent.id, wine_name: "Vintage Brut Champagne", producer: "Bollinger", vintage: "2014", wine_type: "sparkling", region: "Champagne", country: "France", tasting_order: 6, price_point: "$$$$", sommelier_notes: "Complex and full-bodied. Brioche, apple, toasted nuts, and exceptional depth." },
    { event_id: festEvent.id, wine_name: "Clare Valley Riesling", producer: "Jim Barry", vintage: "2022", wine_type: "white", region: "Clare Valley", country: "Australia", tasting_order: 7, price_point: "$$", sommelier_notes: "Lime juice, slate, and white flowers. Laser-sharp acidity with pristine length." },
    { event_id: festEvent.id, wine_name: "Tawny Port 20 Year", producer: "Graham's", vintage: null, wine_type: "fortified", region: "Douro Valley", country: "Portugal", tasting_order: 8, price_point: "$$$", sommelier_notes: "Amber-tawny, complex dried fruits, walnut, caramel, and orange peel. Exceptional dessert wine." },
  ])
  if (festWineErr) { console.error('Festival wine insert error:', festWineErr.message, festWineErr.details, festWineErr.hint); process.exit(1) }
  ok('Added 8 wines to festival event')

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n=== Seed Complete ===\n')
  console.log('ADMIN LOGIN')
  console.log(`  URL:      /admin/login`)
  console.log(`  Email:    ${ADMIN_EMAIL}`)
  console.log(`  Password: ${ADMIN_PASSWORD}`)
  console.log()
  console.log('BOOTH EVENT')
  console.log(`  URL:      /booth/${BOOTH_CODE}`)
  console.log(`  Code:     ${BOOTH_CODE}`)
  console.log(`  Name:     Chateau Lumiere Showcase`)
  console.log()
  console.log('WINE CRAWL EVENT')
  console.log(`  Join at:  /join  →  code: ${CRAWL_CODE}`)
  console.log(`  Code:     ${CRAWL_CODE}`)
  console.log(`  Name:     Old Town Wine Crawl  (3 stops, 6 wines)`)
  console.log()
  console.log('WINE FESTIVAL EVENT')
  console.log(`  Join at:  /join  →  code: ${FEST_CODE}`)
  console.log(`  Code:     ${FEST_CODE}`)
  console.log(`  Name:     Grand Harvest Festival  (8 wines)`)
  console.log()
}

seed().catch(err => {
  console.error('\nUnexpected error:', err)
  process.exit(1)
})
