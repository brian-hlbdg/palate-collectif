// Tasting Buddies Service
// Handles all buddy connections, codes, and comparisons

import { supabase } from '@/lib/supabase'

export interface Buddy {
  buddy_id: string
  buddy_name: string
  connected_at_event_id?: string
  connected_at_event_name?: string
  is_permanent: boolean
  created_at: string
}

export interface EventBuddy {
  buddy_id: string
  buddy_name: string
  wines_rated: number
}

export interface BuddyComparison {
  buddy_id: string
  buddy_name: string
  taste_match_percent: number
  common_wines: number
  wines_agreed: WineAgreement[]
  wines_disagreed: WineAgreement[]
}

export interface WineAgreement {
  wine_id: string
  wine_name: string
  producer?: string
  user_rating: number
  user_notes?: string
  buddy_rating: number
  buddy_notes?: string
  difference: number
}

export interface EventStats {
  total_tasters: number
  total_ratings: number
  average_rating: number
  top_wines: {
    wine_id: string
    wine_name: string
    producer?: string
    average_rating: number
    rating_count: number
  }[]
  most_divisive: {
    wine_id: string
    wine_name: string
    producer?: string
    rating_spread: number
    min_rating: number
    max_rating: number
  } | null
  rating_distribution: {
    rating: number
    count: number
    percent: number
  }[]
}

// =====================================================
// BUDDY CODE OPERATIONS
// =====================================================

/**
 * Get or create a buddy code for the current user at an event
 */
export async function getOrCreateBuddyCode(
  userId: string,
  eventId: string
): Promise<{ code: string; error?: string }> {
  try {
    // Try to call the database function
    const { data, error } = await supabase
      .rpc('get_or_create_buddy_code', {
        p_user_id: userId,
        p_event_id: eventId
      })

    if (error) throw error
    return { code: data }
  } catch (err) {
    console.error('Error getting buddy code:', err)
    
    // Fallback: Generate code client-side
    const code = generateClientCode()
    
    const { error: insertError } = await supabase
      .from('buddy_codes')
      .upsert({
        user_id: userId,
        event_id: eventId,
        code,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    
    if (insertError) {
      return { code: '', error: 'Failed to create buddy code' }
    }
    
    return { code }
  }
}

function generateClientCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // Removed I, O to avoid confusion
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// =====================================================
// BUDDY CONNECTION OPERATIONS
// =====================================================

/**
 * Connect with another user using their buddy code
 */
export async function connectWithBuddy(
  userId: string,
  buddyCode: string,
  eventId: string
): Promise<{ success: boolean; message: string; buddyName?: string }> {
  try {
    // Try database function first
    const { data, error } = await supabase
      .rpc('connect_buddies', {
        p_user_id: userId,
        p_buddy_code: buddyCode.toUpperCase(),
        p_event_id: eventId
      })

    if (error) throw error
    
    if (data && data.length > 0) {
      return {
        success: data[0].success,
        message: data[0].message,
        buddyName: data[0].buddy_name
      }
    }
    
    return { success: false, message: 'Unknown error' }
  } catch (err) {
    console.error('Error connecting with buddy:', err)
    
    // Fallback: Manual connection
    return manualBuddyConnect(userId, buddyCode, eventId)
  }
}

async function manualBuddyConnect(
  userId: string,
  buddyCode: string,
  eventId: string
): Promise<{ success: boolean; message: string; buddyName?: string }> {
  // Find buddy by code
  const { data: codeData, error: codeError } = await supabase
    .from('buddy_codes')
    .select('user_id, profiles(display_name)')
    .eq('code', buddyCode.toUpperCase())
    .gt('expires_at', new Date().toISOString())
    .single()

  if (codeError || !codeData) {
    return { success: false, message: 'Invalid or expired buddy code' }
  }

  const buddyId = codeData.user_id
  const buddyName = (codeData.profiles as any)?.display_name || 'Unknown'

  if (buddyId === userId) {
    return { success: false, message: 'You cannot connect with yourself' }
  }

  // Check if already connected
  const { data: existing } = await supabase
    .from('tasting_buddies')
    .select('id')
    .or(`and(user_a_id.eq.${userId},user_b_id.eq.${buddyId}),and(user_a_id.eq.${buddyId},user_b_id.eq.${userId})`)
    .single()

  if (existing) {
    return { success: true, message: 'You are already tasting buddies!', buddyName }
  }

  // Create connection
  const { error: insertError } = await supabase
    .from('tasting_buddies')
    .insert({
      user_a_id: userId < buddyId ? userId : buddyId,
      user_b_id: userId < buddyId ? buddyId : userId,
      connected_at_event_id: eventId
    })

  if (insertError) {
    return { success: false, message: 'Failed to connect' }
  }

  // Record buddy session for both users
  await supabase.from('event_buddy_sessions').upsert([
    { event_id: eventId, user_id: userId, buddy_id: buddyId },
    { event_id: eventId, user_id: buddyId, buddy_id: userId }
  ])

  return { success: true, message: 'Successfully connected!', buddyName }
}

/**
 * Get all buddies for a user
 */
export async function getUserBuddies(userId: string): Promise<Buddy[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_buddies', { p_user_id: userId })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error getting buddies:', err)
    return []
  }
}

/**
 * Get buddies for a specific event
 */
export async function getEventBuddies(
  userId: string,
  eventId: string
): Promise<EventBuddy[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_event_buddies', { 
        p_user_id: userId, 
        p_event_id: eventId 
      })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error getting event buddies:', err)
    return []
  }
}

/**
 * Make a buddy connection permanent
 */
export async function makeBuddyPermanent(
  userId: string,
  buddyId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('tasting_buddies')
    .update({ is_permanent: true })
    .or(`and(user_a_id.eq.${userId},user_b_id.eq.${buddyId}),and(user_a_id.eq.${buddyId},user_b_id.eq.${userId})`)

  return !error
}

/**
 * Include/exclude past buddies for a new event
 */
export async function setEventBuddyInclusion(
  eventId: string,
  userId: string,
  buddyId: string,
  included: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from('event_buddy_sessions')
    .upsert({
      event_id: eventId,
      user_id: userId,
      buddy_id: buddyId,
      included_at_event: included
    })

  return !error
}

// =====================================================
// EVENT STATS & COMPARISON
// =====================================================

/**
 * Get overall event statistics (visible to everyone after event closes)
 */
export async function getEventStats(eventId: string): Promise<EventStats | null> {
  try {
    // Get all ratings for the event
    const { data: ratings, error } = await supabase
      .from('user_wine_ratings')
      .select(`
        rating,
        user_id,
        event_wines!inner (
          id,
          wine_name,
          producer,
          event_id
        )
      `)
      .eq('event_wines.event_id', eventId)

    if (error) throw error
    if (!ratings || ratings.length === 0) return null

    // Calculate stats
    const uniqueUsers = new Set(ratings.map(r => r.user_id))
    const totalRatings = ratings.length
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings

    // Wine-level stats
    const wineStats: Record<string, { 
      wine_id: string
      wine_name: string
      producer?: string
      ratings: number[]
    }> = {}

    ratings.forEach((r: any) => {
      const wineId = r.event_wines.id
      if (!wineStats[wineId]) {
        wineStats[wineId] = {
          wine_id: wineId,
          wine_name: r.event_wines.wine_name,
          producer: r.event_wines.producer,
          ratings: []
        }
      }
      wineStats[wineId].ratings.push(r.rating)
    })

    // Top wines by average rating
    const topWines = Object.values(wineStats)
      .map(w => ({
        wine_id: w.wine_id,
        wine_name: w.wine_name,
        producer: w.producer,
        average_rating: w.ratings.reduce((a, b) => a + b, 0) / w.ratings.length,
        rating_count: w.ratings.length
      }))
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, 5)

    // Most divisive wine (highest standard deviation)
    const divisiveWines = Object.values(wineStats)
      .filter(w => w.ratings.length >= 2)
      .map(w => {
        const min = Math.min(...w.ratings)
        const max = Math.max(...w.ratings)
        return {
          wine_id: w.wine_id,
          wine_name: w.wine_name,
          producer: w.producer,
          rating_spread: max - min,
          min_rating: min,
          max_rating: max
        }
      })
      .sort((a, b) => b.rating_spread - a.rating_spread)

    // Rating distribution
    const distribution = [1, 2, 3, 4, 5].map(rating => {
      const count = ratings.filter(r => r.rating === rating).length
      return {
        rating,
        count,
        percent: Math.round((count / totalRatings) * 100)
      }
    })

    return {
      total_tasters: uniqueUsers.size,
      total_ratings: totalRatings,
      average_rating: Math.round(avgRating * 10) / 10,
      top_wines: topWines,
      most_divisive: divisiveWines[0] || null,
      rating_distribution: distribution
    }
  } catch (err) {
    console.error('Error getting event stats:', err)
    return null
  }
}

/**
 * Get buddy comparison data (only for connected buddies after event closes)
 */
export async function getBuddyComparison(
  userId: string,
  buddyId: string,
  eventId: string
): Promise<BuddyComparison | null> {
  try {
    // Get buddy profile
    const { data: buddyProfile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', buddyId)
      .single()

    // Get taste match percentage
    const { data: matchData } = await supabase
      .rpc('calculate_taste_match', {
        p_user_a_id: userId,
        p_user_b_id: buddyId,
        p_event_id: eventId
      })

    // Get all ratings for both users
    const { data: userRatings } = await supabase
      .from('user_wine_ratings')
      .select(`
        rating,
        personal_notes,
        event_wines!inner (
          id,
          wine_name,
          producer,
          event_id
        )
      `)
      .eq('user_id', userId)
      .eq('event_wines.event_id', eventId)

    const { data: buddyRatings } = await supabase
      .from('user_wine_ratings')
      .select(`
        rating,
        personal_notes,
        event_wines!inner (
          id,
          wine_name,
          producer,
          event_id
        )
      `)
      .eq('user_id', buddyId)
      .eq('event_wines.event_id', eventId)

    if (!userRatings || !buddyRatings) return null

    // Build comparison
    const userRatingMap = new Map(
      userRatings.map((r: any) => [r.event_wines.id, r])
    )
    const buddyRatingMap = new Map(
      buddyRatings.map((r: any) => [r.event_wines.id, r])
    )

    const winesAgreed: WineAgreement[] = []
    const winesDisagreed: WineAgreement[] = []

    // Find common wines
    userRatingMap.forEach((userR: any, wineId) => {
      const buddyR = buddyRatingMap.get(wineId) as any
      if (buddyR) {
        const agreement: WineAgreement = {
          wine_id: wineId,
          wine_name: userR.event_wines.wine_name,
          producer: userR.event_wines.producer,
          user_rating: userR.rating,
          user_notes: userR.personal_notes,
          buddy_rating: buddyR.rating,
          buddy_notes: buddyR.personal_notes,
          difference: Math.abs(userR.rating - buddyR.rating)
        }

        if (agreement.difference <= 1) {
          winesAgreed.push(agreement)
        } else {
          winesDisagreed.push(agreement)
        }
      }
    })

    // Sort by difference
    winesAgreed.sort((a, b) => a.difference - b.difference)
    winesDisagreed.sort((a, b) => b.difference - a.difference)

    return {
      buddy_id: buddyId,
      buddy_name: buddyProfile?.display_name || 'Unknown',
      taste_match_percent: matchData || 0,
      common_wines: winesAgreed.length + winesDisagreed.length,
      wines_agreed: winesAgreed,
      wines_disagreed: winesDisagreed
    }
  } catch (err) {
    console.error('Error getting buddy comparison:', err)
    return null
  }
}

/**
 * Get past buddies that could be included in a new event
 */
export async function getPastBuddiesForEvent(
  userId: string,
  eventId: string
): Promise<{ buddy: Buddy; wasIncludedBefore: boolean }[]> {
  try {
    // Get all buddies
    const buddies = await getUserBuddies(userId)
    
    // Check which ones were included at previous events
    const result = await Promise.all(
      buddies.map(async (buddy) => {
        // Check if already included at this event
        const { data: session } = await supabase
          .from('event_buddy_sessions')
          .select('included_at_event')
          .eq('event_id', eventId)
          .eq('user_id', userId)
          .eq('buddy_id', buddy.buddy_id)
          .single()

        return {
          buddy,
          wasIncludedBefore: session?.included_at_event ?? buddy.is_permanent
        }
      })
    )

    return result
  } catch (err) {
    console.error('Error getting past buddies:', err)
    return []
  }
}

/**
 * Check if an event is closed (results can be shown)
 */
export async function isEventClosed(eventId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('tasting_events')
    .select('is_closed, event_date')
    .eq('id', eventId)
    .single()

  if (error || !data) return false
  
  // Event is closed if explicitly closed OR if event date has passed
  if (data.is_closed) return true
  
  if (data.event_date) {
    const eventDate = new Date(data.event_date)
    const now = new Date()
    // Event is "closed" if the date has passed by 1 day
    return now > new Date(eventDate.getTime() + 24 * 60 * 60 * 1000)
  }
  
  return false
}
