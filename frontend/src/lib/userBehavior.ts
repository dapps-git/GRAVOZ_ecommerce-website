/**
 * GRAVOZ User Behavior Tracker
 * 
 * Tracks user signals locally (searches, views, cart, wishlist)
 * and exposes extracted recommendation signals for the engine.
 * 
 * All data stays client-side in localStorage — no PII sent to server.
 */

export interface BehaviorEvent {
  type: 'search' | 'view' | 'cart' | 'wishlist' | 'color_select';
  query?: string;
  productId?: string;
  productName?: string;
  colors?: string[];
  selectedColor?: string;
  subCategory?: string;
  targetAudience?: string;
  price?: number;
  model?: string;
  timestamp: number;
}

export interface RecommendationSignals {
  colors: string[];           // e.g. ['black', 'brown', 'tan']
  categories: string[];       // e.g. ['casual shoes', 'boots', 'loafers']
  audiences: string[];        // e.g. ['men', 'women']
  priceRange: { min: number; max: number } | null;
  keywords: string[];         // raw search terms & model keywords
  recentProductIds: string[]; // viewed/carted/wishlisted product IDs
  lastSelectedColor?: string; // most recently focused color
}

const STORAGE_KEY = 'gravoz_behavior';

/**
 * Load events - disabled to protect user privacy (never stores tracking data)
 */
export function loadEvents(): BehaviorEvent[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('gravoz_recently_viewed');
    } catch { /* ignore */ }
  }
  return [];
}

/**
 * Save events - disabled as requested
 */
function saveEvents(_events: BehaviorEvent[]) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('gravoz_recently_viewed');
    } catch { /* ignore */ }
  }
}

/**
 * Track user event - disabled (no tracking stored in localStorage)
 */
export function trackEvent(_event: Omit<BehaviorEvent, 'timestamp'>) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('gravoz_recently_viewed');
    } catch { /* ignore */ }
  }
}

/**
 * Convenience helper to sense color taste when user switches swatches - no-op
 */
export function recordColorTaste(_params: {
  productId: string;
  productName: string;
  color: string;
  subCategory?: string;
  targetAudience?: string;
  price?: number;
}) {
  // disabled as requested
}

/**
 * Extract recommendation signals
 */
export function extractSignals(): RecommendationSignals {
  return {
    colors: [],
    categories: [],
    audiences: [],
    priceRange: null,
    keywords: [],
    recentProductIds: [],
    lastSelectedColor: undefined,
  };
}

/**
 * Clear all behavior data (for privacy or reset)
 */
export function clearBehavior() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('gravoz_recently_viewed');
    } catch { /* ignore */ }
  }
}
