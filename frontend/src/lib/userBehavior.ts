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
const MAX_EVENTS = 50;

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
 * Track a user event with taste sensing
 */
export function trackEvent(event: Omit<BehaviorEvent, 'timestamp'>) {
  if (typeof window === 'undefined') return;
  const events = loadEvents();
  const newEvent: BehaviorEvent = { ...event, timestamp: Date.now() };

  // If selectedColor is specified, ensure it's in the colors list for immediate sensing
  if (newEvent.selectedColor) {
    const normColor = newEvent.selectedColor.trim();
    if (!newEvent.colors) {
      newEvent.colors = [normColor];
    } else if (!newEvent.colors.some((c) => c.toLowerCase() === normColor.toLowerCase())) {
      newEvent.colors = [normColor, ...newEvent.colors];
    }
  }

  // De-duplicate: remove older same-type+productId event if identical
  const dedupedEvents = events.filter(
    (e) => !(e.type === newEvent.type && e.productId === newEvent.productId && e.productId && e.selectedColor === newEvent.selectedColor)
  );

  saveEvents([newEvent, ...dedupedEvents]);
}

/**
 * Convenience helper to sense color taste when user switches swatches
 */
export function recordColorTaste(params: {
  productId: string;
  productName: string;
  color: string;
  subCategory?: string;
  targetAudience?: string;
  price?: number;
}) {
  trackEvent({
    type: 'color_select',
    productId: params.productId,
    productName: params.productName,
    selectedColor: params.color,
    colors: [params.color],
    subCategory: params.subCategory,
    targetAudience: params.targetAudience,
    price: params.price,
  });
}

/**
 * Extract recommendation signals from stored events (last 30 days)
 * Weights recent interactions and explicit taste indicators (color clicks, wishlist, cart)
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
  let lastSelectedColor: string | undefined = undefined;

  // Weight multipliers: explicit taste actions get highest weights
  const weights: Record<BehaviorEvent['type'], number> = {
    color_select: 5, // user explicitly chose this color!
    wishlist: 4,     // high affinity
    cart: 4,         // high intent
    view: 2,         // general browsing
    search: 1,       // discovery
  };

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const baseW = weights[event.type] ?? 1;
    // Recency bonus: events in the top 10 most recent get +1 weight
    const recencyBonus = i < 10 ? 1 : 0;
    const w = baseW + recencyBonus;

    // Track the very latest selected color
    if (!lastSelectedColor && event.selectedColor) {
      lastSelectedColor = event.selectedColor;
    }

    // Extract color signals
    if (event.colors?.length) {
      for (const color of event.colors) {
        if (!color || typeof color !== 'string') continue;
        const c = color.trim().toLowerCase();
        if (c.length > 1) {
          // Extra boost if it was specifically the chosen color variant
          const multiplier = (event.selectedColor && event.selectedColor.toLowerCase() === c) ? 1.5 : 1;
          colorCounts[c] = (colorCounts[c] || 0) + (w * multiplier);
        }
      }
    }

    // Extract category & model signals
    if (event.subCategory) {
      const cat = event.subCategory.trim().toLowerCase();
      categoryCounts[cat] = (categoryCounts[cat] || 0) + w;
    }

    // Extract model signals from product name
    if (event.productName) {
      const nameLower = event.productName.toLowerCase();
      const shoeTypes = ['boot', 'boots', 'loafer', 'loafers', 'oxford', 'oxfords', 'sandal', 'sandals', 'sneaker', 'sneakers', 'formal', 'casual'];
      for (const st of shoeTypes) {
        if (nameLower.includes(st)) {
          categoryCounts[st] = (categoryCounts[st] || 0) + Math.round(w * 0.7);
        }
      }
    }

    // Extract audience signals
    if (event.targetAudience) {
      const aud = event.targetAudience.trim().toLowerCase();
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

  // Sort by weighted taste score, take top signals
  const topColors = Object.entries(colorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([k]) => k);

  const topCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([k]) => k);

  const topAudiences = Object.entries(audienceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([k]) => k);

  const priceRange = prices.length > 0
    ? {
        min: Math.max(0, Math.min(...prices) * 0.65),
        max: Math.max(...prices) * 1.5,
      }
    : null;

  return {
    colors: topColors,
    categories: topCategories,
    audiences: topAudiences,
    priceRange,
    keywords: keywords.slice(0, 10),
    recentProductIds: recentProductIds.slice(0, 25),
    lastSelectedColor,
  };
}

/**
 * Clear all behavior data (for privacy or reset)
 */
export function clearBehavior() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
