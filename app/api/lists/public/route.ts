import { NextResponse } from 'next/server';
import { getPublicLists } from '@/lib/firebase/lists-admin';

export async function GET() {
  try {
    const lists = await getPublicLists();
    return NextResponse.json({ lists });
  } catch (err) {
    console.error('[GET /api/lists/public]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}