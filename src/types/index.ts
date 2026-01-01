// ============================================
// PALATE COLLECTIF - Type Definitions
// ============================================

// ---------- User & Authentication ----------

export interface User {
  id: string;
  email?: string;
  display_name: string;
  is_admin: boolean;
  is_temp_account: boolean;
  account_expires_at?: string;
  eventbrite_email?: string;
  created_at: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ---------- Events ----------

export type EventType = 'wine_crawl' | 'booth';

export interface TastingEvent {
  id: string;
  event_code: string;
  event_name: string;
  event_date: string;
  location?: string;
  description?: string;
  admin_id: string;
  is_active: boolean;
  event_type: EventType;
  created_at: string;
  updated_at?: string;
  
  // Booth mode customization
  booth_logo_url?: string;
  booth_primary_color?: string;
  booth_welcome_message?: string;
  
  // Relations (when joined)
  event_wines?: EventWine[];
  event_locations?: EventLocation[];
}

export interface EventLocation {
  id: string;
  event_id: string;
  location_name: string;
  location_address?: string;
  location_order: number;
  created_at: string;
}

// ---------- Wines ----------

export type WineType = 'red' | 'white' | 'rosé' | 'sparkling' | 'dessert' | 'fortified' | 'orange';
export type BeverageType = 'Wine' | 'Beer' | 'Spirit' | 'Cocktail' | 'Non-Alcoholic';
export type PricePoint = 'Budget' | 'Mid-range' | 'Premium' | 'Luxury';

export interface GrapeVariety {
  name: string;
  percentage?: number;
}

export interface FoodPairing {
  category: string;
  items: string[];
}

export interface TastingNotes {
  appearance?: string;
  aroma?: string;
  taste?: string;
  finish?: string;
}

export interface TechnicalDetails {
  ph?: string;
  residual_sugar?: string;
  total_acidity?: string;
  aging?: string;
  production?: string;
}

export interface EventWine {
  id: string;
  event_id: string;
  wine_name: string;
  producer?: string;
  vintage?: string;
  wine_type: WineType;
  beverage_type: BeverageType;
  region?: string;
  country?: string;
  price_point?: PricePoint;
  alcohol_content?: string;
  sommelier_notes?: string;
  image_url?: string;
  tasting_order: number;
  location_id?: string;
  grape_varieties?: GrapeVariety[];
  wine_style?: string[];
  food_pairings?: FoodPairing[];
  food_pairing_notes?: string;
  tasting_notes?: TastingNotes;
  winemaker_notes?: string;
  technical_details?: TechnicalDetails;
  awards?: string[];
  created_at: string;
  
  // Relations (when joined)
  event_locations?: EventLocation;
  user_ratings?: UserRating[];
}

// ---------- Ratings ----------

export interface UserRating {
  id: string;
  user_id: string;
  event_wine_id: string;
  rating: number;
  personal_notes?: string;
  is_favorite?: boolean;
  created_at: string;
  updated_at?: string;
  
  // Relations (when joined)
  event_wines?: EventWine;
  user_wine_descriptors?: UserWineDescriptor[];
}

export interface WineDescriptor {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface UserWineDescriptor {
  id: string;
  rating_id: string;
  descriptor_id: string;
  
  // Relations (when joined)
  wine_descriptors?: WineDescriptor;
}

// ---------- UI State ----------

export type ViewState = 'join' | 'event' | 'wineDetails' | 'profile';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  content?: React.ReactNode;
  title?: string;
}

// ---------- Form States ----------

export interface WineFormData {
  wine_name: string;
  producer: string;
  vintage: string;
  wine_type: WineType;
  beverage_type: BeverageType;
  region: string;
  country: string;
  price_point: PricePoint;
  alcohol_content: string;
  sommelier_notes: string;
  image_url: string;
  grape_varieties: GrapeVariety[];
  wine_style: string[];
  food_pairings: FoodPairing[];
  food_pairing_notes: string;
  tasting_notes: TastingNotes;
  winemaker_notes: string;
  technical_details: TechnicalDetails;
  awards: string[];
}

export interface EventFormData {
  event_name: string;
  event_code: string;
  event_date: string;
  location: string;
  description: string;
  event_type: EventType;
  is_active: boolean;
  booth_logo_url?: string;
  booth_primary_color?: string;
  booth_welcome_message?: string;
}

// ---------- API Responses ----------

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---------- Analytics ----------

export interface WineAnalytics {
  wine_id: string;
  wine_name: string;
  total_ratings: number;
  average_rating: number;
  rating_distribution: Record<number, number>;
  top_descriptors: Array<{ name: string; count: number }>;
}

export interface EventAnalytics {
  event_id: string;
  total_participants: number;
  total_ratings: number;
  wines_ranked: WineAnalytics[];
  participation_rate: number;
  average_wines_rated_per_user: number;
}

// ---------- Theme ----------

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

// ---------- Navigation ----------

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

// ---------- Component Props ----------

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface AnimatedComponentProps extends BaseComponentProps {
  delay?: number;
  duration?: number;
}
