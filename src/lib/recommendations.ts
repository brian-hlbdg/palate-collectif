// Wine Recommendation Engine
// Analyzes user ratings to suggest wines they might enjoy

import { supabase } from '@/lib/supabase'

export interface UserTasteProfile {
  userId: string
  totalRatings: number
  averageRating: number
  preferredTypes: { type: string; score: number }[]
  preferredRegions: { region: string; country: string; score: number }[]
  preferredStyles: { style: string; score: number }[]
  preferredGrapes: { grape: string; score: number }[]
  pricePreference: { point: string; score: number }[]
  flavorProfile: { descriptor: string; count: number }[]
  wouldBuyRate: number
}

export interface WineRecommendation {
  id: string
  wine_name: string
  producer?: string
  vintage?: number
  wine_type: string
  region?: string
  country?: string
  price_point?: string
  grape_varieties?: { name: string; percentage?: number }[]
  wine_style?: string[]
  image_url?: string
  matchScore: number
  matchReasons: string[]
  source: 'event' | 'master' | 'similar_users'
}

// Build a taste profile from user's ratings
export async function buildTasteProfile(userId: string): Promise<UserTasteProfile | null> {
  try {
    // Get all user ratings with wine details
    const { data: ratings, error } = await supabase
      .from('user_wine_ratings')
      .select(`
        rating,
        would_buy,
        event_wines (
          wine_name,
          wine_type,
          region,
          country,
          price_point,
          grape_varieties,
          wine_style
        ),
        user_wine_descriptors (
          descriptors (name, category)
        )
      `)
      .eq('user_id', userId)

    if (error || !ratings || ratings.length === 0) {
      return null
    }

    // Weight ratings (higher ratings = stronger preference)
    const getWeight = (rating: number) => {
      if (rating >= 5) return 3
      if (rating >= 4) return 2
      if (rating >= 3) return 1
      return 0 // Don't count low ratings as preferences
    }

    // Aggregate preferences
    const typeScores: Record<string, number> = {}
    const regionScores: Record<string, { country: string; score: number }> = {}
    const styleScores: Record<string, number> = {}
    const grapeScores: Record<string, number> = {}
    const priceScores: Record<string, number> = {}
    const descriptorCounts: Record<string, number> = {}
    
    let wouldBuyCount = 0
    let totalRatingSum = 0

    ratings.forEach((r: any) => {
      const weight = getWeight(r.rating)
      const wine = r.event_wines
      
      if (!wine || weight === 0) return
      
      totalRatingSum += r.rating
      if (r.would_buy) wouldBuyCount++

      // Wine type preference
      if (wine.wine_type) {
        typeScores[wine.wine_type] = (typeScores[wine.wine_type] || 0) + weight
      }

      // Region preference
      if (wine.region) {
        if (!regionScores[wine.region]) {
          regionScores[wine.region] = { country: wine.country || '', score: 0 }
        }
        regionScores[wine.region].score += weight
      }

      // Style preferences
      if (wine.wine_style && Array.isArray(wine.wine_style)) {
        wine.wine_style.forEach((style: string) => {
          styleScores[style] = (styleScores[style] || 0) + weight
        })
      }

      // Grape preferences
      if (wine.grape_varieties && Array.isArray(wine.grape_varieties)) {
        wine.grape_varieties.forEach((grape: any) => {
          if (grape.name) {
            grapeScores[grape.name] = (grapeScores[grape.name] || 0) + weight
          }
        })
      }

      // Price preference
      if (wine.price_point) {
        priceScores[wine.price_point] = (priceScores[wine.price_point] || 0) + weight
      }

      // Flavor descriptors
      if (r.user_wine_descriptors) {
        r.user_wine_descriptors.forEach((ud: any) => {
          if (ud.descriptors?.name) {
            descriptorCounts[ud.descriptors.name] = (descriptorCounts[ud.descriptors.name] || 0) + 1
          }
        })
      }
    })

    // Convert to sorted arrays
    const sortByScore = (obj: Record<string, number>) => 
      Object.entries(obj)
        .map(([key, score]) => ({ key, score }))
        .sort((a, b) => b.score - a.score)

    return {
      userId,
      totalRatings: ratings.length,
      averageRating: totalRatingSum / ratings.length,
      preferredTypes: sortByScore(typeScores).map(({ key, score }) => ({ type: key, score })),
      preferredRegions: Object.entries(regionScores)
        .map(([region, data]) => ({ region, country: data.country, score: data.score }))
        .sort((a, b) => b.score - a.score),
      preferredStyles: sortByScore(styleScores).map(({ key, score }) => ({ style: key, score })),
      preferredGrapes: sortByScore(grapeScores).map(({ key, score }) => ({ grape: key, score })),
      pricePreference: sortByScore(priceScores).map(({ key, score }) => ({ point: key, score })),
      flavorProfile: Object.entries(descriptorCounts)
        .map(([descriptor, count]) => ({ descriptor, count }))
        .sort((a, b) => b.count - a.count),
      wouldBuyRate: wouldBuyCount / ratings.length
    }
  } catch (err) {
    console.error('Error building taste profile:', err)
    return null
  }
}

// Get recommendations for a user
export async function getRecommendations(
  userId: string,
  options: {
    eventId?: string          // Limit to specific event
    excludeRated?: boolean    // Exclude wines user already rated
    limit?: number
    source?: 'event' | 'master' | 'all'
  } = {}
): Promise<WineRecommendation[]> {
  const { eventId, excludeRated = true, limit = 10, source = 'all' } = options

  try {
    // Build user's taste profile
    const profile = await buildTasteProfile(userId)
    
    if (!profile || profile.totalRatings < 2) {
      // Not enough data - return popular wines instead
      return getPopularWines(eventId, limit)
    }

    // Get wines user has already rated
    let ratedWineIds: string[] = []
    if (excludeRated) {
      const { data: rated } = await supabase
        .from('user_wine_ratings')
        .select('event_wine_id')
        .eq('user_id', userId)
      
      ratedWineIds = rated?.map(r => r.event_wine_id) || []
    }

    const recommendations: WineRecommendation[] = []

    // Get wines from events
    if (source === 'event' || source === 'all') {
      let query = supabase
        .from('event_wines')
        .select('*')
      
      if (eventId) {
        query = query.eq('event_id', eventId)
      }
      
      const { data: eventWines } = await query

      if (eventWines) {
        eventWines.forEach(wine => {
          if (ratedWineIds.includes(wine.id)) return

          const { score, reasons } = calculateMatchScore(wine, profile)
          
          if (score > 0) {
            recommendations.push({
              id: wine.id,
              wine_name: wine.wine_name,
              producer: wine.producer,
              vintage: wine.vintage,
              wine_type: wine.wine_type,
              region: wine.region,
              country: wine.country,
              price_point: wine.price_point,
              grape_varieties: wine.grape_varieties,
              wine_style: wine.wine_style,
              image_url: wine.image_url,
              matchScore: score,
              matchReasons: reasons,
              source: 'event'
            })
          }
        })
      }
    }

    // Get wines from master catalog
    if (source === 'master' || source === 'all') {
      const { data: masterWines } = await supabase
        .from('wines_master')
        .select('*')
        .limit(100) // Limit for performance

      if (masterWines) {
        masterWines.forEach(wine => {
          const { score, reasons } = calculateMatchScore(wine, profile)
          
          if (score > 0) {
            recommendations.push({
              id: wine.id,
              wine_name: wine.wine_name,
              producer: wine.producer,
              vintage: wine.vintage,
              wine_type: wine.wine_type,
              region: wine.region,
              country: wine.country,
              price_point: wine.price_point,
              grape_varieties: wine.grape_varieties,
              wine_style: wine.wine_style,
              image_url: wine.image_url,
              matchScore: score,
              matchReasons: reasons,
              source: 'master'
            })
          }
        })
      }
    }

    // Sort by match score and return top results
    return recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)

  } catch (err) {
    console.error('Error getting recommendations:', err)
    return []
  }
}

// Calculate how well a wine matches user preferences
function calculateMatchScore(
  wine: any, 
  profile: UserTasteProfile
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // Wine type match (up to 30 points)
  const typeMatch = profile.preferredTypes.find(t => t.type === wine.wine_type)
  if (typeMatch) {
    const typeScore = Math.min(30, typeMatch.score * 10)
    score += typeScore
    if (typeScore >= 20) {
      reasons.push(`You love ${wine.wine_type} wines`)
    }
  }

  // Region match (up to 25 points)
  const regionMatch = profile.preferredRegions.find(r => r.region === wine.region)
  if (regionMatch) {
    const regionScore = Math.min(25, regionMatch.score * 8)
    score += regionScore
    if (regionScore >= 15) {
      reasons.push(`From ${wine.region}, a region you enjoy`)
    }
  }

  // Style match (up to 25 points)
  if (wine.wine_style && Array.isArray(wine.wine_style)) {
    let styleScore = 0
    const matchedStyles: string[] = []
    
    wine.wine_style.forEach((style: string) => {
      const match = profile.preferredStyles.find(s => s.style === style)
      if (match) {
        styleScore += match.score * 5
        matchedStyles.push(style)
      }
    })
    
    styleScore = Math.min(25, styleScore)
    score += styleScore
    
    if (matchedStyles.length > 0 && styleScore >= 15) {
      reasons.push(`${matchedStyles.slice(0, 2).join(', ')} style you prefer`)
    }
  }

  // Grape match (up to 15 points)
  if (wine.grape_varieties && Array.isArray(wine.grape_varieties)) {
    let grapeScore = 0
    const matchedGrapes: string[] = []
    
    wine.grape_varieties.forEach((grape: any) => {
      const match = profile.preferredGrapes.find(g => g.grape === grape.name)
      if (match) {
        grapeScore += match.score * 5
        matchedGrapes.push(grape.name)
      }
    })
    
    grapeScore = Math.min(15, grapeScore)
    score += grapeScore
    
    if (matchedGrapes.length > 0 && grapeScore >= 10) {
      reasons.push(`Made with ${matchedGrapes[0]}`)
    }
  }

  // Price preference match (up to 5 points)
  const priceMatch = profile.pricePreference.find(p => p.point === wine.price_point)
  if (priceMatch) {
    score += Math.min(5, priceMatch.score * 2)
  }

  // Normalize score to 0-100
  score = Math.min(100, score)

  return { score, reasons }
}

// Fallback: Get popular wines when user has no rating history
async function getPopularWines(eventId?: string, limit: number = 10): Promise<WineRecommendation[]> {
  try {
    // Get wines with highest average ratings
    let query = supabase
      .from('user_wine_ratings')
      .select(`
        event_wine_id,
        rating,
        event_wines (
          id,
          wine_name,
          producer,
          vintage,
          wine_type,
          region,
          country,
          price_point,
          grape_varieties,
          wine_style,
          image_url,
          event_id
        )
      `)
    
    const { data: ratings } = await query

    if (!ratings) return []

    // Aggregate by wine
    const wineStats: Record<string, { 
      wine: any
      totalRating: number
      count: number 
    }> = {}

    ratings.forEach((r: any) => {
      if (!r.event_wines) return
      if (eventId && r.event_wines.event_id !== eventId) return
      
      const id = r.event_wine_id
      if (!wineStats[id]) {
        wineStats[id] = { wine: r.event_wines, totalRating: 0, count: 0 }
      }
      wineStats[id].totalRating += r.rating
      wineStats[id].count++
    })

    // Calculate average and sort
    return Object.values(wineStats)
      .map(({ wine, totalRating, count }) => ({
        id: wine.id,
        wine_name: wine.wine_name,
        producer: wine.producer,
        vintage: wine.vintage,
        wine_type: wine.wine_type,
        region: wine.region,
        country: wine.country,
        price_point: wine.price_point,
        grape_varieties: wine.grape_varieties,
        wine_style: wine.wine_style,
        image_url: wine.image_url,
        matchScore: (totalRating / count) * 20, // Scale to ~100
        matchReasons: [`Highly rated (${(totalRating / count).toFixed(1)}★ from ${count} ratings)`],
        source: 'event' as const
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)

  } catch (err) {
    console.error('Error getting popular wines:', err)
    return []
  }
}

// Get similar users for collaborative filtering (future enhancement)
export async function findSimilarUsers(userId: string, limit: number = 5): Promise<string[]> {
  // This would implement collaborative filtering
  // For now, return empty - can be enhanced later
  return []
}
