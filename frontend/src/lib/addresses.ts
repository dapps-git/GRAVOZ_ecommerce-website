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
 * Format a structured address into a clean multi-line display string
 */
export function formatAddressToString(addr: Partial<SavedAddress>): string {
  const parts = [
    addr.street,
    addr.city ? (addr.postalCode ? `${addr.city} - ${addr.postalCode}` : addr.city) : '',
    addr.state ? (addr.country ? `${addr.state}, ${addr.country}` : addr.state) : (addr.country || 'India'),
  ].filter(Boolean);
  return parts.join('\n');
}

/**
 * Parse an address string into structured parts
 */
export function parseAddressFromString(
  str: string,
  defaultName = '',
  defaultPhone = ''
): Partial<SavedAddress> {
  if (!str || !str.trim()) {
    return {
      name: defaultName,
      phone: defaultPhone,
      street: '',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600040',
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
      'Chennai',
    state:
      lines.find((l) =>
        ['tamil nadu', 'kerala', 'karnataka', 'maharashtra', 'delhi', 'telangana', 'andhra'].some((st) =>
          l.toLowerCase().includes(st)
        )
      ) || 'Tamil Nadu',
    postalCode: postalCode || (lines.find((l) => /^\d{6}$/.test(l)) || '600040'),
    country: 'India',
  };
}

/**
 * Load saved addresses from localStorage or construct from user profile.
 * Filters out any legacy dummy placeholders.
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
        // Filter out legacy dummy entries (Sarah Johnson / John Doe)
        const cleanAddresses = parsed.filter(
          (a) =>
            a.name !== 'Sarah Johnson' &&
            a.name !== 'John Doe' &&
            a.phone !== '+91 98765 43210' &&
            a.phone !== '+91 91234 56789'
        );

        if (cleanAddresses.length > 0) {
          return cleanAddresses.map((a, idx) => ({
            ...a,
            name: a.name || user?.name || '',
            phone: a.phone || user?.phone || '',
            postalCode: a.postalCode || (a.street && (a.street.match(/\b\d{6}\b/) || [])[0]) || '600040',
            isDefault: idx === 0 ? (a.isDefault ?? true) : Boolean(a.isDefault),
          }));
        }
      }
    }
  } catch (err) {
    console.error('Failed to load saved addresses:', err);
  }

  // Fallback: If user has profile address or name/phone, initialize a real saved address
  if (user && (user.name || user.address || user.phone)) {
    const parsed = parseAddressFromString(user.address || '', user.name || '', user.phone || '');
    const initial: SavedAddress = {
      id: 'addr_' + Date.now(),
      name: user.name || '',
      phone: user.phone || '',
      street: parsed.street || user.address || '',
      city: parsed.city || 'Chennai',
      state: parsed.state || 'Tamil Nadu',
      postalCode: parsed.postalCode || '600040',
      country: parsed.country || 'India',
      isDefault: true,
      label: 'Home',
    };

    try {
      localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify([initial]));
    } catch {}

    return [initial];
  }

  return [];
}

/**
 * Persist saved addresses to localStorage
 */
export function saveSavedAddresses(addresses: SavedAddress[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(addresses));
  } catch (err) {
    console.error('Failed to save addresses:', err);
  }
}
