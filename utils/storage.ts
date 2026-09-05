// Safe localStorage wrapper — SSR-safe (Next.js runs server-side)
const isClient = typeof window !== 'undefined';

export const storage = {
  get<T>(key: string): T | null {
    if (!isClient) return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },

  // Writes can throw even on the client: Safari private mode rejects them and
  // any browser throws once the quota is full. Losing a cached value is fine;
  // taking down sign-in or the cart with it is not.
  set<T>(key: string, value: T): void {
    if (!isClient) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable or full */
    }
  },

  remove(key: string): void {
    if (!isClient) return;
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  },

  clear(): void {
    if (!isClient) return;
    try {
      localStorage.clear();
    } catch {
      /* storage unavailable */
    }
  },
};

export const AUTH_TOKEN_KEY = 'wigs_access_token';
export const AUTH_REFRESH_KEY = 'wigs_refresh_token';
export const GUEST_CART_KEY = 'wigs_guest_cart';
