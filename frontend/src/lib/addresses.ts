export interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
  label?: string;
}

export const ADDRESSES_STORAGE_KEY = 'gravoz_saved_addresses';

/**
 * Check if an address string is a legacy placeholder or dummy default address
 */
export function isDummyDefaultAddress(addrStr?: string): boolean {
  if (!addrStr) return false;
  const clean = addrStr.trim().toLowerCase();
  if (
    clean === 'chennai - 600040\ntamil nadu, india' ||
    clean === 'chennai - 600040, tamil nadu, india' ||
    clean === 'chennai - 600040' ||
    clean === 'tamil nadu, india' ||
    (clean.includes('chennai - 600040') &&
      !clean.includes('street') &&
      !clean.includes('road') &&
      !clean.includes('flat') &&
      !clean.includes('house') &&
      !clean.includes('nagar'))
  ) {
    return true;
  }
  return false;
}

/**
 * Format a structured address into a clean multi-line display string
 */
export function formatAddressToString(addr: Partial<SavedAddress>): string {
  if (!addr) return '';
  // If there is no street address, don't format an incomplete or orphan city line
  if (!addr.street || !addr.street.trim()) return '';

  const parts = [
    addr.street.trim(),
    addr.city ? (addr.postalCode ? `${addr.city} - ${addr.postalCode}` : addr.city) : '',
    addr.state ? (addr.country ? `${addr.state}, ${addr.country}` : addr.state) : (addr.country || 'India'),
  ].filter(Boolean);
  return parts.join('\n');
}

/**
 * Parse an address string into structured parts without injecting fake default locations
 */
export function parseAddressFromString(
  str: string,
  defaultName = '',
  defaultPhone = ''
): Partial<SavedAddress> {
  if (!str || !str.trim() || isDummyDefaultAddress(str)) {
    return {
      name: defaultName,
      phone: defaultPhone,
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    };
  }

  const lines = str.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  const pinMatch = str.match(/\b\d{6}\b/);
  const postalCode = pinMatch ? pinMatch[0] : '';

  return {
    name: defaultName,
    phone: defaultPhone,
    street: lines[0] || str.trim(),
    city:
      lines.find((l) =>
        ['chennai', 'mumbai', 'delhi', 'bangalore', 'bengaluru', 'kochi', 'calicut', 'hyderabad', 'kolkata', 'pune'].some(
          (city) => l.toLowerCase().includes(city)
        )
      ) ||
      lines[1] ||
      '',
    state:
      lines.find((l) =>
        ['tamil nadu', 'kerala', 'karnataka', 'maharashtra', 'delhi', 'telangana', 'andhra'].some((st) =>
          l.toLowerCase().includes(st)
        )
      ) || '',
    postalCode: postalCode || (lines.find((l) => /^\d{6}$/.test(l)) || ''),
    country: 'India',
  };
}

/**
 * Load saved addresses from localStorage or construct from real user profile.
 * Completely filters out legacy dummy placeholders and dummy defaults.
 */
export function loadSavedAddresses(
  user?: { name?: string; phone?: string; address?: string } | null
): SavedAddress[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(ADDRESSES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Filter out legacy dummy entries (Sarah Johnson / John Doe) and placeholder default addresses
        const cleanAddresses = parsed.filter(
          (a) =>
            a &&
            typeof a === 'object' &&
            a.name !== 'Sarah Johnson' &&
            a.name !== 'John Doe' &&
            a.phone !== '+91 98765 43210' &&
            a.phone !== '+91 91234 56789' &&
            a.street &&
            a.street.trim() &&
            !isDummyDefaultAddress(a.street) &&
            !(a.city === 'Chennai' && a.postalCode === '600040' && (!a.street || a.street.length < 3))
        );

        if (cleanAddresses.length > 0) {
          return cleanAddresses.map((a, idx) => ({
            ...a,
            name: a.name || user?.name || '',
            phone: a.phone || user?.phone || '',
            postalCode: a.postalCode || (a.street && (a.street.match(/\b\d{6}\b/) || [])[0]) || '',
            isDefault: idx === 0 ? (a.isDefault ?? true) : Boolean(a.isDefault),
          }));
        } else {
          // If all entries were dummy, clear out localStorage
          localStorage.removeItem(ADDRESSES_STORAGE_KEY);
        }
      }
    }
  } catch (err) {
    console.error('Failed to load saved addresses:', err);
  }

  // Fallback: ONLY initialize if user has a real, non-dummy profile address with street info
  if (user && user.address && user.address.trim() && !isDummyDefaultAddress(user.address)) {
    const parsed = parseAddressFromString(user.address, user.name || '', user.phone || '');
    if (parsed.street && parsed.street.trim()) {
      const initial: SavedAddress = {
        id: 'addr_' + Date.now(),
        name: user.name || '',
        phone: user.phone || '',
        street: parsed.street,
        city: parsed.city || '',
        state: parsed.state || '',
        postalCode: parsed.postalCode || '',
        country: parsed.country || 'India',
        isDefault: true,
        label: 'Home',
      };

      try {
        localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify([initial]));
      } catch {}

      return [initial];
    }
  }

  return [];
}

/**
 * Persist saved addresses to localStorage
 */
export function saveSavedAddresses(addresses: SavedAddress[]): void {
  if (typeof window === 'undefined') return;
  try {
    const valid = addresses.filter(
      (a) =>
        a &&
        a.street &&
        a.street.trim() &&
        !isDummyDefaultAddress(a.street) &&
        !(a.city === 'Chennai' && a.postalCode === '600040' && (!a.street || a.street.length < 3))
    );
    localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(valid));
  } catch (err) {
    console.error('Failed to save addresses:', err);
  }
}
