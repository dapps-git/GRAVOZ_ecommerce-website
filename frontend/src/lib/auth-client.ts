/**
 * GRAVOZ Customer Auth Client SDK
 * Ready-to-use async functions for frontend authentication UI components.
 */

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  rewardPoints: number;
  referralCode: string;
  tier: string;
  authProvider: string;
  totalOrders?: number;
  totalSpent?: number;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: AuthUser;
  error?: string;
  resetToken?: string;
  resetLink?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  referredBy?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface GoogleAuthPayload {
  credential?: string;
  googleId?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

/**
 * Register a new user account (creates 2-week persistent JWT session)
 */
export async function registerAccount(payload: RegisterPayload): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error occurred during registration' };
  }
}

/**
 * Log in with email and password (creates 2-week persistent JWT session)
 */
export async function loginAccount(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error occurred during login' };
  }
}

/**
 * Log in / Register with Google OAuth token or credentials (creates 2-week persistent JWT session)
 */
export async function loginWithGoogle(payload: GoogleAuthPayload): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error occurred during Google authentication' };
  }
}

/**
 * Request password reset email / instructions
 */
export async function forgotPassword(email: string): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error occurred while requesting password reset' };
  }
}

/**
 * Reset password using verification token and automatically log in
 */
export async function resetPassword(payload: ResetPasswordPayload): Promise<AuthResponse> {
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error occurred while resetting password' };
  }
}

/**
 * Log out user (destroys cookie session)
 */
export async function logoutAccount(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error occurred during logout' };
  }
}

/**
 * Get currently authenticated user details from active session
 */
export async function getCurrentUser(): Promise<{ authenticated: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
    });
    return await res.json();
  } catch (err: any) {
    return { authenticated: false, error: err.message };
  }
}
