import { NextResponse } from 'next/server';
import { getAdminSession, AdminJwtPayload } from './auth';

/**
 * Server-side guard for Admin API Route Handlers.
 * Ensures the requester has a valid, verified Admin JWT session.
 * 
 * Usage:
 *   const auth = await requireAdmin();
 *   if ('error' in auth) return auth.error;
 *   const { session } = auth;
 */
export async function requireAdmin(): Promise<
  { session: AdminJwtPayload } | { error: NextResponse }
> {
  try {
    const session = await getAdminSession();
    if (!session || !session.adminId) {
      return {
        error: NextResponse.json(
          { error: 'Unauthorized. Valid admin credentials required.' },
          { status: 401 }
        ),
      };
    }
    return { session };
  } catch (err: any) {
    return {
      error: NextResponse.json(
        { error: 'Authentication failed. Please log in again.' },
        { status: 401 }
      ),
    };
  }
}
