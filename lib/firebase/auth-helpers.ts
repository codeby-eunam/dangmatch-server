import { NextRequest } from 'next/server';
import { getAdminAuth } from './admin';

/**
 * Verifies the Firebase ID token from the `Authorization: Bearer <token>` header
 * and returns the caller's uid. Returns null if the header is missing or the
 * token fails verification — callers must treat that as unauthenticated.
 */
export async function verifyRequestUid(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') ?? '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(match[1]);
    return decoded.uid;
  } catch {
    return null;
  }
}
