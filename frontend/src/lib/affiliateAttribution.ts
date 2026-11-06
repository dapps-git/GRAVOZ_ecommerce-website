/**
 * Client-side Attribution Manager for Affiliate Marketing & Influencer Tracking
 * Persists attribution across navigation, page refreshes, and auth transitions
 * using both localStorage and cookie.
 */

export interface StoredAttribution {
  influencerId?: string;
  influencerName?: string;
  affiliateCode?: string;
  timestamp: number;
}

const STORAGE_KEY = 'gravoz_influencer_attribution';
const COOKIE_KEY = 'gravoz_influencer_attribution';
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function getStoredAttribution(): StoredAttribution | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Try localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.influencerId || parsed.affiliateCode)) {
        if (Date.now() - (parsed.timestamp || 0) < ATTRIBUTION_TTL_MS) {
          return parsed;
        }
      }
    }

    // 2. Fallback to Cookie
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + COOKIE_KEY + '=([^;]*)'));
    if (match && match[2]) {
      const decoded = decodeURIComponent(match[2]);
      const parsed = JSON.parse(decoded);
      if (parsed && (parsed.influencerId || parsed.affiliateCode)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export function setStoredAttribution(data: {
  influencerId?: string;
  influencerName?: string;
  affiliateCode?: string;
}): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: StoredAttribution = {
      influencerId: data.influencerId ? String(data.influencerId).trim() : undefined,
      influencerName: data.influencerName ? String(data.influencerName).trim() : undefined,
      affiliateCode: data.affiliateCode ? String(data.affiliateCode).trim().toUpperCase() : undefined,
      timestamp: Date.now(),
    };

    const str = JSON.stringify(payload);
    localStorage.setItem(STORAGE_KEY, str);

    // Set 30-day cookie so server/middleware can also read if needed
    const maxAge = Math.floor(ATTRIBUTION_TTL_MS / 1000);
    document.cookie = `${COOKIE_KEY}=${encodeURIComponent(str)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    // ignore
  }
}

export function clearStoredAttribution(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  } catch {
    // ignore
  }
}

/**
 * Capture attribution from URL query parameters and store persistently.
 * Supports:
 *   - ?influencer=Aisha&influencerId=671abc123456789
 *   - ?ref=AISHA (affiliate-code-only)
 *   - ?influencerCode=AISHA
 */
export function captureAttributionFromUrl(searchParams: URLSearchParams | { get: (k: string) => string | null }): StoredAttribution | null {
  const influencerId = searchParams.get('influencerId')?.trim() || '';
  const influencerName = searchParams.get('influencer')?.trim() || '';
  const refCode = (searchParams.get('ref') || searchParams.get('influencerCode'))?.trim() || '';

  if (influencerId || refCode) {
    const attribution: {
      influencerId?: string;
      influencerName?: string;
      affiliateCode?: string;
    } = {};

    if (influencerId) attribution.influencerId = influencerId;
    if (influencerName) attribution.influencerName = influencerName;
    if (refCode) attribution.affiliateCode = refCode.toUpperCase();

    setStoredAttribution(attribution);
    return getStoredAttribution();
  }

  return null;
}

