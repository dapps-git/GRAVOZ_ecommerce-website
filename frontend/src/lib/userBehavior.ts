/**
 * GRAVOZ User Behavior Tracker
 * 
 * Tracks user signals locally (searches, views, cart, wishlist)
 * and exposes extracted recommendation signals for the engine.
 * 
 * All data stays client-side in localStorage — no PII sent to server.
 */

export interface BehaviorEvent {
  type: 'search' | 'view' | 'cart' | 'wishlist';
  query?: string;
  productId?: string;
  productName?: string;
  colors?: string[];
  subCategory?: string;
  targetAudience?: string;
  price?: number;
  timestamp: number;
}

export interface RecommendationSignals {
  colors: string[];           // e.g. ['black', 'brown']
  categories: string[];       // e.g. ['casual sandal', 'leather shoe']
  audiences: string[];        // e.g. ['men', 'women']
  priceRange: { min: number; max: number } | null;
  keywords: string[];         // raw search terms
  recentProductIds: string[]; // viewed/carted/wishlisted product IDs
}

const STORAGE_KEY = 'gravoz_behavior';
const MAX_EVENTS = 40;

/**
 * Load events from localStorage (safe, won't throw)
 */
export function loadEvents(): BehaviorEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save events to localStorage
 */
function saveEvents(events: BehaviorEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
  } catch { /* storage full — ignore */ }
}

/**
 * Track a user event
 */
export function trackEvent(event: Omit<BehaviorEvent, 'timestamp'>) {
  if (typeof window === 'undefined') return;
  const events = loadEvents();
  const newEvent: BehaviorEvent = { ...event, timestamp: Date.now() };

  // De-duplicate: remove older same-type+productId event
  const dedupedEvents = events.filter(
    (e) => !(e.type === newEvent.type && e.productId === newEvent.productId && e.productId)
  );

  saveEvents([newEvent, ...dedupedEvents]);
}

/**
 * Extract recommendation signals from stored events (last 30 days)
 */
export function extractSignals(): RecommendationSignals {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days ago
  const events = loadEvents().filter((e) => e.timestamp > cutoff);

  const colorCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const audienceCounts: Record<string, number> = {};
  const prices: number[] = [];
  const keywords: string[] = [];
  const recentProductIds: string[] = [];

  // Weight multipliers: wishlist/cart > view > search
  const weights: Record<BehaviorEvent['type'], number> = {
    wishlist: 4,
    cart: 3,
    view: 2,
    search: 1,
  };

  for (const event of events) {
    const w = weights[event.type] ?? 1;

    // Extract color signals
    if (event.colors?.length) {
      for (const color of event.colors) {
        const c = color.toLowerCase();
        colorCounts[c] = (colorCounts[c] || 0) + w;
      }
    }

    // Extract category signals
    if (event.subCategory) {
      const cat = event.subCategory.toLowerCase();
      categoryCounts[cat] = (categoryCounts[cat] || 0) + w;
    }

    // Extract audience signals
    if (event.targetAudience) {
      const aud = event.targetAudience.toLowerCase();
      audienceCounts[aud] = (audienceCounts[aud] || 0) + w;
    }

    // Extract price signals
    if (event.price) prices.push(event.price);

    // Extract search keywords
    if (event.type === 'search' && event.query) {
      const terms = event.query.toLowerCase().split(/\s+/).filter(Boolean);
      for (const term of terms) {
        if (!keywords.includes(term)) keywords.push(term);
      }
    }

    // Collect recent product IDs
    if (event.productId && !recentProductIds.includes(event.productId)) {
      recentProductIds.push(event.productId);
    }
  }

  // Sort by frequency, take top signals
  const topColors = Object.entries(colorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([k]) => k);

  const topCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => k);

  const topAudiences = Object.entries(audienceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([k]) => k);

  const priceRange = prices.length > 0
    ? {
        min: Math.max(0, Math.min(...prices) * 0.7),
        max: Math.max(...prices) * 1.4,
      }
    : null;

  return {
    colors: topColors,
    categories: topCategories,
    audiences: topAudiences,
    priceRange,
    keywords: keywords.slice(0, 10),
    recentProductIds: recentProductIds.slice(0, 20),
  };
}

/**
 * Clear all behavior data (for privacy)
 */
export function clearBehavior() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
