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

const MEMBER_EMAIL = 'demo.member@palatecollectif.com'
const MEMBER_PASSWORD = 'DemoMember2025!'
const MEMBER_NAME = 'Demo Member'

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

  // 3. Create or fetch permanent member auth user
  section('Permanent Member Account')
  let memberId

  const existingMember = existingUsers?.users?.find(u => u.email === MEMBER_EMAIL)

  if (existingMember) {
    memberId = existingMember.id
    skip(`Auth user ${MEMBER_EMAIL}`)
  } else {
    const { data: newMember, error: memberAuthErr } = await supabase.auth.admin.createUser({
      email: MEMBER_EMAIL,
      password: MEMBER_PASSWORD,
      email_confirm: true,
    })
    if (memberAuthErr) { console.error('Failed to create member auth user:', memberAuthErr.message); process.exit(1) }
    memberId = newMember.user.id
    ok(`Created auth user: ${MEMBER_EMAIL} / ${MEMBER_PASSWORD}`)
  }

  // Upsert member profile
  const { error: memberProfileErr } = await supabase
    .from('profiles')
    .upsert({
      id: memberId,
      display_name: MEMBER_NAME,
      eventbrite_email: MEMBER_EMAIL,
      is_admin: false,
      is_temp_account: false,
    }, { onConflict: 'id' })

  if (memberProfileErr) { console.error('Failed to upsert member profile:', memberProfileErr.message); process.exit(1) }
  ok(`Member profile ready (id: ${memberId})`)

  // 4. Delete stale demo events (so re-running the script is safe)
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
    {
      event_id: boothEvent.id, wine_name: "Lumiere Rouge Reserve", producer: "Chateau Lumiere", vintage: 2021, wine_type: "red", region: "Bordeaux", country: "France", tasting_order: 1, price_point: "$$$", alcohol_content: "13.5",
      sommelier_notes: "Deep ruby with notes of black cherry, cedar and subtle earthiness. Long, structured finish.",
      grape_varieties: [{ name: "Cabernet Sauvignon", percentage: 70 }, { name: "Merlot", percentage: 20 }, { name: "Cabernet Franc", percentage: 10 }],
      wine_style: ["Full-bodied", "Tannic", "Complex"],
      tasting_notes: { appearance: "Deep ruby with garnet edges", aroma: "Black cherry, cedar, tobacco leaf, and a hint of vanilla from oak aging", taste: "Rich and structured with dark fruit, dark chocolate, and earthy minerality", finish: "Long and persistent with firm, polished tannins" },
      winemaker_notes: "Harvested by hand in early October. Aged 18 months in French oak barrels, 40% new oak.",
      technical_details: { ph: "3.62", residual_sugar: "2.1 g/L", total_acidity: "5.8 g/L", aging: "18 months in French oak (40% new)", production: "4,200 cases" },
      food_pairings: [{ category: "Red Meat", items: ["Ribeye", "Lamb rack", "Beef bourguignon"] }, { category: "Cheese", items: ["Aged cheddar", "Comté", "Manchego"] }],
      awards: ["Gold Medal — Bordeaux Wine Competition 2022", "92 points — Wine Spectator"],
    },
    { event_id: boothEvent.id, wine_name: "Blanc de Blancs", producer: "Chateau Lumiere", vintage: 2022, wine_type: "white", region: "Burgundy", country: "France", tasting_order: 2, price_point: "$$", alcohol_content: "12.5", sommelier_notes: "Crisp and mineral with green apple, citrus zest, and a clean, refreshing finish.", grape_varieties: [{ name: "Chardonnay", percentage: 100 }], wine_style: ["Light-bodied", "Crisp", "Dry"] },
    { event_id: boothEvent.id, wine_name: "Rosé Provençal", producer: "Chateau Lumiere", vintage: 2023, wine_type: "rosé", region: "Provence", country: "France", tasting_order: 3, price_point: "$$", alcohol_content: "12.0", sommelier_notes: "Pale salmon, delicate strawberry and peach aromas with a dry, elegant finish.", grape_varieties: [{ name: "Grenache", percentage: 50 }, { name: "Cinsault", percentage: 30 }, { name: "Syrah", percentage: 20 }], wine_style: ["Light-bodied", "Dry", "Elegant"] },
    {
      event_id: boothEvent.id, wine_name: "Brut Classique", producer: "Chateau Lumiere", vintage: null, wine_type: "sparkling", region: "Champagne", country: "France", tasting_order: 4, price_point: "$$$", alcohol_content: "12.0",
      sommelier_notes: "Fine bubbles, brioche, green apple, and toasted almond. Persistent and celebratory.",
      grape_varieties: [{ name: "Chardonnay", percentage: 50 }, { name: "Pinot Noir", percentage: 30 }, { name: "Pinot Meunier", percentage: 20 }],
      wine_style: ["Light-bodied", "Crisp", "Elegant"],
      tasting_notes: { appearance: "Pale golden with persistent fine bubbles", aroma: "Brioche, green apple, white pear, and toasted almond", taste: "Creamy mousse, citrus, and subtle pastry notes with balanced acidity", finish: "Clean, long, and refreshing" },
      technical_details: { ph: "3.15", residual_sugar: "8 g/L", total_acidity: "7.5 g/L", aging: "36 months on lees", production: "6,000 cases" },
      dosage: "Brut (6 g/L)", pressure: 6, riddling_method: "Gyropalette",
    },
    { event_id: boothEvent.id, wine_name: "Amber Skin Contact", producer: "Chateau Lumiere", vintage: 2022, wine_type: "orange", region: "Alsace", country: "France", tasting_order: 5, price_point: "$$", alcohol_content: "13.0", sommelier_notes: "Amber hue, tannins from skin contact. Apricot, honey, chamomile, and a dry nuttiness.", grape_varieties: [{ name: "Gewurztraminer", percentage: 60 }, { name: "Pinot Gris", percentage: 40 }], wine_style: ["Full-bodied", "Tannic", "Dry"] },
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
    {
      event_id: crawlEvent.id, location_name: 'The Barrel Room', location_order: 1, wine_name: "Napa Cabernet Sauvignon", producer: "Ridge Vineyards", vintage: 2020, wine_type: "red", region: "Napa Valley", country: "United States", tasting_order: 1, price_point: "$$$", alcohol_content: "14.5",
      sommelier_notes: "Bold blackcurrant, dark chocolate, and vanilla oak. Full-bodied with smooth tannins.",
      grape_varieties: [{ name: "Cabernet Sauvignon", percentage: 85 }, { name: "Petit Verdot", percentage: 10 }, { name: "Malbec", percentage: 5 }],
      wine_style: ["Full-bodied", "Tannic", "Bold"],
      tasting_notes: { appearance: "Opaque deep ruby-purple", aroma: "Blackcurrant, dark cherry, mocha, and a cedar-vanilla oak signature", taste: "Concentrated dark fruit, espresso, and cocoa with velvety tannins", finish: "Exceptionally long with lingering oak and fruit" },
      winemaker_notes: "Estate grown on the Monte Bello ridge at 2,300 ft elevation. 22 months in American and French oak.",
      technical_details: { ph: "3.71", residual_sugar: "2.8 g/L", total_acidity: "5.5 g/L", aging: "22 months in American and French oak", production: "3,800 cases" },
      food_pairings: [{ category: "Red Meat", items: ["Porterhouse steak", "Braised short ribs", "Lamb chops"] }, { category: "Cheese", items: ["Blue cheese", "Aged gouda"] }],
      awards: ["95 points — Wine Advocate", "Best of Class — San Francisco Chronicle Wine Competition 2022"],
    },
    { event_id: crawlEvent.id, location_name: 'The Barrel Room', location_order: 1, wine_name: "Old Vine Zinfandel", producer: "Seghesio Family", vintage: 2021, wine_type: "red", region: "Sonoma County", country: "United States", tasting_order: 2, price_point: "$$", alcohol_content: "15.2", sommelier_notes: "Jammy blackberry, pepper, and bramble fruit. Rich, spicy, and juicy on the palate.", grape_varieties: [{ name: "Zinfandel", percentage: 95 }, { name: "Petite Sirah", percentage: 5 }], wine_style: ["Full-bodied", "Fruity", "Bold"] },
    // Stop 2 — Vine & Dine Bistro (2 whites)
    { event_id: crawlEvent.id, location_name: 'Vine & Dine Bistro', location_order: 2, wine_name: "Marlborough Sauvignon Blanc", producer: "Cloudy Bay", vintage: 2023, wine_type: "white", region: "Marlborough", country: "New Zealand", tasting_order: 3, price_point: "$$", alcohol_content: "13.0", sommelier_notes: "Vibrant passionfruit, lime, and freshly cut grass. Zesty and refreshing.", grape_varieties: [{ name: "Sauvignon Blanc", percentage: 100 }], wine_style: ["Light-bodied", "Crisp", "Fruity"] },
    { event_id: crawlEvent.id, location_name: 'Vine & Dine Bistro', location_order: 2, wine_name: "Sonoma Chardonnay", producer: "Kistler Vineyards", vintage: 2021, wine_type: "white", region: "Sonoma Coast", country: "United States", tasting_order: 4, price_point: "$$$", alcohol_content: "14.2", sommelier_notes: "Creamy texture, lemon curd, toasted hazelnut, and a long mineral finish.", grape_varieties: [{ name: "Chardonnay", percentage: 100 }], wine_style: ["Full-bodied", "Oaky", "Complex"] },
    // Stop 3 — The Cellar Door (2 mixed)
    { event_id: crawlEvent.id, location_name: 'The Cellar Door', location_order: 3, wine_name: "Mendoza Malbec", producer: "Achaval Ferrer", vintage: 2021, wine_type: "red", region: "Mendoza", country: "Argentina", tasting_order: 5, price_point: "$$", alcohol_content: "14.0", sommelier_notes: "Deep violet, plum, violets, and mocha. Velvety tannins with a lush finish.", grape_varieties: [{ name: "Malbec", percentage: 100 }], wine_style: ["Full-bodied", "Smooth", "Fruity"] },
    { event_id: crawlEvent.id, location_name: 'The Cellar Door', location_order: 3, wine_name: "Rias Baixas Albarino", producer: "Martin Codax", vintage: 2022, wine_type: "white", region: "Rias Baixas", country: "Spain", tasting_order: 6, price_point: "$$", alcohol_content: "12.5", sommelier_notes: "Stone fruit, floral aromas, crisp acidity. Perfect coastal white.", grape_varieties: [{ name: "Albariño", percentage: 100 }], wine_style: ["Light-bodied", "Crisp", "Dry"] },
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
    {
      event_id: festEvent.id, wine_name: "Barolo DOCG", producer: "Giacomo Conterno", vintage: 2018, wine_type: "red", region: "Piedmont", country: "Italy", tasting_order: 1, price_point: "$$$$", alcohol_content: "14.5",
      sommelier_notes: "The king of Italian wines. Tar, roses, cherry, and leather with legendary aging potential.",
      grape_varieties: [{ name: "Nebbiolo", percentage: 100 }],
      wine_style: ["Full-bodied", "Tannic", "Complex"],
      tasting_notes: { appearance: "Garnet with orange brick rim", aroma: "Tar, dried roses, cherry, leather, and truffle with age", taste: "Powerful and austere with dried cherry, iron, tobacco, and firm tannins", finish: "Exceptionally long, mineral, and drying — built for decades of aging" },
      winemaker_notes: "Single-vineyard Cascina Francia. Fermented in large Slavonian oak vats for 60 days. Aged 7 years before release.",
      technical_details: { ph: "3.45", residual_sugar: "1.2 g/L", total_acidity: "6.2 g/L", aging: "7 years — large Slavonian oak casks + bottle", production: "1,800 cases" },
      food_pairings: [{ category: "Red Meat", items: ["Braised beef cheek", "Venison", "White truffle risotto"] }, { category: "Cheese", items: ["Parmigiano Reggiano", "Taleggio", "Aged pecorino"] }],
      awards: ["98 points — James Suckling", "97 points — Wine Advocate", "Wine of the Year — Decanter 2023"],
    },
    { event_id: festEvent.id, wine_name: "Chablis Premier Cru", producer: "William Fevre", vintage: 2021, wine_type: "white", region: "Chablis", country: "France", tasting_order: 2, price_point: "$$$", alcohol_content: "13.0", sommelier_notes: "Pure, flinty minerality with oyster shell, lemon, and green apple. Quintessential Chablis.", grape_varieties: [{ name: "Chardonnay", percentage: 100 }], wine_style: ["Light-bodied", "Crisp", "Dry"] },
    { event_id: festEvent.id, wine_name: "Rioja Gran Reserva", producer: "Marques de Murrieta", vintage: 2016, wine_type: "red", region: "Rioja", country: "Spain", tasting_order: 3, price_point: "$$$", alcohol_content: "14.0", sommelier_notes: "Brick-red with evolved aromas of dried cherry, tobacco, vanilla, and earthy complexity.", grape_varieties: [{ name: "Tempranillo", percentage: 85 }, { name: "Garnacha", percentage: 10 }, { name: "Graciano", percentage: 5 }], wine_style: ["Full-bodied", "Complex", "Elegant"] },
    { event_id: festEvent.id, wine_name: "Martinborough Pinot Noir", producer: "Ata Rangi", vintage: 2021, wine_type: "red", region: "Martinborough", country: "New Zealand", tasting_order: 4, price_point: "$$$", alcohol_content: "13.5", sommelier_notes: "Elegant and silky. Red cherry, violets, and subtle forest floor. Pinot at its finest.", grape_varieties: [{ name: "Pinot Noir", percentage: 100 }], wine_style: ["Medium-bodied", "Elegant", "Smooth"] },
    { event_id: festEvent.id, wine_name: "Alsace Gewurztraminer", producer: "Trimbach", vintage: 2020, wine_type: "white", region: "Alsace", country: "France", tasting_order: 5, price_point: "$$", alcohol_content: "13.5", sommelier_notes: "Intensely aromatic — lychee, rose petal, and ginger. Off-dry with a rich, spicy finish.", grape_varieties: [{ name: "Gewurztraminer", percentage: 100 }], wine_style: ["Full-bodied", "Fruity", "Off-dry"] },
    { event_id: festEvent.id, wine_name: "Vintage Brut Champagne", producer: "Bollinger", vintage: 2014, wine_type: "sparkling", region: "Champagne", country: "France", tasting_order: 6, price_point: "$$$$", alcohol_content: "12.5", sommelier_notes: "Complex and full-bodied. Brioche, apple, toasted nuts, and exceptional depth.", grape_varieties: [{ name: "Pinot Noir", percentage: 60 }, { name: "Chardonnay", percentage: 40 }], wine_style: ["Full-bodied", "Complex", "Elegant"], dosage: "Brut (7 g/L)", pressure: 6 },
    { event_id: festEvent.id, wine_name: "Clare Valley Riesling", producer: "Jim Barry", vintage: 2022, wine_type: "white", region: "Clare Valley", country: "Australia", tasting_order: 7, price_point: "$$", alcohol_content: "11.5", sommelier_notes: "Lime juice, slate, and white flowers. Laser-sharp acidity with pristine length.", grape_varieties: [{ name: "Riesling", percentage: 100 }], wine_style: ["Light-bodied", "Crisp", "Dry"] },
    { event_id: festEvent.id, wine_name: "Tawny Port 20 Year", producer: "Graham's", vintage: null, wine_type: "fortified", region: "Douro Valley", country: "Portugal", tasting_order: 8, price_point: "$$$", alcohol_content: "20.0", sommelier_notes: "Amber-tawny, complex dried fruits, walnut, caramel, and orange peel. Exceptional dessert wine.", grape_varieties: [{ name: "Touriga Nacional", percentage: 40 }, { name: "Tinta Roriz", percentage: 30 }, { name: "Touriga Franca", percentage: 30 }], wine_style: ["Full-bodied", "Sweet", "Complex"] },
  ])
  if (festWineErr) { console.error('Festival wine insert error:', festWineErr.message, festWineErr.details, festWineErr.hint); process.exit(1) }
  ok('Added 8 wines to festival event')

  // ── Seed ratings for demo member ──────────────────────────────────────────
  section('Demo Member — Seeding Past Ratings')

  // Pull the wine IDs we just created so we can attach ratings to them
  const { data: crawlWines } = await supabase
    .from('event_wines')
    .select('id, wine_name, wine_type')
    .eq('event_id', crawlEvent.id)

  const { data: festWines } = await supabase
    .from('event_wines')
    .select('id, wine_name, wine_type')
    .eq('event_id', festEvent.id)

  // Delete any existing demo member ratings first (idempotent)
  const allWineIds = [...(crawlWines || []), ...(festWines || [])].map(w => w.id)
  if (allWineIds.length) {
    await supabase
      .from('user_wine_ratings')
      .delete()
      .eq('user_id', memberId)
      .in('event_wine_id', allWineIds)
  }

  // Crawl ratings — member rated all 6 wines
  const crawlRatings = (crawlWines || []).map((w, i) => ({
    user_id: memberId,
    event_wine_id: w.id,
    rating: [4, 5, 3, 5, 4, 3][i % 6],
    would_buy: [true, true, false, true, false, false][i % 6],
    personal_notes: [
      'Loved the dark fruit and structure',
      'Favourite of the night — jammy and bold',
      null,
      'Crisp and clean, exactly what I wanted',
      null,
      null,
    ][i % 6],
  }))

  // Festival ratings — member rated 6 of the 8 wines (skipped 2)
  const festRatings = (festWines || []).slice(0, 6).map((w, i) => ({
    user_id: memberId,
    event_wine_id: w.id,
    rating: [5, 4, 4, 5, 3, 4][i % 6],
    would_buy: [true, false, true, true, false, false][i % 6],
    personal_notes: [
      'Incredible — worth every penny',
      'Pure and mineral, loved it',
      null,
      'Best Pinot I have ever had',
      null,
      null,
    ][i % 6],
  }))

  const { error: ratingsErr } = await supabase
    .from('user_wine_ratings')
    .insert([...crawlRatings, ...festRatings])

  if (ratingsErr) { console.error('Failed to seed member ratings:', ratingsErr.message) }
  else { ok(`Seeded ${crawlRatings.length + festRatings.length} ratings for demo member`) }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n=== Seed Complete ===\n')
  console.log('ADMIN LOGIN')
  console.log(`  URL:      /admin/login`)
  console.log(`  Email:    ${ADMIN_EMAIL}`)
  console.log(`  Password: ${ADMIN_PASSWORD}`)
  console.log()
  console.log('MEMBER LOGIN')
  console.log(`  URL:      /login`)
  console.log(`  Email:    ${MEMBER_EMAIL}`)
  console.log(`  Password: ${MEMBER_PASSWORD}`)
  console.log(`  History:  Ratings seeded across Wine Crawl + Festival events`)
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
